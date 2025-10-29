import { useRef, useState } from 'react'
import { api } from '../api'


export default function AdminProductForm({ shopId, onSaved }: { shopId: number; onSaved: () => void }) {
    const [id, setId] = useState<number | ''>('')
    const [name, setName] = useState('')
    const [description, setDescription] = useState('')
    const [priceCents, setPriceCents] = useState<number | ''>('')
    const fileRef = useRef<HTMLInputElement>(null)


    const submit = async (e: React.FormEvent) => {
        e.preventDefault()
        const fd = new FormData()
        if (id !== '') fd.append('id', String(id))
        fd.append('shop_id', String(shopId))
        fd.append('name', name)
        fd.append('description', description)
        fd.append('price_cents', String(priceCents || 0))
        if (fileRef.current?.files?.[0]) fd.append('photo', fileRef.current.files[0])


        if (id === '') await api.post('/products.php?action=create', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
        else await api.post('/products.php?action=update', fd, { headers: { 'Content-Type': 'multipart/form-data' } })


        setId(''); setName(''); setDescription(''); setPriceCents(''); if (fileRef.current) fileRef.current.value = ''
        onSaved()
    }


    if (!shopId) return <div>Select a shop first.</div>


    return (
        <form onSubmit={submit} style={{ display: 'grid', gap: 8 }}>
            <label>Product ID (leave empty to create)
                <input value={id} onChange={e => setId(e.target.value ? Number(e.target.value) : '')} placeholder="" />
            </label>
            <label>Name
                <input value={name} onChange={e => setName(e.target.value)} required />
            </label>
            <label>Description
                <textarea value={description} onChange={e => setDescription(e.target.value)} />
            </label>
            <label>Price (cents)
                <input type="number" value={priceCents} onChange={e => setPriceCents(e.target.value ? Number(e.target.value) : '')} required />
            </label>
            <label>Photo
                <input type="file" ref={fileRef} accept="image/*" />
            </label>
            <button type="submit">{id === '' ? 'Create' : 'Update'} Product</button>
        </form>
    )
}