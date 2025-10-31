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
    TextField,
} from "@mui/material"
import currency from "currency.js"
import { api } from "../api"
import type { CartItem } from "../types"
import { usePromoManager } from "../hooks/usePromoManager"
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
    }
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
    const [itemsLoading, setItemsLoading] = useState(true)
    const [creatingIntent, setCreatingIntent] = useState(false)
    const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: "success" | "error" } | null>(
        null,
    )
    const { promo, input, setInput, applyPromo, removePromo, applying, feedback, setFeedback, discount } =
        usePromoManager(items, { suppressEmptyValidation: itemsLoading })
    useEffect(() => {
        let active = true
        setItemsLoading(true)
        api
            .get<CartItem[]>("/cart.php")
            .then(({ data }) => {
                if (!active) return
                setItems(data)
            })
            .catch((err) => {
                if (!active) return
                const msg = err?.response?.data?.message || err?.message || "Failed to load cart"
                console.error("Cart load error:", err)
                setSnackbar({ open: true, message: msg, severity: "error" })
            })
            .finally(() => {
                if (active) {
                    setItemsLoading(false)
                }
            })

        return () => {
            active = false
        }
    }, [])
  
    useEffect(() => {
        if (itemsLoading) return
        if (items.length === 0) {
            setClientSecret("")
            return
        }

        let active = true
        setCreatingIntent(true)
        setClientSecret("")
        api
            .post<{ clientSecret: string }>("/stripe.php", { promo_code: promo?.code ?? null })
            .then(({ data }) => {
                if (!active) return
                setClientSecret(data.clientSecret)
            })
            .catch((err) => {
                if (!active) return
                console.error("PI create error:", err)
                const reason = err?.response?.data?.reason
                if (reason === "promo_invalid") {
                    removePromo({ silent: true })
                    setFeedback("error", "Promo code removed because it's no longer valid.")
                    return
                }
                const msg = err?.response?.data?.message || err?.message || "Failed to create PaymentIntent"
                setSnackbar({ open: true, message: msg, severity: "error" })
            })
            .finally(() => {
                if (active) {
                    setCreatingIntent(false)
                }
            })

        return () => {
            active = false
        }
    }, [items, itemsLoading, promo?.code, removePromo, setFeedback])

    const subtotal = useMemo(() => items.reduce((sum, item) => sum + item.price_cents * item.qty, 0), [items])
    const total = Math.max(subtotal - discount, 0)
    const hasDiscount = discount > 0

    const formatCurrency = (value: number) => currency(value, { fromCents: true }).format()
    const handleApplyPromo = () => {
        void applyPromo()
    }

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
                        {itemsLoading ? (
                            <Stack spacing={2} alignItems="center" sx={{ py: 4 }}>
                                <CircularProgress size={28} />
                                <Typography variant="body2" color="text.secondary">
                                    Loading your cart...
                                </Typography>
                            </Stack>
                        ) : items.length === 0 ? (
                            <>
                                <Alert severity="info">Your cart is empty.</Alert>
                                {feedback && (
                                    <Alert
                                        severity={
                                            feedback.status === "error"
                                                ? "error"
                                                : feedback.status === "success"
                                                    ? "success"
                                                    : "info"
                                        }
                                    >
                                        {feedback.message}
                                    </Alert>
                                )}
                            </>
                        ) : (
                            <>
                                <List disablePadding>
                                    {items.map((item) => (
                                        <Box key={item.id}>
                                            <ListItem
                                                secondaryAction={
                                                    <Typography fontWeight={600}>
                                                        {formatCurrency(item.price_cents * item.qty)}
                                                    </Typography>
                                                }
                                            >
                                                <ListItemText
                                                    primary={item.name}
                                                    secondary={`Qty ${item.qty} x ${formatCurrency(item.price_cents)}`}
                                                />
                                            </ListItem>
                                            <Divider component="li" />
                                        </Box>
                                    ))}
                                </List>
                                <Stack spacing={1.5} pt={1}>
                                    <Typography variant="subtitle2" fontWeight={600}>
                                        Promo code
                                    </Typography>
                                    <Stack
                                        direction={{ xs: "column", sm: "row" }}
                                        spacing={1.5}
                                        alignItems={{ sm: "center" }}
                                    >
                                        <TextField
                                            fullWidth
                                            size="small"
                                            label="Enter code"
                                            value={input}
                                            onChange={(event) => setInput(event.target.value)}
                                            onKeyDown={(event) => {
                                                if (event.key === "Enter") {
                                                    event.preventDefault()
                                                    handleApplyPromo()
                                                }
                                            }}
                                            disabled={applying}
                                        />
                                        <Stack direction="row" spacing={1}>
                                            <Button
                                                variant="outlined"
                                                onClick={handleApplyPromo}
                                                disabled={applying || !input.trim() || items.length === 0}
                                            >
                                                {applying ? "Applying..." : promo ? "Update" : "Apply"}
                                            </Button>
                                            {promo && (
                                                <Button
                                                    variant="text"
                                                    color="inherit"
                                                    disabled={applying}
                                                    onClick={() => removePromo()}
                                                >
                                                    Remove
                                                </Button>
                                            )}
                                        </Stack>
                                    </Stack>
                                    {feedback && (
                                <Alert
                                    severity={
                                        feedback.status === "error"
                                            ? "error"
                                            : feedback.status === "success"
                                                ? "success"
                                                : "info"
                                    }
                                >
                                            {feedback.message}
                                        </Alert>
                                    )}
                                </Stack>
                                <Stack spacing={1} pt={1}>
                                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                                        <Typography variant="subtitle2" color="text.secondary">
                                            Subtotal
                                        </Typography>
                                        <Typography>{formatCurrency(subtotal)}</Typography>
                                    </Stack>
                                    {hasDiscount && (
                                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                                            <Typography variant="subtitle2" color="success.main">
                                                Discount{promo ? ` (${promo.code})` : ""}
                                            </Typography>
                                            <Typography color="success.main">{formatCurrency(-discount)}</Typography>
                                        </Stack>
                                    )}
                                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                                        <Typography variant="subtitle1" fontWeight={600}>
                                            Total
                                        </Typography>
                                        <Typography variant="subtitle1" fontWeight={600}>
                                            {formatCurrency(total)}
                                        </Typography>
                                    </Stack>
                                </Stack>
                            </>    
                        )}
 
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
                            {itemsLoading || creatingIntent ? (
                                <>
                                    <CircularProgress size={24} />
                                    <Typography>Preparing secure payment</Typography>
                                </>
                            ) : items.length === 0 ? (
                                <Typography>Add items to your cart to begin checkout.</Typography>
                            ) : (
                                <>
                                    <CircularProgress size={24} />
                                    <Typography>Preparing secure payment</Typography>
                                </>
                            )}
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