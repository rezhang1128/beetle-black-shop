import { useEffect, useMemo, useState } from 'react'
import { api } from '../api'
import type { Shop, Product } from '../types'
import Carousel from '../components/Carousel'
import currency from 'currency.js'


export default function Shops() {
    const [shops, setShops] = useState<Shop[]>([])
    const [products, setProducts] = useState<Product[]>([])
    const [shopId, setShopId] = useState<number | null>(null)


    useEffect(() => { api.get<Shop[]>('/shops.php?action=list').then(r => setShops(r.data)) }, [])
    useEffect(() => { if (shopId) api.get<Product[]>(`/products.php?action=byShop&shop_id=${shopId}`).then(r => setProducts(r.data)) }, [shopId])


    async function addToCart(product_id: number) {
        await api.post('/cart.php', { product_id, qty: 1 })
        alert('Added to cart (server-saved)')
    }


    const apiRoot = useMemo(() => (import.meta.env.VITE_API as string).replace('/api', ''), [])


    return (
        <div style={{ padding: 20 }}>
            <h2>Shops</h2>
            <select onChange={e => setShopId(Number(e.target.value))} defaultValue="">
                <option value="" disabled>Select a shop</option>
                {shops.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>


            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: 16, marginTop: 16 }}>
                {products.map(p => (
                    <div key={p.id} style={{ border: '1px solid #eee', padding: 12, borderRadius: 8 }}>
                        <Carousel images={[p.photo ? `${apiRoot}/uploads/${p.photo}` : 'https://via.placeholder.com/400x240?text=No+Image']} />
                        <h4 style={{ margin: '8px 0' }}>{p.name}</h4>
                        <div>{currency(p.price_cents, { fromCents: true }).format()}</div>
                        <button onClick={() => addToCart(p.id)} style={{ marginTop: 8 }}>Add to cart</button>
                    </div>
                ))}
            </div>
        </div>
    )
}