// AdminProductForm.tsx
import { useRef, useState, useEffect, useCallback } from "react";
import {
    Alert, Box, Button, Snackbar, Stack, TextField, Typography
} from "@mui/material";
import { api } from "../api";
import { useDropzone } from "react-dropzone"
import { useCurrency } from "../components/CurrencyContext";
import { baseCurrency, useExchangeRate } from "../hooks/useExchangeRate";

export default function AdminProductForm({
    shopId,
    onSaved,
    initialData
}: { shopId: number; onSaved: () => void; initialData?: { id?: number; name?: string; description?: string; price_cents?: number; photo?: string }; }) {
    const apiRoot = (import.meta.env.VITE_API as string).replace("/api", "");
    const [id, setId] = useState<number | "">(initialData?.id || "");
    const [name, setName] = useState(initialData?.name || "");
    const [description, setDescription] = useState(initialData?.description || "");
    const formatPrice = (cents: number) => (cents / 100).toFixed(2);
    const [priceInput, setPriceInput] = useState<string>(
        initialData?.price_cents !== undefined ? formatPrice(initialData.price_cents) : ""
    );
    const parsedPrice = Number.parseFloat(priceInput);
    const priceCentsPreview =
        priceInput.trim() === "" || Number.isNaN(parsedPrice) ? null : Math.round(parsedPrice * 100);
    const [photoPreview, setPhotoPreview] = useState<string | null>(
        initialData?.photo ? `${import.meta.env.VITE_API_ROOT}/uploads/${initialData.photo}` : null
    );
    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const [busy, setBusy] = useState(false);
    const [snackbar, setSnackbar] = useState<{ open: boolean; severity: "success" | "error"; message: string } | null>(null);
    const { currency } = useCurrency();
    const normalizedCurrency = currency.toUpperCase();
    const { status: rateStatus, rate } = useExchangeRate(normalizedCurrency);
    const priceBaseRef = useRef<number | null>(initialData?.price_cents ?? null);
    const [baseVersion, setBaseVersion] = useState(0);
    const fileRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setId(initialData?.id ?? "");
        setName(initialData?.name ?? "");
        setDescription(initialData?.description ?? "");
        priceBaseRef.current = typeof initialData?.price_cents === "number" ? initialData.price_cents : null;
        setBaseVersion((version) => version + 1);
        setPhotoFile(null);
        setPhotoPreview(initialData?.photo ? `${apiRoot}/uploads/${initialData.photo}` : null);
        if (fileRef.current) fileRef.current.value = "";
    }, [initialData, apiRoot]);

    useEffect(() => {
        const baseValue = priceBaseRef.current;
        if (baseValue == null) {
            setPriceInput("");
            return;
        }
        if (normalizedCurrency === baseCurrency) {
            setPriceInput(baseValue);
            return;
        }
        if (rateStatus === "ready" && rate !== null) {
            setPriceInput(Math.round(baseValue * rate));
        }
    }, [normalizedCurrency, rateStatus, rate, baseVersion]);
    function pickFile() {
        const el = fileRef.current;
        if (!el) return;
        const withPicker = el as HTMLInputElement & { showPicker?: () => void };
        if (typeof withPicker.showPicker === "function") withPicker.showPicker();
        else el.click();
    }
    const onDrop = (acceptedFiles: File[]) => {
        const file = acceptedFiles[0]
        if (!file) return
        setPhotoFile(file)
        setPhotoPreview(URL.createObjectURL(file))
    }
    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        accept: { "image/*": [] },
        multiple: false,
        onDrop,
    })
    function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const f = e.target.files?.[0] || null;
        setPhotoFile(f);
        setPhotoPreview(f ? URL.createObjectURL(f) : null);
    }
    const rateUnavailable = normalizedCurrency !== baseCurrency && rateStatus !== "ready";
    const rateError = normalizedCurrency !== baseCurrency && rateStatus === "error";

    const handlePriceChange = useCallback(
        (value: string) => {
            if (value === "") {
                setPriceInput("");
                priceBaseRef.current = null;
                setBaseVersion((version) => version + 1);
                return;
            }

            const numericValue = Number(value);
            if (Number.isNaN(numericValue)) {
                return;
            }

            setPriceInput(numericValue);

            if (normalizedCurrency === baseCurrency) {
                priceBaseRef.current = numericValue;
                setBaseVersion((version) => version + 1);
                return;
            }

            if (rateStatus === "ready" && rate !== null) {
                priceBaseRef.current = Math.round(numericValue / rate);
                setBaseVersion((version) => version + 1);
            }
        },
        [normalizedCurrency, rateStatus, rate]
    );
    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!shopId) {
            setSnackbar({ open: true, severity: "error", message: "Please select a shop first." });
            return;
        }
        if (rateUnavailable) {
            setSnackbar({ open: true, severity: "error", message: "Please wait for the latest exchange rate before saving." });
            return;
        }
        if (priceBaseRef.current == null) {
            setSnackbar({ open: true, severity: "error", message: "Please enter a price." });
            return;
        }
        try {
            setBusy(true);
            const fd = new FormData();
            fd.append("shop_id", String(shopId));
            if (id !== "") fd.append("id", String(id));
            fd.append("name", name.trim());
            fd.append("description", description.trim());
            const priceCents = priceCentsPreview ?? 0;
            fd.append("price_cents", String(priceCents));
            if (photoFile) fd.append("photo", photoFile);

            const endpoint = id === "" ? "/products.php?action=create" : "/products.php?action=update";
            await api.post(endpoint, fd, { headers: { "Content-Type": "multipart/form-data" } });

            setSnackbar({ open: true, severity: "success", message: id === "" ? "Product created" : "Product updated" });
            // reset if creating
            if (id === "") {
                setName("");
                setDescription("");
                setPriceInput("");
                priceBaseRef.current = null;
                setBaseVersion((version) => version + 1);
                setPhotoFile(null);
                setPhotoPreview(null);
            }
            onSaved();
        } catch (err) {
            console.error(err);
            setSnackbar({ open: true, severity: "error", message: "Failed to save product" });
        } finally {
            setBusy(false);
        }
    }

    return (
        <Box component="form" onSubmit={onSubmit} sx={{ p: 2 }}>
            <Stack spacing={2}>
                <Typography variant="h6">{id === "" ? "Create Product" : "Edit Product"}</Typography>

                <TextField
                    label="Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                />

                <TextField
                    label="Description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    multiline
                    minRows={3}
                />

                <TextField
                    label={`Price (${normalizedCurrency})`}
                    type="number"
                    value={priceInput}
                    onChange={(e) => handlePriceChange(e.target.value)}
                    inputProps={{ min: 0, step: 0.1 }}
                    disabled={rateUnavailable || busy}
                    helperText={
                        rateError
                            ? `Exchange rate unavailable for ${normalizedCurrency}.`
                            : rateUnavailable
                                ? `Loading exchange rate for ${normalizedCurrency}...`
                                : undefined
                    }
                    error={rateError}
                    required
                />

                {/* Photo picker ¡ª same pattern as Shop form */}
                <Stack spacing={1}>
                    <Typography variant="body2" color="text.secondary">
                        Photo
                    </Typography>
                    <Box
                        {...getRootProps()}
                        sx={{
                            border: "2px dashed",
                            borderColor: isDragActive ? "primary.main" : "divider",
                            borderRadius: 2,
                            p: 3,
                            textAlign: "center",
                            cursor: "pointer",
                            bgcolor: isDragActive ? "action.hover" : "background.paper",
                        }}
                    >
                        <input {...getInputProps()} />
                        <Typography variant="body2" color="text.secondary">
                            {isDragActive ? "Drop the image here" : "Drag and drop an image, or click to browse"}
                        </Typography>
                        <Button variant="outlined" sx={{ mt: 2 }} onClick={pickFile} type="button">
                            Choose file
                        </Button>
                    </Box>
                    <input type="file" ref={fileRef} accept="image/*" hidden onChange={onFileChange} />
                    {photoPreview && (
                        <Box
                            component="img"
                            src={photoPreview}
                            alt="Preview"
                            sx={{ width: "100%", maxWidth: 200, borderRadius: 1, border: 1, borderColor: "divider" }}
                        />
                    )}
                </Stack>

                <Button type="submit" variant="contained" disabled={busy || rateUnavailable}>
                    {id === "" ? "Create" : "Update"} Product
                </Button>
            </Stack>

            <Snackbar
                open={Boolean(snackbar?.open)}
                autoHideDuration={3000}
                onClose={() => setSnackbar(null)}
                anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
            >
                {snackbar && <Alert severity={snackbar.severity}>{snackbar.message}</Alert>}
            </Snackbar>
        </Box>
    );
}
