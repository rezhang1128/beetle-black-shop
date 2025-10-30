import { useEffect, useState } from "react"
import {
    Alert,
    Box,
    Button,
    Container,
    Paper,
    Snackbar,
    Stack,
    TextField,
    Typography,
} from "@mui/material"
import { api } from "../api"
import type { User } from "../types"

type MeResponse = { user: User | null }


type LoginResponse = { success: boolean; user?: User }


export default function Login() {
    const [email, setEmail] = useState("admin@example.com")
    const [password, setPassword] = useState("admin123")
    const [me, setMe] = useState<User | null>(null)

    const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: "success" | "error" } | null>(
        null,
    )

    useEffect(() => {
        api.post<MeResponse>("/auth.php?action=me").then((r) => setMe(r.data.user)).catch(() => { })
    }, [])


    async function login() {
        try {
            const { data } = await api.post<LoginResponse>("/auth.php?action=login", { action: "login", email, password })
            if (data.success && data.user) {
                setMe(data.user)
                setSnackbar({ open: true, message: "Logged in successfully", severity: "success" })
            } else {
                setSnackbar({ open: true, message: "Invalid credentials", severity: "error" })
            }
        } catch (error) {
            console.error(error)
            setSnackbar({ open: true, message: "Login failed", severity: "error" })
        }
    }
    async function logout() {
        try {
            await api.post("/auth.php?action=logout", { action: "logout" })
            setMe(null)
            setSnackbar({ open: true, message: "Logged out", severity: "success" })
        } catch (error) {
            console.error(error)
            setSnackbar({ open: true, message: "Logout failed", severity: "error" })
        }
    }

    return (
        <Container maxWidth="sm" sx={{ py: 4 }}>
            <Paper elevation={3} sx={{ p: 4 }}>
                <Stack spacing={3}>
                    <Box>
                        <Typography variant="h4" component="h1" gutterBottom>
                            Admin Login
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Enter your credentials to manage shops and products.
                        </Typography>
                    </Box>
                    <Stack spacing={2}>
                        <TextField label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} fullWidth />
                        <TextField
                            label="Password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            fullWidth
                        />
                    </Stack>
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                        <Button variant="contained" onClick={login} fullWidth>
                            Login
                        </Button>
                        {me && (
                            <Button variant="outlined" color="secondary" onClick={logout} fullWidth>
                                Logout
                            </Button>
                        )}
                    </Stack>
                    {me ? (
                        <Alert severity="success">Logged in as {me.email}</Alert>
                    ) : (
                        <Alert severity="info">You are not logged in.</Alert>
                    )}
                    <Box component="pre" sx={{ bgcolor: "grey.100", p: 2, borderRadius: 1, overflow: "auto" }}>
                        {JSON.stringify(me, null, 2)}
                    </Box>
                </Stack>
            </Paper>
            <Snackbar
                open={Boolean(snackbar?.open)}
                autoHideDuration={3000}
                onClose={() => setSnackbar(null)}
                anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
            >
                {snackbar && <Alert severity={snackbar.severity}>{snackbar.message}</Alert>}
            </Snackbar>
        </Container>
    )
}