import { useRef, useState } from "react";
import { api } from "../api";
import AddressInput from "../components/AddressInput";
import { useDropzone } from "react-dropzone";
export default function AdminShopForm({ onSaved }: { onSaved: () => void }) {
    const [id, setId] = useState<number | "">("");
    const [name, setName] = useState("");
    const [address, setAddress] = useState("");

    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);

    const fileRef = useRef<HTMLInputElement>(null);
    const onDrop = (acceptedFiles: File[]) => {
        const f = acceptedFiles[0];
        setPhotoFile(f);
        setPhotoPreview(URL.createObjectURL(f));
        console.log("[AdminShopForm] picked via dropzone:", f?.name);
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        accept: { "image/*": [] },
        multiple: false,
        onDrop,
    });
    function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const f = e.target.files?.[0] || null;
        console.log("[AdminShopForm] onFileChange got:", f?.name);
        setPhotoFile(f);
        setPhotoPreview(f ? URL.createObjectURL(f) : null);
    }

    function pickFile() {
        const el = fileRef.current;
        if (!el) return;
        // Use modern showPicker() if supported, fallback to click()
        // @ts-ignore ¡ª showPicker not yet in TS DOM lib
        if (typeof el.showPicker === "function") {
            console.log("[AdminShopForm] Using showPicker()");
            // @ts-ignore
            el.showPicker();
        } else {
            console.log("[AdminShopForm] Using click()");
            el.click();
        }
    }

    async function submit(e: React.FormEvent) {
        e.preventDefault();
        setBusy(true);
        try {
            const fd = new FormData();
            if (id !== "") fd.append("id", String(id));
            fd.append("name", name);
            fd.append("address", address);
            if (photoFile) fd.append("photo", photoFile);

            const url = id === "" ? "/shops.php?action=create" : "/shops.php?action=update";
            console.log("[AdminShopForm] Submitting, hasPhoto?", !!photoFile);
            const { data } = await api.post(url, fd);
            console.log("[AdminShopForm] Server:", data);

            alert("Shop saved successfully!");
            setId("");
            setName("");
            setAddress("");
            setPhotoFile(null);
            setPhotoPreview(null);
            if (fileRef.current) fileRef.current.value = "";
            onSaved();
        } catch (err) {
            console.error("[AdminShopForm] Save failed:", err);
            alert("Upload failed ¡ª see console for details.");
        } finally {
            setBusy(false);
        }
    }

    return (
        <form onSubmit={submit} style={{ display: "grid", gap: 8 }}>
            <label>
                Shop ID (leave empty to create)
                <input
                    value={id}
                    onChange={(e) => setId(e.target.value ? Number(e.target.value) : "")}
                    placeholder=""
                />
            </label>

            <label>
                Name
                <input value={name} onChange={(e) => setName(e.target.value)} required />
            </label>

            <label>
                Address
                <AddressInput onSelect={setAddress} />
            </label>

            <div
                {...getRootProps()}
                style={{
                    border: "2px dashed #ccc",
                    borderRadius: 8,
                    padding: 20,
                    textAlign: "center",
                    cursor: "pointer",
                    background: isDragActive ? "#eef" : "#fafafa",
                }}
            >
                <input {...getInputProps()} />
                <p>{isDragActive ? "Drop the image here..." : "Click or drag image here"}</p>

                {photoPreview && (
                    <div style={{ marginTop: 8 }}>
                        <img
                            src={photoPreview}
                            alt="preview"
                            style={{
                                width: 160,
                                height: 100,
                                objectFit: "cover",
                                border: "1px solid #ddd",
                            }}
                        />
                    </div>
                )}</div>

            <button disabled={busy} type="submit">
                {id === "" ? "Create" : "Update"} Shop
            </button>
        </form>
    );
}
