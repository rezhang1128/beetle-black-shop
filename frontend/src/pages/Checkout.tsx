import { useEffect, useMemo, useState } from "react"
import { loadStripe } from "@stripe/stripe-js"
import {
    Elements,
    PaymentElement,
    useElements,
    useStripe,
} from "@stripe/react-stripe-js"
import {
    Alert,
    Box,
    Button,
    CircularProgress,
    Container,
    Divider,
    List,
    ListItem,
    ListItemText,
    Paper,
    Snackbar,
    Stack,
    Typography,
} from "@mui/material"
import currency from "currency.js"
import { api } from "../api"
import type { CartItem } from "../types"
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PK as string)
function CheckoutForm({ onResult }: { onResult: (message: string, severity: "success" | "error") => void }) {
    const stripe = useStripe()
    const elements = useElements()
    const [ready, setReady] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const pay = async (event: React.FormEvent) => {
        event.preventDefault()
        if (!stripe || !elements || !ready) return
        setSubmitting(true)
        try {
            const result = await stripe.confirmPayment({
                elements,
                redirect: "if_required",
            })

            if (result.error) {
                onResult(result.error.message ?? "Payment failed", "error")
            } else {
                onResult("Payment successful!", "success")
            }
        } catch (error: any) {
            console.error(error)
            onResult(error?.message ?? "Unexpected error confirming payment.", "error")
        } finally {
            setSubmitting(false)
        }
    };
    return (
        <Box component="form" onSubmit={pay} sx={{ display: "grid", gap: 2 }}>
            <Paper variant="outlined" sx={{ p: 2 }}>
                <PaymentElement onReady={() => setReady(true)} />
            </Paper>
            <Button type="submit" variant="contained" disabled={!stripe || !elements || !ready || submitting}>
                {submitting ? "Processing..." : "Pay"}
            </Button>
        </Box>
    )
}
export default function Checkout() {
    const [items, setItems] = useState<CartItem[]>([])
    const [clientSecret, setClientSecret] = useState("")
    const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: "success" | "error" } | null>(
        null,
    )

    useEffect(() => {
        api.get<CartItem[]>("/cart.php").then(({ data }) => setItems(data))
        api
            .post<{ clientSecret: string }>("/stripe.php")
            .then(({ data }) => setClientSecret(data.clientSecret))
            .catch((err) => {
                const msg =
                    err?.response?.data?.message || err?.message || "Failed to create PaymentIntent"
                console.error("PI create error:", err)
                setSnackbar({ open: true, message: msg, severity: "error" })
            })
    }, [])
    const total = useMemo(() => items.reduce((sum, item) => sum + item.price_cents * item.qty, 0), [items])

    return (
        <Container maxWidth="md" sx={{ py: 4 }}>
            <Stack spacing={4}>
                <Box>
                    <Typography variant="h4" component="h1" gutterBottom>
                        Checkout
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Review your order and complete payment securely below.
                    </Typography>
                </Box>
                <Paper variant="outlined">
                    <Stack spacing={2} sx={{ p: 3 }}>
                        <Typography variant="h6">Order Summary</Typography>
                        {items.length === 0 ? (
                            <Alert severity="info">Your cart is empty.</Alert>
                        ) : (
                            <List disablePadding>
                                {items.map((item) => (
                                    <Box key={item.id}>
                                        <ListItem
                                            secondaryAction={
                                                <Typography fontWeight={600}>
                                                    {currency(item.price_cents * item.qty, { fromCents: true }).format()}
                                                </Typography>
                                            }
                                        >
                                            <ListItemText
                                                primary={item.name}
                                                secondary={`Qty ${item.qty} x ${currency(item.price_cents, { fromCents: true }).format()}`}
                                            />
                                        </ListItem>
                                        <Divider component="li" />
                                    </Box>
                                ))}
                            </List>
                        )}
                        <Stack direction="row" justifyContent="space-between" alignItems="center" pt={1}>
                            <Typography variant="subtitle1" fontWeight={600}>
                                Total
                            </Typography>
                            <Typography variant="subtitle1" fontWeight={600}>
                                {currency(total, { fromCents: true }).format()}
                            </Typography>
                        </Stack>
                    </Stack>
                </Paper>

                {clientSecret ? (
                    <Elements
                        stripe={stripePromise}
                        options={{
                            clientSecret,
                            appearance: { theme: "stripe" },
                        }}
                        key={clientSecret}
                    >
                        <CheckoutForm
                            onResult={(message, severity) =>
                                setSnackbar({ open: true, message, severity })
                            }
                        />
                    </Elements>
                ) : (
                    <Paper variant="outlined" sx={{ p: 3, display: "flex", alignItems: "center", gap: 2 }}>
                        <CircularProgress size={24} />
                        <Typography>Preparing secure payment¡­</Typography>
                    </Paper>
                )}
            </Stack>

            <Snackbar
                open={Boolean(snackbar?.open)}
                autoHideDuration={4000}
                onClose={() => setSnackbar(null)}
                anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
            >
                {snackbar && <Alert severity={snackbar.severity}>{snackbar.message}</Alert>}
            </Snackbar>
        </Container>
    )
}