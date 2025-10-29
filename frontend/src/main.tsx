import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import App from './App'
import Login from './pages/Login'
import Shops from './pages/Shops'
import Checkout from './pages/Checkout'
import CartDrawer from './components/CartDrawer'
import AdminDashboard from './pages/AdminDashboard'
import './index.css'


function Shell() {
    const [cartOpen, setCartOpen] = React.useState(false)
    return (
        <>
            <nav style={{ display: 'flex', gap: 12, padding: 12, borderBottom: '1px solid #ddd' }}>
                <Link to="/">Shops</Link>
                
                <Link to="/checkout">Checkout</Link>
                <Link to="/login">Login</Link>
            </nav>
            <Routes>
                <Route path="/" element={<Shops />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/login" element={<Login />} />
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="*" element={<App />} />
            </Routes>
            <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
            <button onClick={() => setCartOpen(true)}>Cart</button>
        </>
    )
}


ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <BrowserRouter>
            <Shell />
        </BrowserRouter>
    </React.StrictMode>
)