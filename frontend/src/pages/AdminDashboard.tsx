import { useCallback, useEffect, useMemo, useState } from "react"
import {
    Alert,
    Avatar,
    Box,
    Button,
    CircularProgress,
    Container,
    FormControl,
    Grid,
    InputLabel,
    MenuItem,
    Paper,
    Select,
    Snackbar,
    Stack,
    Tab,
    Tabs,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Typography,
} from "@mui/material"
import type { SelectChangeEvent } from "@mui/material/Select"
import ConvertedPrice from '../components/ConvertedPrice'
import { api } from "../api"
import type { Product, Shop, User, PromoCode } from "../types"
import AdminShopForm from "./AdminShopForm"
import AdminProductForm from "./AdminProductForm"
import { baseCurrency } from "../hooks/useExchangeRate"
import AdminPromoForm from "./AdminPromoForm"

export default function AdminDashboard() {
    const [me, setMe] = useState<User | null>(null)
    const [tab, setTab] = useState<"shops" | "products" | "promo codes">("shops")
    const [shops, setShops] = useState<Shop[]>([])
    const [selectedShopId, setSelectedShopId] = useState<number | "">("")
    const [promos, setPromos] = useState<PromoCode[]>([])
    const [products, setProducts] = useState<Product[]>([])
    const [allProducts, setAllProducts] = useState<Product[]>([])
    const [loadingMe, setLoadingMe] = useState(true)
    const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: "success" | "error" } | null>(
        null,
    )
    const [editingShop, setEditingShop] = useState<Shop | null>(null)
    const [editingProduct, setEditingProduct] = useState<Product | null>(null)
    const [editingPromo, setEditingPromo] = useState<PromoCode | null>(null)

    useEffect(() => {
        setLoadingMe(true)
        api.post<{ user: User | null }>("/auth.php?action=me")
            .then((response) => setMe(response.data.user))
            .finally(() => setLoadingMe(false))
    }, [])
    useEffect(() => {
        if (me && me.role !== "admin") {
            setSnackbar({ open: true, message: "Admins only", severity: "error" })
        }
    }, [me])

    useEffect(() => {
        setEditingProduct(null);
    }, [selectedShopId]);
    const apiRoot = useMemo(() => (import.meta.env.VITE_API as string).replace("/api", ""), [])

    const loadShops = async () => {
        const { data } = await api.get<Shop[]>("/shops.php?action=list")
        setShops(data)
    }
    useEffect(() => {
        void loadShops()
    }, [])

    
    const loadProducts = async (shopId: number) => {
        const { data } = await api.get<Product[]>(`/products.php?action=byShop&shop_id=${shopId}`)
        setProducts(data)
    }
    useEffect(() => {
        if (typeof selectedShopId === "number") {
            void loadProducts(selectedShopId)
        }
    }, [selectedShopId])

    const loadPromos = useCallback(async () => {
        const { data } = await api.get<PromoCode[]>("/promo.php?action=list")
        setPromos(data)
    }, [])

    const loadAllProducts = useCallback(async () => {
        const { data } = await api.get<Product[]>("/products.php?action=listAll")
        setAllProducts(data)
    }, [])

    const productLookup = useMemo(() => {
        const map = new Map<number, { name: string; shop_name: string | null }>()
        allProducts.forEach((product) => {
            map.set(product.id, { name: product.name, shop_name: product.shop_name ?? null })
        })
        return map
    }, [allProducts])

    useEffect(() => {
        if (tab !== "promo codes") {
            return
        }

        let active = true

        const fetchData = async () => {
            try {
                await Promise.all([loadPromos(), loadAllProducts()])
            } catch (error) {
                console.error("Failed to load promo data", error)
                if (!active) return
                setSnackbar({ open: true, message: "Failed to load promo codes", severity: "error" })
            }
        }

        void fetchData()

        return () => {
            active = false
        }
    }, [tab, loadPromos, loadAllProducts])

    if (loadingMe) {
        return (
            <Container maxWidth="md" sx={{ py: 6, textAlign: "center" }}>
                <CircularProgress />
            </Container>
        )
    }

    if (!me) {
        return (
            <Container maxWidth="md" sx={{ py: 6 }}>
                <Alert severity="info">Please log in to access the admin dashboard.</Alert>
            </Container>
        )
    }

    if (me.role !== "admin") {
        return (
            <Container maxWidth="md" sx={{ py: 6 }}>
                <Alert severity="error">Forbidden: admin only.</Alert>
            </Container>
        )
    }

    return (
        <Container maxWidth="xl" sx={{ py: 4 }}>
            <Stack spacing={3}>
                <Box>
                    <Typography variant="h4" component="h1" gutterBottom>
                        Admin Dashboard
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Manage shops, catalogue photos, and product pricing from a single place.
                    </Typography>
                </Box>

                <Tabs value={tab} onChange={(_, value) => setTab(value)}>
                    <Tab value="shops" label="Shops" />
                    <Tab value="products" label="Products" />
                    <Tab value="promo codes" label="Promo Codes" />
                </Tabs>

                {tab === "shops" && (
                    <Grid container spacing={3}>
                        <Grid item xs={12} md={7}>
                            <Paper variant="outlined" sx={{ p: 3 }}>
                                <Stack
                                    direction={{ xs: "column", sm: "row" }}
                                    spacing={2}
                                    justifyContent="space-between"
                                    alignItems={{ xs: "flex-start", sm: "center" }}
                                    sx={{ mb: 2 }}
                                >
                                    <Box>
                                        <Typography variant="h6">Shops</Typography>
                                    </Box>
                                    <Button
                                        variant="outlined"
                                        onClick={() => setEditingShop(null)}
                                        disabled={editingShop === null}
                                    >
                                        New Shop
                                    </Button>
                                </Stack>
                                <Button size="small" onClick={() => setEditingShop(null)} disabled={!editingShop}>
                                    New Shop
                                </Button>
                                <Table size="small">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>ID</TableCell>
                                            <TableCell>Photo</TableCell>
                                            <TableCell>Name</TableCell>
                                            <TableCell>Address</TableCell>
                                            <TableCell align="right">Actions</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {shops.map((shop) => (
                                            <TableRow key={shop.id} hover>
                                                <TableCell>{shop.id}</TableCell>
                                                <TableCell>
                                                    {shop.photo && (
                                                        <Avatar
                                                            variant="rounded"
                                                            src={`${apiRoot}/uploads/${shop.photo}`}
                                                            alt={shop.name}
                                                            sx={{ width: 48, height: 48 }}
                                                        />
                                                    )}
                                                </TableCell>
                                                <TableCell>{shop.name}</TableCell>
                                                <TableCell>{shop.address ?? ""}</TableCell>
                                                <TableCell align="right">
                                                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                                                        <Button
                                                            variant="outlined"
                                                            size="small"
                                                            onClick={() => {
                                                                setTab("products")
                                                                setSelectedShopId(shop.id)
                                                            }}
                                                        >
                                                            Products
                                                        </Button>
                                                        <Button
                                                            variant="outlined"
                                                            size="small"
                                                            onClick={() => setEditingShop(shop)}
                                                        >
                                                            Edit
                                                        </Button>
                                                        <DeleteShopButton
                                                            id={shop.id}
                                                            onDone={() => {
                                                                void loadShops()
                                                                setSnackbar({ open: true, message: "Shop deleted", severity: "success" })
                                                            }}
                                                            onError={() =>
                                                                setSnackbar({ open: true, message: "Failed to delete shop", severity: "error" })
                                                            }
                                                        />
                                                    </Stack>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </Paper>
                        </Grid>
                        <Grid item xs={12} md={5}>
                            <Paper variant="outlined" sx={{ p: 3 }}>
                                <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
                                    <Typography variant="h6">{editingShop ? "Edit Shop" : "Create Shop"}</Typography>
                                </Stack>
                                <AdminShopForm
                                    key={editingShop?.id ?? undefined}
                                    initialData={editingShop}
                                    onSaved={() => {
                                        setEditingShop(null)
                                        void loadShops()
                                    }}
                                />
                            </Paper>
                        </Grid>
                    </Grid>
                )}
                {tab === "products" && (
                    <Stack spacing={3}>
                        <FormControl fullWidth>
                            <InputLabel id="admin-shop-select">Select shop</InputLabel>
                            <Select
                                labelId="admin-shop-select"
                                value={selectedShopId === "" ? "" : String(selectedShopId)}
                                label="Select shop"
                                onChange={(event: SelectChangeEvent) => {
                                    const value = event.target.value
                                    setSelectedShopId(value === "" ? "" : Number(value))
                                }}
                            >
                                <MenuItem value="" disabled>
                                    Choose
                                </MenuItem>
                                {shops.map((shop) => (
                                    <MenuItem key={shop.id} value={String(shop.id)}>
                                        {shop.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        {selectedShopId === "" && <Alert severity="info">Choose a shop to manage products.</Alert>}

                        {typeof selectedShopId === "number" && (
                            <Grid container spacing={3}>
                                <Grid item xs={12} md={7}>
                                    <Paper variant="outlined" sx={{ p: 3 }}>
                                        <Stack
                                            direction={{ xs: "column", sm: "row" }}
                                            spacing={2}
                                            justifyContent="space-between"
                                            alignItems={{ xs: "flex-start", sm: "center" }}
                                            sx={{ mb: 2 }}
                                        >
                                            <Box>
                                                <Typography variant="h6">Products</Typography>
                                            </Box>
                                            <Button
                                                variant="outlined"
                                                onClick={() => setEditingProduct(null)}
                                                disabled={editingProduct === null}
                                            >
                                                New product
                                            </Button>
                                        </Stack>
                                        <Table size="small">
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell>ID</TableCell>
                                                    <TableCell>Photo</TableCell>
                                                    <TableCell>Name</TableCell>
                                                    <TableCell>Description</TableCell>
                                                    <TableCell>Price</TableCell>
                                                    <TableCell align="right">Actions</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {products.map((product) => (
                                                    <TableRow key={product.id} hover>
                                                        <TableCell>{product.id}</TableCell>
                                                        <TableCell>
                                                            {product.photo && (
                                                                <Avatar
                                                                    variant="rounded"
                                                                    src={`${apiRoot}/uploads/${product.photo}`}
                                                                    alt={product.name}
                                                                    sx={{ width: 48, height: 48 }}
                                                                />
                                                            )}
                                                        </TableCell>
                                                        <TableCell>{product.name}</TableCell>
                                                        <TableCell>{product.description}</TableCell>
                                                        <TableCell>
                                                            <ConvertedPrice amountCents={product.price_cents} />
                                                        </TableCell>
                                                        <TableCell align="right">
                                                            <Button
                                                                variant="outlined"
                                                                size="small"
                                                                onClick={() => setEditingProduct(product)}
                                                            >
                                                                Edit
                                                            </Button>
                                                            <DeleteProductButton
                                                                id={product.id}
                                                                onDone={() => {
                                                                    if (typeof selectedShopId === "number") {
                                                                        void loadProducts(selectedShopId)
                                                                    }
                                                                    setSnackbar({ open: true, message: "Product deleted", severity: "success" })
                                                                }}
                                                                onError={() =>
                                                                    setSnackbar({
                                                                        open: true,
                                                                        message: "Failed to delete product",
                                                                        severity: "error",
                                                                    })
                                                                }
                                                            />
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </Paper>
                                </Grid>
                                <Grid item xs={12} md={5}>
                                    <Paper variant="outlined" sx={{ p: 3 }}>
                                        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
                                            <Typography variant="h6">{editingProduct ? "Edit Product" : "Create Product"}</Typography>

                                        </Stack>
                                        <AdminProductForm
                                            key={editingProduct?.id || "new"}
                                            shopId={selectedShopId}
                                            initialData={editingProduct}
                                            onSaved={() => {
                                                setEditingProduct(null)
                                                if (typeof selectedShopId === "number") void loadProducts(selectedShopId)
                                            }}
                                        />
                                    </Paper>
                                </Grid>
                            </Grid>
                        )}
                    </Stack>
                )}
                {tab === "promo codes" && (
                    <Grid container spacing={3}>
                        <Grid item xs={12} md={7}>
                            <Paper variant="outlined" sx={{ p: 3 }}>
                                <Stack
                                    direction={{ xs: "column", sm: "row" }}
                                    spacing={2}
                                    justifyContent="space-between"
                                    alignItems={{ xs: "flex-start", sm: "center" }}
                                    sx={{ mb: 2 }}
                                >
                                    <Box>
                                        <Typography variant="h6">Promo Codes</Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            Manage discounts, scheduling, and product eligibility.
                                        </Typography>
                                    </Box>
                                    <Button
                                        variant="outlined"
                                        onClick={() => setEditingPromo(null)}
                                        disabled={editingPromo === null}
                                    >
                                        New promo
                                    </Button>
                                </Stack>
                                <Table size="small">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Code</TableCell>
                                            <TableCell>Percent off</TableCell>
                                            <TableCell>Amount off</TableCell>
                                            <TableCell>Applies to</TableCell>
                                            <TableCell>Starts</TableCell>
                                            <TableCell>Ends</TableCell>
                                            <TableCell align="right">Actions</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {promos.map((promo) => (
                                            <PromoRow
                                                key={promo.id ?? promo.code}
                                                promo={promo}
                                                productLookup={productLookup}
                                                onEdit={() => setEditingPromo(promo)}
                                                onDeleted={() => {
                                                    void loadPromos().catch((error) => {
                                                        console.error("Failed to refresh promos", error)
                                                        setSnackbar({
                                                            open: true,
                                                            message: "Promo deleted but list failed to refresh",
                                                            severity: "error",
                                                        })
                                                    })
                                                    setSnackbar({
                                                        open: true,
                                                        message: "Promo deleted",
                                                        severity: "success",
                                                    })
                                                }}
                                                onDeleteError={() =>
                                                    setSnackbar({
                                                        open: true,
                                                        message: "Failed to delete promo",
                                                        severity: "error",
                                                    })
                                                }
                                            />
                                        ))}
                                        {promos.length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={7}>
                                                    <Typography variant="body2" color="text.secondary" align="center">
                                                        No promo codes yet.
                                                    </Typography>
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </Paper>
                        </Grid>
                        <Grid item xs={12} md={5}>
                            <Paper variant="outlined" sx={{ p: 3 }}>
                                <Stack
                                    direction="row"
                                    justifyContent="space-between"
                                    alignItems="center"
                                    sx={{ mb: 2 }}
                                >
                                    <Typography variant="h6">
                                        {editingPromo ? `Edit ${editingPromo.code}` : "Create promo"}
                                    </Typography>
                                </Stack>
                                <AdminPromoForm
                                    key={editingPromo?.id ?? "new"}
                                    initialData={editingPromo}
                                    products={allProducts}
                                    onSaved={(message) => {
                                        setEditingPromo(null)
                                        void loadPromos().catch((error) => {
                                            console.error("Failed to refresh promos", error)
                                            setSnackbar({
                                                open: true,
                                                message: "Promo saved but list failed to refresh",
                                                severity: "error",
                                            })
                                        })
                                        setSnackbar({ open: true, message, severity: "success" })
                                    }}
                                    onError={(message) =>
                                        setSnackbar({ open: true, message, severity: "error" })
                                    }
                                    onReset={() => setEditingPromo(null)}
                                />
                            </Paper>
                        </Grid>
                    </Grid>
                )}
            </Stack>

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
function DeleteShopButton({ id, onDone, onError }: { id: number; onDone: () => void; onError: () => void }) {
    const del = async () => {
        try {
            const fd = new FormData()
            fd.append("id", String(id))
            await api.post("/shops.php?action=delete", fd, { headers: { "Content-Type": "multipart/form-data" } })
            onDone()
        } catch (error) {
            console.error(error)
            onError()
        }
    }
    return (
        <Button variant="outlined" color="error" size="small" onClick={del}>
            Delete
        </Button>
    )
}

function DeleteProductButton({ id, onDone, onError }: { id: number; onDone: () => void; onError: () => void }) {
    const del = async () => {
        try {
            const fd = new FormData()
            fd.append("id", String(id))
            await api.post("/products.php?action=delete", fd, {
                headers: { "Content-Type": "multipart/form-data" },
            })
            onDone()
        } catch (error) {
            console.error(error)
            onError()
        }
    }
    return (
        <Button variant="outlined" color="error" size="small" onClick={del}>
            Delete
        </Button>
    )
}

type PromoRowProps = {
    promo: PromoCode
    productLookup: Map<number, { name: string; shop_name: string | null }>
    onEdit: () => void
    onDeleted: () => void
    onDeleteError: () => void
}

function formatBaseCurrency(amountCents: number | null | undefined): string {
    if (amountCents == null) {
        return "¡ª"
    }
    return new Intl.NumberFormat(undefined, {
        style: "currency",
        currency: baseCurrency,
    }).format(amountCents / 100)
}

function formatDateTime(value?: string | null): string {
    if (!value) {
        return "¡ª"
    }
    const normalized = value.replace(" ", "T")
    const parsed = new Date(normalized)
    if (Number.isNaN(parsed.getTime())) {
        return value
    }
    return parsed.toLocaleString()
}

function PromoRow({ promo, productLookup, onEdit, onDeleted, onDeleteError }: PromoRowProps) {
    const appliesTo = useMemo(() => {
        if (!promo.product_id) {
            return "All products"
        }
        const details = productLookup.get(promo.product_id)
        if (!details) {
            return `Product #${promo.product_id}`
        }
        return details.shop_name ? `${details.name} (${details.shop_name})` : details.name
    }, [promo.product_id, productLookup])

    const promoId = typeof promo.id === "number" && promo.id > 0 ? promo.id : null

    return (
        <TableRow hover>
            <TableCell>{promo.code}</TableCell>
            <TableCell>{promo.percent_off ? `${promo.percent_off}%` : "0"}</TableCell>
            <TableCell>{promo.amount_off_cents ? formatBaseCurrency(promo.amount_off_cents) : formatBaseCurrency(0)}</TableCell>
            <TableCell>{appliesTo}</TableCell>
            <TableCell>{promo.starts_at ? formatDateTime(promo.starts_at):"Always"}</TableCell>
            <TableCell>{promo.ends_at ? formatDateTime(promo.ends_at):"Never"}</TableCell>
            <TableCell align="right">
                <Stack direction="column" spacing={1} justifyContent="flex-end">
                    <Button variant="outlined" size="small" onClick={onEdit}>
                        Edit
                    </Button>
                    <DeletePromoButton id={promoId} onDone={onDeleted} onError={onDeleteError} />
                </Stack>
            </TableCell>
        </TableRow>
    )
}

function DeletePromoButton({ id, onDone, onError }: { id: number | null; onDone: () => void; onError: () => void }) {
    if (id == null) {
        return (
            <Button variant="outlined" color="error" size="small" disabled>
                Delete
            </Button>
        )
    }

    const del = async () => {
        try {
            await api.post("/promo.php?action=delete", { id })
            onDone()
        } catch (error) {
            console.error(error)
            onError()
        }
    }

    return (
        <Button variant="outlined" color="error" size="small" onClick={del}>
            Delete
        </Button>
    )
}