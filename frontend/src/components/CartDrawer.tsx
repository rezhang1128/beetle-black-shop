import { useEffect, useMemo, useState } from "react"
import {
    Alert,
    Avatar,
    Box,
    Button,
    CircularProgress,
    Drawer,
    IconButton,
    List,
    ListItem,
    ListItemAvatar,
    ListItemText,
    Stack,
    TextField,
    Typography,
} from "@mui/material"
import CloseIcon from "@mui/icons-material/Close"
import DeleteIcon from "@mui/icons-material/DeleteOutline"
import AddIcon from "@mui/icons-material/Add"
import RemoveIcon from "@mui/icons-material/Remove"
import ConvertedPrice from './ConvertedPrice'
import { api } from "../api"
import type { CartItem } from "../types"
import { usePromoManager } from "../hooks/usePromoManager"

interface Props {
    open: boolean
    onClose: () => void
}
export default function CartDrawer({ open, onClose }: Props) {
    const [items, setItems] = useState<CartItem[]>([])
    const [loading, setLoading] = useState(false)
    const apiRoot = (import.meta.env.VITE_API as string).replace("/api", "")
    const { promo, input, setInput, applyPromo, removePromo, applying, feedback, discount } = usePromoManager(items)

    const loadCart = async () => {
        setLoading(true)
        try {
            const { data } = await api.get<CartItem[]>("/cart.php")
            setItems(data)
        } finally {
            setLoading(false)
        }
    }
    useEffect(() => {
        if (open) {
            void loadCart()
        }
    }, [open])
    const subtotal = useMemo(() => items.reduce((sum, item) => sum + item.price_cents * item.qty, 0), [items])
    const total = Math.max(subtotal - discount, 0)
    const hasDiscount = discount > 0
    async function updateQty(product_id: number, qty: number) {
        if (qty <= 0) {
            await api.put("/cart.php", { product_id, qty: 0 })
        } else {
            await api.put("/cart.php", { product_id, qty })
        }
        await loadCart()
    }
    const handleApplyPromo = () => {
        void applyPromo()
    }
    return (
        <Drawer anchor="right" open={open} onClose={onClose} PaperProps={{ sx: { width: { xs: 320, sm: 380 } } }}>
            <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
                <Box
                    component="header"
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        px: 2,
                        py: 1.5,
                        borderBottom: 1,
                        borderColor: "divider",
                    }}
                >
                    <Typography variant="h6">My Cart</Typography>
                    <IconButton aria-label="Close cart" onClick={onClose}>
                        <CloseIcon />
                    </IconButton>
                </Box>

                <Box sx={{ flex: 1, overflowY: "auto", p: 2 }}>
                    {loading && (
                        <Stack spacing={2} alignItems="center" justifyContent="center" sx={{ py: 6 }}>
                            <CircularProgress size={32} />
                            <Typography variant="body2" color="text.secondary">
                                Loading cart...
                            </Typography>
                        </Stack>
                    )}

                    {!loading && items.length === 0 && (
                        <Stack spacing={2} alignItems="center" justifyContent="center" sx={{ py: 6 }}>
                            <Typography variant="subtitle1" color="text.secondary">
                                Your cart is empty.
                            </Typography>
                        </Stack>
                    )}

                    {!loading && items.length > 0 && (
                        <List disablePadding>
                            {items.map((item) => (
                                <ListItem key={item.id} alignItems="flex-start" sx={{ py: 2 }} divider>
                                    <ListItemAvatar>
                                        <Avatar
                                            variant="rounded"
                                            src={
                                                item.photo
                                                    ? `${apiRoot}/uploads/${item.photo}`
                                                    : "https://via.placeholder.com/64"
                                            }
                                            alt={item.name}
                                            sx={{ width: 72, height: 72, mr: 1 }}
                                        />
                                    </ListItemAvatar>
                                    <ListItemText
                                        primary={
                                            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                                                {item.name}
                                            </Typography>
                                        }
                                        secondary={
                                            <ConvertedPrice amountCents={item.price_cents} quantity={item.qty} />
                                        }
                                    />
                                    <Stack spacing={1} alignItems="center">
                                        <Stack direction="row" spacing={1} alignItems="center">
                                            <IconButton
                                                aria-label="Decrease quantity"
                                                size="small"
                                                onClick={() => updateQty(item.product_id, item.qty - 1)}
                                            >
                                                <RemoveIcon fontSize="small" />
                                            </IconButton>
                                            <Typography>{item.qty}</Typography>
                                            <IconButton
                                                aria-label="Increase quantity"
                                                size="small"
                                                onClick={() => updateQty(item.product_id, item.qty + 1)}
                                            >
                                                <AddIcon fontSize="small" />
                                            </IconButton>
                                        </Stack>
                                        <IconButton
                                            aria-label="Remove item"
                                            color="error"
                                            size="small"
                                            onClick={() => updateQty(item.product_id, 0)}
                                        >
                                            <DeleteIcon fontSize="small" />
                                        </IconButton>
                                        
                                    </Stack>
                                </ListItem>
                            ))}
                        </List>
                    )}
                </Box>

                <Box
                    component="footer"
                    sx={{
                        px: 2,
                        py: 2,
                        borderTop: 1,
                        borderColor: "divider",
                        backgroundColor: "background.paper",
                    }}
                >
                    {items.length > 0 && (
                        <Stack spacing={1.5} mb={2}>
                            <Typography variant="subtitle2" fontWeight={600}>
                                Promo code
                            </Typography>
                            <Stack direction="row" spacing={1}>
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
                                <Button
                                    variant="outlined"
                                    onClick={handleApplyPromo}
                                    disabled={applying || !input.trim() || items.length === 0}
                                >
                                    {applying ? "Applying..." : promo ? "Update" : "Apply"}
                                </Button>
                                {promo && (
                                    <Button variant="text" color="inherit" disabled={applying} onClick={() => removePromo()}>
                                        Remove
                                    </Button>
                                )}
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
                    )}
                    <Stack spacing={1} mb={2}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                            <Typography variant="subtitle2" color="text.secondary">
                                Subtotal
                            </Typography>
                            <ConvertedPrice amountCents={subtotal} />
                        </Stack>
                        {hasDiscount && (
                            <Stack direction="row" justifyContent="space-between" alignItems="center">
                                <Typography variant="subtitle2" color="success.main">
                                    Discount{promo ? ` (${promo.code})` : ""}
                                </Typography>
                                <Typography color="success.main">
                                    <ConvertedPrice amountCents={-discount} />
                                </Typography>
                            </Stack>
                        )}
                    </Stack>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                        <Typography variant="subtitle1" fontWeight={600}>
                            Total
                        </Typography>
                        <ConvertedPrice amountCents={total} as="strong" />
                    </Stack>
                    <Button
                        variant="contained"
                        color="primary"
                        fullWidth
                        disabled={items.length === 0}
                        onClick={() => {
                            window.location.href = "/checkout"
                        }}
                    >
                        Go to Checkout
                    </Button>
                </Box>
            </Box>
        </Drawer>
    )
}