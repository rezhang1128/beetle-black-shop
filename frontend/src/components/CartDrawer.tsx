import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { api } from '../api'
import currency from 'currency.js'
import type { CartItem } from '../types'


interface Props {
    open: boolean
    onClose: () => void
}


export default function CartDrawer({ open, onClose }: Props) {
    const [items, setItems] = useState<CartItem[]>([])
    const [loading, setLoading] = useState(false)


    const apiRoot = (import.meta.env.VITE_API as string).replace('/api', '')


    const loadCart = async () => {
        setLoading(true)
        try {
            const { data } = await api.get<CartItem[]>('/cart.php')
            setItems(data)
        } finally {
            setLoading(false)
        }
    }


    useEffect(() => {
        if (open) loadCart()
    }, [open])


    const total = useMemo(() => items.reduce((s, i) => s + (i.price_cents * i.qty), 0), [items])


    async function updateQty(product_id: number, qty: number) {
        if (qty <= 0) {
            // Use PUT with qty=0 to remove per our cart.php implementation
            await api.put('/cart.php', { product_id, qty: 0 })
        } else {
            // Update quantity directly
            await api.put('/cart.php', { product_id, qty })
        }
        await loadCart()
    }


    if (!open) return null
    return createPortal(
        <>
            {/* overlay */}
            <div
                onClick={onClose}
                aria-hidden
                style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)',
                    zIndex: 40
                }}
            />


            {/* drawer */}
            <aside
                role="dialog" aria-label="Shopping cart" aria-modal
                style={{
                    position: 'fixed', top: 0, right: 0, bottom: 0,
                    width: '360px', maxWidth: '90vw', background: '#fff',
                    boxShadow: '-4px 0 16px rgba(0,0,0,0.2)', zIndex: 41,
                    display: 'flex', flexDirection: 'column'
                }}
            >
                <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid #eee' }}>
                    <strong>My Cart</strong>
                    <button onClick={onClose} aria-label="Close cart">?</button>
                </header>


                <div style={{ flex: 1, overflow: 'auto', padding: 12 }}>
                    {loading && <div>Loading¡­</div>}
                    {!loading && items.length === 0 && <div>Your cart is empty.</div>}


                    {!loading && items.map(item => (
                        <div key={item.id} style={{ display: 'flex', gap: 12, alignItems: 'center', borderBottom: '1px solid #eee', padding: '8px 0' }}>
                            <img
                                src={item.photo ? `${apiRoot}/uploads/${item.photo}` : 'https://via.placeholder.com/64'}
                                alt={item.name}
                                width={64}
                                height={64}
                                style={{ borderRadius: 6, objectFit: 'cover' }}
                            />
                            <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 600 }}>{item.name}</div>
                                <div style={{ color: '#666' }}>{currency(item.price_cents, { fromCents: true }).format()}</div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                                    <button onClick={() => updateQty(item.product_id, item.qty - 1)} aria-label="Decrease">-</button>
                                    <span>{item.qty}</span>
                                    <button onClick={() => updateQty(item.product_id, item.qty + 1)} aria-label="Increase">+</button>
                                    <button onClick={() => updateQty(item.product_id, 0)} style={{ marginLeft: 'auto' }}>Remove</button>
                                </div>
                            </div>
                            <div>{currency(item.price_cents * item.qty, { fromCents: true }).format()}</div>
                        </div>
                    ))}
                </div>


                <footer style={{ padding: 12, borderTop: '1px solid #eee' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <strong>Total</strong>
                        <strong>{currency(total, { fromCents: true }).format()}</strong>
                    </div>
                    <button
                        style={{ marginTop: 12, width: '100%', padding: '10px 12px', fontSize: 16 }}
                        onClick={() => { window.location.href = '/checkout' }}
                        disabled={items.length === 0}
                    >
                        Go to Checkout
                    </button>
                </footer>
            </aside>
        </>,
        document.body
    )
}