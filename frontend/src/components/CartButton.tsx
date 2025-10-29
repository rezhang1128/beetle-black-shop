import { useState } from 'react'
import CartDrawer from './CartDrawer'


export default function CartButton() {
    const [open, setOpen] = useState(false)


    return (
        <>
            {/* Floating Button */}
            <button
                onClick={() => setOpen(true)}
                style={{
                    position: 'fixed',
                    bottom: '24px',
                    right: '24px',
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    backgroundColor: '#1e88e5',
                    color: '#fff',
                    border: 'none',
                    fontSize: '20px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
                    cursor: 'pointer',
                    zIndex: 50,
                }}
            > Cart
            </button>


            {/* Cart Drawer */}
            <CartDrawer open={open} onClose={() => setOpen(false)} />
        </>
    )
}