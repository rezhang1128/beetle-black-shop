// AdminProductForm.tsx
import { useRef, useState, useEffect } from "react";
import {
    Alert, Box, Button, Snackbar, Stack, TextField, Typography
} from "@mui/material";
import { api } from "../api";
import { useDropzone } from "react-dropzone"

export default function AdminProductForm({
    shopId,
    onSaved,
    initialData
}: { shopId: number; onSaved: () => void; initialData?: { id?: number; name?: string; description?: string; price_cents?: number; photo?: string }; }) {
    const apiRoot = (import.meta.env.VITE_API as string).replace("/api", "");
    const [id, setId] = useState<number | "">(initialData?.id || "");
    const [name, setName] = useState(initialData?.name || "");
    const [description, setDescription] = useState(initialData?.description || "");
    const [priceCents, setPriceCents] = useState<number | "">(initialData?.price_cents || "");
    const [photoPreview, setPhotoPreview] = useState<string | null>(
        initialData?.photo ? `${import.meta.env.VITE_API_ROOT}/uploads/${initialData.photo}` : null
    );
    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const [busy, setBusy] = useState(false);
    const [snackbar, setSnackbar] = useState<{ open: boolean; severity: "success" | "error"; message: string } | null>(null);

    const fileRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setId(initialData?.id ?? "");
        setName(initialData?.name ?? "");
        setDescription(initialData?.description ?? "");
        setPriceCents(initialData?.price_cents ?? "");
        setPhotoFile(null);
        setPhotoPreview(initialData?.photo ? `${apiRoot}/uploads/${initialData.photo}` : null);
        if (fileRef.current) fileRef.current.value = "";
    }, [initialData, apiRoot]);
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

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!shopId) {
            setSnackbar({ open: true, severity: "error", message: "Please select a shop first." });
            return;
        }
        try {
            setBusy(true);
            const fd = new FormData();
            fd.append("shop_id", String(shopId));
            if (id !== "") fd.append("id", String(id));
            fd.append("name", name.trim());
            fd.append("description", description.trim());
            fd.append("price_cents", String(priceCents || 0));
            if (photoFile) fd.append("photo", photoFile);

            const endpoint = id === "" ? "/products.php?action=create" : "/products.php?action=update";
            await api.post(endpoint, fd, { headers: { "Content-Type": "multipart/form-data" } });

            setSnackbar({ open: true, severity: "success", message: id === "" ? "Product created" : "Product updated" });
            // reset if creating
            if (id === "") {
                setName("");
                setDescription("");
                setPriceCents("");
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
                    label="Price (cents)"
                    type="number"
                    value={priceCents}
                    onChange={(e) => setPriceCents(e.target.value === "" ? "" : Number(e.target.value))}
                    inputProps={{ min: 0, step: 1 }}
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

                <Button type="submit" variant="contained" disabled={busy}>
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
