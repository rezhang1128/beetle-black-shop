import { useEffect, useMemo, useState } from 'react'
import { api } from '../api'
import type { Shop, Product, User } from '../types'
import AdminShopForm from './AdminShopForm'
import AdminProductForm from './AdminProductForm'


export default function AdminDashboard() {
    const [me, setMe] = useState<User | null>(null)
    const [tab, setTab] = useState<'shops' | 'products'>('shops')
    const [shops, setShops] = useState<Shop[]>([])
    const [selectedShopId, setSelectedShopId] = useState<number | null>(null)
    const [products, setProducts] = useState<Product[]>([])


    useEffect(() => { api.post<{ user: User | null }>('/auth.php?action=me').then(r => setMe(r.data.user)) }, [])
    useEffect(() => { if (me && me.role !== 'admin') { alert('Admins only'); } }, [me])


    const apiRoot = useMemo(() => (import.meta.env.VITE_API as string).replace('/api', ''), [])


    // load shops
    const loadShops = async () => { const { data } = await api.get<Shop[]>('/shops.php?action=list'); setShops(data) }
    useEffect(() => { loadShops() }, [])


    // load products for selected shop (admin view)
    const loadProducts = async (shopId: number) => {
        const { data } = await api.get<Product[]>(`/products.php?action=byShop&shop_id=${shopId}`)
        setProducts(data)
    }
    useEffect(() => { if (selectedShopId) loadProducts(selectedShopId) }, [selectedShopId])


    if (!me) return <div style={{ padding: 20 }}>Loading¡­</div>
    if (me.role !== 'admin') return <div style={{ padding: 20 }}>Forbidden: admin only.</div>


    return (
       


        <div style={{ padding: 20 }}>
            <h2>Admin Dashboard</h2>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                <button onClick={() => setTab('shops')} disabled={tab === 'shops'}>Shops</button>
                <button onClick={() => setTab('products')} disabled={tab === 'products'}>Products</button>
            </div>


            {tab === 'shops' && (<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
    <div>
        <h3>All Shops</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
                <tr><th>ID</th><th>Photo</th><th>Name</th><th>Address</th><th>Actions</th></tr>
            </thead>
            <tbody>
                {shops.map(s => (
                    <tr key={s.id}>
                        <td>{s.id}</td>
                        <td>{s.photo ? <img src={`${apiRoot}/uploads/${s.photo}`} width={60} /> : '¡ª'}</td>
                        <td>{s.name}</td>
                        <td>{s.address ?? '¡ª'}</td>
                        <td>
                            <button onClick={() => setSelectedShopId(s.id)}>Products</button>
                            <DeleteShopButton id={s.id} onDone={loadShops} />
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
    <div>
        <h3>Create / Update Shop</h3>
        <AdminShopForm onSaved={loadShops} />
    </div>
</div>
)}


{
    tab === 'products' && (
        <div>
            <h3>Manage Products</h3>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                <label>Select shop:</label>
                <select onChange={e => setSelectedShopId(Number(e.target.value))} defaultValue="">
                    <option value="" disabled>Choose</option>
                    {shops.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
            </div>


            {selectedShopId && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                    <div>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr><th>ID</th><th>Photo</th><th>Name</th><th>Price</th><th>Actions</th></tr>
                            </thead>
                            <tbody>
                                {products.map(p => (
                                    <tr key={p.id}>
                                        <td>{p.id}</td>
                                        <td>{p.photo ? <img src={`${apiRoot}/uploads/${p.photo}`} width={60} /> : '¡ª'}</td>
                                        <td>{p.name}</td>
                                        <td>${(p.price_cents / 100).toFixed(2)}</td>
                                        <td>
                                            <DeleteProductButton id={p.id} onDone={() => loadProducts(selectedShopId)} />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div>
                        <h4>Create / Update Product</h4>
                        <AdminProductForm shopId={selectedShopId} onSaved={() => loadProducts(selectedShopId)} />
                    </div>
                </div>
            )}
        </div>
    )
}
</div >
)
}


function DeleteShopButton({ id, onDone }: { id: number; onDone: () => void }) {
    const del = async () => {
        const fd = new FormData()
        fd.append('id', String(id))
        await api.post('/shops.php?action=delete', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
        onDone()
    }
    return <button onClick={del} style={{ marginLeft: 8 }}>Delete</button>
}


function DeleteProductButton({ id, onDone }: { id: number; onDone: () => void }) {
    const del = async () => {
        const fd = new FormData()
        fd.append('id', String(id))
        await api.post('/products.php?action=delete', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
        onDone()
    }
    return <button onClick={del}>Delete</button>
}