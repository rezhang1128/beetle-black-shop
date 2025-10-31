import { useEffect, useMemo, useState } from "react"
import { Button, MenuItem, Stack, TextField, Typography } from "@mui/material"
import { api } from "../api"
import { baseCurrency } from "../hooks/useExchangeRate"
import type { Product, PromoCode } from "../types"

function formatDateForInput(value?: string | null): string {
    if (!value) return ""
    const normalized = value.replace(" ", "T")
    const match = normalized.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/)
    if (match) {
        return `${match[1]}T${match[2]}`
    }
    const parsed = new Date(value)
    if (Number.isNaN(parsed.getTime())) {
        return ""
    }
    const pad = (num: number) => num.toString().padStart(2, "0")
    return `${parsed.getFullYear()}-${pad(parsed.getMonth() + 1)}-${pad(parsed.getDate())}T${pad(parsed.getHours())}:${pad(parsed.getMinutes())}`
}

type AdminPromoFormProps = {
    initialData: PromoCode | null
    products: Product[]
    onSaved: (message: string) => void
    onError: (message: string) => void
    onReset: () => void
}

export default function AdminPromoForm({ initialData, products, onSaved, onError, onReset }: AdminPromoFormProps) {
    const [code, setCode] = useState("")
    const [percentOff, setPercentOff] = useState("")
    const [amountOff, setAmountOff] = useState("")
    const [productId, setProductId] = useState<string>("")
    const [startsAt, setStartsAt] = useState("")
    const [endsAt, setEndsAt] = useState("")
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        setCode(initialData?.code ?? "")
        setPercentOff(
            initialData?.percent_off != null && !Number.isNaN(initialData.percent_off)
                ? String(initialData.percent_off)
                : ""
        )
        setAmountOff(
            initialData?.amount_off_cents != null && !Number.isNaN(initialData.amount_off_cents)
                ? (initialData.amount_off_cents / 100).toFixed(2)
                : ""
        )
        setProductId(initialData?.product_id != null ? String(initialData.product_id) : "")
        setStartsAt(formatDateForInput(initialData?.starts_at ?? null))
        setEndsAt(formatDateForInput(initialData?.ends_at ?? null))
        setError(null)
    }, [initialData])

    const productOptions = useMemo(() => {
        const unique = new Map<number, Product>()
        for (const product of products) {
            unique.set(product.id, product)
        }
        return Array.from(unique.values()).sort((a, b) => a.name.localeCompare(b.name))
    }, [products])

    const baseCurrencyLabel = useMemo(() => baseCurrency.toUpperCase(), [])

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault()
        setError(null)

        const trimmedCode = code.trim().toUpperCase()
        if (!trimmedCode) {
            setError("Enter a promo code.")
            return
        }

        const percentValue = percentOff.trim()
            ? Number.parseFloat(percentOff)
            : null
        if (percentValue !== null) {
            if (Number.isNaN(percentValue) || percentValue <= 0 || percentValue > 100) {
                setError("Percent off must be between 1 and 100.")
                return
            }
        }

        const amountValue = amountOff.trim()
            ? Number.parseFloat(amountOff)
            : null
        if (amountValue !== null) {
            if (Number.isNaN(amountValue) || amountValue <= 0) {
                setError("Amount off must be greater than zero.")
                return
            }
        }

        if (percentValue === null && amountValue === null) {
            setError("Provide a percent off or amount off value.")
            return
        }

        const productValue = productId ? Number.parseInt(productId, 10) : null
        if (productValue !== null && (Number.isNaN(productValue) || productValue <= 0)) {
            setError("Select a valid product or choose all products.")
            return
        }

        const payload = {
            id: initialData?.id,
            code: trimmedCode,
            percent_off: percentValue ?? undefined,
            amount_off_cents: amountValue != null ? Math.round(amountValue * 100) : undefined,
            product_id: productValue,
            starts_at: startsAt || null,
            ends_at: endsAt || null,
        }

        setSaving(true)
        try {
            const endpoint = initialData?.id ? "/promo.php?action=update" : "/promo.php?action=create"
            await api.post(endpoint, payload)
            onSaved(initialData?.id ? "Promo updated" : "Promo created")
        } catch (err: any) {
            console.error("Failed to save promo", err)
            const message = err?.response?.data?.error || err?.message || "Failed to save promo."
            setError(message)
            onError(message)
        } finally {
            setSaving(false)
        }
    }

    const handleReset = () => {
        onReset()
    }

    return (
        <Stack component="form" spacing={2} onSubmit={handleSubmit}>
            <TextField
                label="Promo code"
                value={code}
                onChange={(event) => setCode(event.target.value)}
                inputProps={{ style: { textTransform: "uppercase" } }}
                required
            />
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <TextField
                    label="Percent off"
                    placeholder="e.g. 15"
                    value={percentOff}
                    onChange={(event) => setPercentOff(event.target.value)}
                    type="number"
                    inputProps={{ min: 0, max: 100 }}
                    fullWidth
                />
                <TextField
                    label="Amount off"
                    placeholder="e.g. 10.00"
                    helperText={`Enter the discount in base currency (${baseCurrencyLabel})`}
                    value={amountOff}
                    onChange={(event) => setAmountOff(event.target.value)}
                    type="number"
                    inputProps={{ min: 0, step: 0.01 }}
                    fullWidth
                />
            </Stack>
            <TextField
                select
                label="Applies to"
                value={productId}
                onChange={(event) => setProductId(event.target.value)}
                helperText="Leave empty to apply to any product"
            >
                <MenuItem value="">All products</MenuItem>
                {productOptions.map((product) => (
                    <MenuItem key={product.id} value={product.id}>
                        {product.name}
                        {product.shop_name ? ` ¨C ${product.shop_name}` : ""}
                    </MenuItem>
                ))}
            </TextField>
            <Typography variant="subtitle2" color="text.secondary">
                Schedule (optional)
            </Typography>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <TextField
                    label="Starts at"
                    type="datetime-local"
                    value={startsAt}
                    onChange={(event) => setStartsAt(event.target.value)}
                    InputLabelProps={{ shrink: true }}
                    fullWidth
                />
                <TextField
                    label="Ends at"
                    type="datetime-local"
                    value={endsAt}
                    onChange={(event) => setEndsAt(event.target.value)}
                    InputLabelProps={{ shrink: true }}
                    fullWidth
                />
            </Stack>
            {error && (
                <Typography color="error" variant="body2">
                    {error}
                </Typography>
            )}
            <Stack direction="row" spacing={2} justifyContent="flex-end">

                <Button type="submit" variant="contained" disabled={saving}>
                    {saving ? "Saving..." : initialData?.id ? "Update promo" : "Create promo"}
                </Button>
            </Stack>
        </Stack>
    )
}