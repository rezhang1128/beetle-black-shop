import { useEffect, useMemo, useState } from "react"
import {
    Alert,
    Box,
    Button,
    Card,
    CardActions,
    CardContent,
    Container,
    FormControl,
    InputLabel,
    MenuItem,
    Select,
    Snackbar,
    Stack,
    Typography,
} from "@mui/material"
import Grid from "@mui/material/Grid2"
import type { SelectChangeEvent } from "@mui/material/Select"
import ConvertedPrice from '../components/ConvertedPrice'
import Carousel from "../components/Carousel"
import { api } from "../api"
import type { Product, Shop } from "../types"

export default function Shops() {
    const [shops, setShops] = useState<Shop[]>([])
    const [products, setProducts] = useState<Product[]>([])
    const [shopId, setShopId] = useState<number | "">("")
    const [snackbar, setSnackbar] = useState<{ open: boolean; message: string }>({ open: false, message: "" })

    useEffect(() => {
        api.get<Shop[]>("/shops.php?action=list").then((response) => setShops(response.data))
    }, [])
    useEffect(() => {
        if (!shopId) return
        api.get<Product[]>(`/products.php?action=byShop&shop_id=${shopId}`).then((response) => setProducts(response.data))
    }, [shopId])

    const apiRoot = useMemo(() => (import.meta.env.VITE_API as string).replace("/api", ""), [])

    async function addToCart(product_id: number) {
        try {
            await api.post("/cart.php", { product_id, qty: 1 })
            setSnackbar({ open: true, message: "Added to cart" })
        } catch (error) {
            setSnackbar({ open: true, message: "Failed to add to cart" })
            console.error(error)
        }
    }

    const handleShopChange = (event: SelectChangeEvent) => {
        const value = event.target.value
        setShopId(value === "" ? "" : Number(value))
    }
    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            <Stack spacing={3}>
                <Typography variant="h4" component="h1">
                    Shops
                </Typography>
                <FormControl fullWidth>
                    <InputLabel id="shop-select-label">Select a shop</InputLabel>
                    <Select
                        labelId="shop-select-label"
                        value={shopId === "" ? "" : String(shopId)}
                        label="Select a shop"
                        onChange={handleShopChange}
                    >
                        <MenuItem value="" disabled>
                            Choose a shop
                        </MenuItem>
                        {shops.map((shop) => (
                            <MenuItem key={shop.id} value={String(shop.id)}>
                                {shop.name}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
                {shopId === "" && (
                    <Alert severity="info">Pick a shop to view its catalogue.</Alert>
                )}

                {shopId !== "" && products.length === 0 && (
                    <Alert severity="warning">No products available for this shop yet.</Alert>
                )}
                <Grid container spacing={3}>
                    {products.map((product) => (
                        <Grid key={product.id} xs={12} sm={6} md={4}>
                            <Card elevation={1} sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
                                <Box sx={{ p: 2 }}>
                                    <Carousel
                                        images={[
                                            product.photo
                                                ? `${apiRoot}/uploads/${product.photo}`
                                                : "https://via.placeholder.com/400x240?text=No+Image",
                                        ]}
                                    />
                                </Box>
                                <CardContent sx={{ flexGrow: 1 }}>
                                    <Typography variant="h6" gutterBottom>
                                        {product.name}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        
                                    </Typography>
                                </CardContent>
                                <ConvertedPrice amountCents={product.price_cents} />
                                <CardActions sx={{ px: 2, pb: 2 }}>
                                    <Button variant="contained" fullWidth onClick={() => addToCart(product.id)}>
                                        Add to cart
                                    </Button>
                                </CardActions>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            </Stack>

            <Snackbar
                open={snackbar.open}
                autoHideDuration={3000}
                onClose={() => setSnackbar({ open: false, message: "" })}
                message={snackbar.message}
                anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
            />
        </Container>
    )
}