import { Box, Button, Stack, Typography } from "@mui/material"
import { Link as RouterLink } from "react-router-dom"

function App() {
    return (
        <Box
            sx={{
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
                p: 4,
            }}
        >
            <Stack spacing={3}>
                <Typography variant="h3" component="h1" color="primary">
                    Welcome to Beetle Black Shop
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    Select a destination from the navigation above to start browsing shops,
                    manage your cart, or administer the catalogue.
                </Typography>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={2} justifyContent="center">
                    <Button
                        variant="contained"
                        component={RouterLink}
                        to="/"
                        color="primary"
                    >
                        Browse Shops
                    </Button>
                    <Button
                        variant="outlined"
                        component={RouterLink}
                        to="/checkout"
                        color="primary"
                    >
                        Checkout
                    </Button>
                </Stack>
            </Stack>
        </Box>
    )
}

export default App