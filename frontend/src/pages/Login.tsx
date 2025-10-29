import { useEffect, useState } from 'react'
import { api } from '../api'
import type { User } from '../types'


type MeResponse = { user: User | null }


type LoginResponse = { success: boolean; user?: User }


export default function Login() {
    const [email, setEmail] = useState('admin@example.com')
    const [password, setPassword] = useState('admin123')
    const [me, setMe] = useState<User | null>(null)


    useEffect(() => {
        api.post<MeResponse>('/auth.php?action=me').then(r => setMe(r.data.user)).catch(() => { })
    }, [])


    async function login() {
        const { data } = await api.post<LoginResponse>('/auth.php?action=login', { action: 'login', email, password })
        if (data.success && data.user) { alert('Logged in'); setMe(data.user) } else { alert('Invalid') }
    }


    async function logout() { await api.post('/auth.php?action=logout', { action: 'logout' }); setMe(null) }


    return (
        <div style={{ padding: 20 }}>
            <h2>Login</h2>
            <div>Email <input value={email} onChange={e => setEmail(e.target.value)} /></div>
            <div>Password <input type="password" value={password} onChange={e => setPassword(e.target.value)} /></div>
            <button onClick={login}>Login</button>
            {me && <button onClick={logout} style={{ marginLeft: 8 }}>Logout</button>}
            <pre>{JSON.stringify(me, null, 2)}</pre>
        </div>
    )
}