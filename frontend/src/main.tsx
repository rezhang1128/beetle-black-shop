import React from "react"
import ReactDOM from "react-dom/client"
import { BrowserRouter, Route, Routes, Link as RouterLink } from "react-router-dom"
import {
    AppBar,
    Box,
    Button,
    Container,
    CssBaseline,
    IconButton,
    Menu,
    MenuItem,
    Stack,
    ThemeProvider,
    Toolbar,
    Typography,
    createTheme,
    useMediaQuery,
    useTheme,
} from "@mui/material"
import MenuIcon from "@mui/icons-material/Menu"
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart"
import CurrencySelector from './components/CurrencySelector'
import { CurrencyProvider } from './components/CurrencyContext'

import App from "./App"
import Login from "./pages/Login"
import Shops from "./pages/Shops"
import Checkout from "./pages/Checkout"
import AdminDashboard from "./pages/AdminDashboard"
import CartDrawer from "./components/CartDrawer"
import CartButton from "./components/CartButton"
import "./index.css"

const theme = createTheme({
    palette: {
        primary: {
            main: "#1e88e5",
        },
        secondary: {
            main: "#ff7043",
        },
        background: {
            default: "#f5f5f5",
        },
    },
    shape: { borderRadius: 12 },
})

function Shell() {
    const [cartOpen, setCartOpen] = React.useState(false)
    const [menuAnchor, setMenuAnchor] = React.useState<null | HTMLElement>(null)

    const themeHook = useTheme()
    const isMobile = useMediaQuery(themeHook.breakpoints.down("sm"))

    const navItems = React.useMemo(
        () => [
            { label: "Shops", to: "/" },
            { label: "Checkout", to: "/checkout" },
            { label: "Login", to: "/login" },
            { label: "Admin", to: "/admin" },
        ],
        [],
    )

    const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
        setMenuAnchor(event.currentTarget)
    }

    const handleMenuClose = () => {
        setMenuAnchor(null)
    }

    return (
        <CurrencyProvider>
        <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
            <AppBar position="sticky" color="primary" enableColorOnDark>
                <Toolbar>
                    <CurrencySelector />
                    <Typography
                        variant="h6"
                        component={RouterLink}
                        to="/"
                        sx={{ flexGrow: 1, textDecoration: "none", color: "inherit", fontWeight: 600 }}
                    >
                        Beetle Black Shop
                    </Typography>
                    {isMobile ? (
                        <>
                            <IconButton color="inherit" edge="end" onClick={handleMenuOpen} aria-label="Open navigation">
                                <MenuIcon />
                            </IconButton>
                            <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={handleMenuClose} keepMounted>
                                {navItems.map((item) => (
                                    <MenuItem
                                        key={item.to}
                                        component={RouterLink}
                                        to={item.to}
                                        onClick={handleMenuClose}
                                    >
                                        {item.label}
                                    </MenuItem>
                                ))}
                                <MenuItem
                                    onClick={() => {
                                        handleMenuClose()
                                        setCartOpen(true)
                                    }}
                                >
                                    View Cart
                                </MenuItem>
                            </Menu>
                        </>
                    ) : (
                        <Stack direction="row" spacing={1} alignItems="center">
                            {navItems.map((item) => (
                                <Button
                                    key={item.to}
                                    color="inherit"
                                    component={RouterLink}
                                    to={item.to}
                                >
                                    {item.label}
                                </Button>
                            ))}
                            <Button
                                color="inherit"
                                startIcon={<ShoppingCartIcon />}
                                onClick={() => setCartOpen(true)}
                            >
                                Cart
                            </Button>

                        </Stack>
                        
                    )}
                </Toolbar>
            </AppBar>

            <Box component="main" sx={{ flexGrow: 1, py: { xs: 3, md: 4 } }}>
                <Container maxWidth="lg">
                    <Routes>
                        <Route path="/" element={<Shops />} />
                        <Route path="/checkout" element={<Checkout />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/admin" element={<AdminDashboard />} />
                        <Route path="*" element={<App />} />
                    </Routes>
                </Container>
            </Box>

            <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
            <CartButton onClick={() => setCartOpen(true)} />
            </Box>
        </CurrencyProvider>
    )
}
ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
        <BrowserRouter>
            <ThemeProvider theme={theme}>
                <CssBaseline />
                <Shell />
            </ThemeProvider>
        </BrowserRouter>
        <CurrencyProvider>
            <BrowserRouter>
                <Shell />
            </BrowserRouter>
        </CurrencyProvider>
    </React.StrictMode>,
)