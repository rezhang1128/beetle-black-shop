// AdminProductForm.tsx
import { useRef, useState, useEffect, useCallback } from "react";
import {
    Alert, Box, Button, Snackbar, Stack, TextField, Typography
} from "@mui/material";
import { api } from "../api";
import { useDropzone } from "react-dropzone";
import { useCurrency } from "../components/CurrencyContext";
import { baseCurrency, useExchangeRate } from "../hooks/useExchangeRate";

export default function AdminProductForm({
    shopId,
    onSaved,
    initialData
}: {
    shopId: number;
    onSaved: () => void;
    initialData?: {
        id?: number;
        name?: string;
        description?: string;
        price_cents?: number; // base cents
        photo?: string;
    };
}) {
    const apiRoot = (import.meta.env.VITE_API as string).replace("/api", "");
    const [id, setId] = useState<number | "">(initialData?.id ?? "");
    const [name, setName] = useState(initialData?.name ?? "");
    const [description, setDescription] = useState(initialData?.description ?? "");

    const [priceInput, setPriceInput] = useState<string>(
        initialData?.price_cents !== undefined
            ? (initialData.price_cents / 100).toFixed(2)
            : ""
    );

    const priceBaseRef = useRef<number | null>(initialData?.price_cents ?? null);

    const [photoPreview, setPhotoPreview] = useState<string | null>(
        initialData?.photo ? `${apiRoot}/uploads/${initialData.photo}` : null
    );
    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const [busy, setBusy] = useState(false);
    const [snackbar, setSnackbar] = useState<{
        open: boolean; severity: "success" | "error"; message: string
    } | null>(null);

    const { currency } = useCurrency();
    const normalizedCurrency = currency.toUpperCase();
    const { status: rateStatus, rate } = useExchangeRate(normalizedCurrency);

    // A bump to recompute display when base changes (e.g. switching initialData)
    const [baseVersion, setBaseVersion] = useState(0);

    const fileRef = useRef<HTMLInputElement>(null);

    // --- helpers ---
    const isBase = normalizedCurrency === baseCurrency;
    const hasRate = rateStatus === "ready" && typeof rate === "number" && rate > 0;

    const baseCentsToDisplayUnits = useCallback(
        (baseCents: number | null): string => {
            if (baseCents == null) return "";
            const baseUnits = baseCents / 100; // cents -> units in base
            const displayUnits = isBase ? baseUnits : hasRate ? baseUnits * rate! : NaN;
            return Number.isFinite(displayUnits) ? displayUnits.toFixed(2) : "";
        },
        [isBase, hasRate, rate]
    );

    const displayUnitsToBaseCents = useCallback(
        (displayUnits: number): number | null => {
            const baseUnits = isBase ? displayUnits : hasRate ? displayUnits / rate! : NaN;
            if (!Number.isFinite(baseUnits) || baseUnits < 0) return null;
            return Math.round(baseUnits * 100);
        },
        [isBase, hasRate, rate]
    );

    const parsePriceInput = useCallback((value: string): number | null => {
        if (!value.trim()) return null; // empty = no price
        const parsed = Number.parseFloat(value);
        if (Number.isNaN(parsed) || parsed < 0) return null;
        return parsed;
    }, []);

    const updatePriceFromInput = useCallback(
        (value: string) => {
            setPriceInput(value);
            const parsed = parsePriceInput(value);
            if (parsed == null) {
                priceBaseRef.current = null;
                return;
            }

            const baseCents = displayUnitsToBaseCents(parsed);
            priceBaseRef.current = baseCents ?? null;
        },
        [displayUnitsToBaseCents, parsePriceInput]
    );

    // Reset when initialData changes
    useEffect(() => {
        setId(initialData?.id ?? "");
        setName(initialData?.name ?? "");
        setDescription(initialData?.description ?? "");
        priceBaseRef.current = typeof initialData?.price_cents === "number"
            ? initialData!.price_cents
            : null;

        setBaseVersion(v => v + 1);
        setPhotoFile(null);
        setPhotoPreview(initialData?.photo ? `${apiRoot}/uploads/${initialData.photo}` : null);
        if (fileRef.current) fileRef.current.value = "";
    }, [initialData, apiRoot]);

    // Recompute display input whenever the currency/rate/base changes
    useEffect(() => {
        setPriceInput(baseCentsToDisplayUnits(priceBaseRef.current));
    }, [baseCentsToDisplayUnits, normalizedCurrency, rateStatus, rate, baseVersion]);

    // Dropzone / file picking
    const onDrop = (acceptedFiles: File[]) => {
        const file = acceptedFiles[0];
        if (!file) return;
        setPhotoFile(file);
        setPhotoPreview(URL.createObjectURL(file));
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        accept: { "image/*": [] },
        multiple: false,
        onDrop
    });

    function pickFile() {
        const el = fileRef.current;
        if (!el) return;
        const withPicker = el as HTMLInputElement & { showPicker?: () => void };
        if (typeof withPicker.showPicker === "function") withPicker.showPicker();
        else el.click();
    }

    function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const f = e.target.files?.[0] || null;
        setPhotoFile(f);
        setPhotoPreview(f ? URL.createObjectURL(f) : null);
    }

    const rateUnavailable = !isBase && rateStatus !== "ready";
    const rateError = !isBase && rateStatus === "error";

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();

        const parsedPrice = parsePriceInput(priceInput);
        if (parsedPrice == null) {
            setSnackbar({ open: true, severity: "error", message: "Please enter a valid price." });
            return;
        }

        // Convert to cents (float ¡ú int)
        const priceCents = displayUnitsToBaseCents(parsedPrice);
        if (priceCents == null) {
            setSnackbar({
                open: true,
                severity: "error",
                message: "Unable to convert price to base currency."
            });
            return;
        }

        priceBaseRef.current = priceCents;

        const fd = new FormData();
        fd.append("shop_id", String(shopId));
        if (id !== "") fd.append("id", String(id));
        fd.append("name", name.trim());
        fd.append("description", description.trim());
        fd.append("price_cents", String(priceCents));
        if (photoFile) fd.append("photo", photoFile);

        const endpoint = id === "" ? "/products.php?action=create" : "/products.php?action=update";

        setBusy(true);
        try {
            await api.post(endpoint, fd, { headers: { "Content-Type": "multipart/form-data" } });

            setSnackbar({
                open: true,
                severity: "success",
                message: id === "" ? "Product created" : "Product updated"
            });
        onSaved();
        } catch (error) {
            console.error("Failed to save product", error);
            setSnackbar({
                open: true,
                severity: "error",
                message: "Failed to save product. Please try again."
            });
        } finally {
            setBusy(false);
        }
     
    }

    return (
        <Box component="form" onSubmit={onSubmit} sx={{ p: 2 }}>
            <Stack spacing={2}>
               

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
                    type="text"
                    value={priceInput}
                    onChange={(e) => updatePriceFromInput(e.target.value)}
                    inputProps={{ inputMode: "decimal" }}
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

                {/* Photo picker */}
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
