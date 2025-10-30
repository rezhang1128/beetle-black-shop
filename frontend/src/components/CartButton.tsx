import { Fab, Tooltip } from "@mui/material"
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart"

interface Props {
    onClick: () => void
}

export default function CartButton({ onClick }: Props) {
    return (
        <Tooltip title="View cart" placement="left">
            <Fab
                color="primary"
                onClick={onClick}
                sx={{ position: "fixed", bottom: 32, right: 32, zIndex: (theme) => theme.zIndex.appBar + 1 }}
            >
                <ShoppingCartIcon />
            </Fab>
        </Tooltip>
    )
}