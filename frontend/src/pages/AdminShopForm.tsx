import { useRef, useState, useEffect } from "react"
import { useDropzone } from "react-dropzone"
import {
    Alert,
    Box,
    Button,
    Snackbar,
    Stack,
    TextField,
    Typography,
} from "@mui/material"
import { api } from "../api"
import AddressInput from "../components/AddressInput"

export default function AdminShopForm({ onSaved, initialData }: { onSaved: () => void; initialData?: { id?: number; name?: string; address?: string; photo?: string }; }) {
    const apiRoot = (import.meta.env.VITE_API as string).replace("/api", "");
    const [id, setId] = useState<number | "">(initialData?.id ?? "");
    const [name, setName] = useState(initialData?.name ?? "");
    const [address, setAddress] = useState(initialData?.address || "");
    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const [photoPreview, setPhotoPreview] = useState<string | null>(
        initialData?.photo ? `${import.meta.env.VITE_API_ROOT}/uploads/${initialData.photo}` : null
    );
    const [busy, setBusy] = useState(false)
    const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: "success" | "error" } | null>(
        null,
    )
    const fileRef = useRef<HTMLInputElement>(null)
    useEffect(() => {
        setId(initialData?.id ?? "");
        setName(initialData?.name ?? "");
        setAddress(initialData?.address ?? "");
        setPhotoFile(null);
        setPhotoPreview(initialData?.photo ? `${apiRoot}/uploads/${initialData.photo}` : null);
        if (fileRef.current) fileRef.current.value = "";
    }, [initialData, apiRoot]);
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

function onFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] || null
    setPhotoFile(file)
    setPhotoPreview(file ? URL.createObjectURL(file) : null)
}
function pickFile() {
    const el = fileRef.current
    if (!el) return
    const withPicker = el as HTMLInputElement & { showPicker?: () => void }
    if (typeof withPicker.showPicker === "function") {
        withPicker.showPicker()
    } else {
        el.click()
    }
}
    async function submit(event: React.FormEvent) {
        event.preventDefault();
        setBusy(true);
        try {
            const fd = new FormData();
            if (id !== "") fd.append("id", String(id));
            fd.append("name", name);
            fd.append("address", address);
            if (photoFile) fd.append("photo", photoFile);

            const url = id === "" ? "/shops.php?action=create" : "/shops.php?action=update";
            await api.post(url, fd);

            setSnackbar({ open: true, message: "Shop saved successfully", severity: "success" });

            // If creating, clear the form. If updating, let AdminDashboard close edit mode via onSaved()
            if (id === "") {
                setName("");
                setAddress("");
                setPhotoFile(null);
                setPhotoPreview(null);
                if (fileRef.current) fileRef.current.value = "";
            }

            onSaved();
        } catch (error) {
            console.error("[AdminShopForm] Save failed:", error);
            setSnackbar({ open: true, message: "Upload failed", severity: "error" });
        } finally {
            setBusy(false);
        }
    }

return (
    <Box component="form" onSubmit={submit} sx={{ display: "grid", gap: 2 }}>
        <TextField
            label="Name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
        />
        <Stack spacing={1}>
            <Typography variant="body2" color="text.secondary">
                Address
            </Typography>
            <AddressInput onSelect={setAddress} value={address} />
            {address && (
                <Typography variant="caption" color="text.secondary">
                    Selected: {address}
                </Typography>
            )}
        </Stack>

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
            {id === "" ? "Create" : "Update"} Shop
        </Button>

        <Snackbar
            open={Boolean(snackbar?.open)}
            autoHideDuration={3000}
            onClose={() => setSnackbar(null)}
            anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        >
            {snackbar && <Alert severity={snackbar.severity}>{snackbar.message}</Alert>}
        </Snackbar>
    </Box>
)
}