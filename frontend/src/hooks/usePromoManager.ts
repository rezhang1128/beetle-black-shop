import { useCallback, useEffect, useMemo, useState } from "react"
import { usePromo } from "../components/PromoContext"
import type { CartItem } from "../types"
import { PromoCodeError, calculatePromoDiscount, validatePromoCode } from "./promo"

type PromoFeedbackStatus = "success" | "error" | "info"

export interface PromoFeedback {
    status: PromoFeedbackStatus
    message: string
}

interface RemoveOptions {
    silent?: boolean
    message?: string
    status?: PromoFeedbackStatus
}

interface PromoManagerOptions {
    suppressEmptyValidation?: boolean
}

export function usePromoManager(items: CartItem[], options?: PromoManagerOptions) {
    const { promo, setPromo } = usePromo()
    const [input, setInput] = useState(promo?.code ?? "")
    const [feedback, setFeedback] = useState<PromoFeedback | null>(null)
    const [applying, setApplying] = useState(false)
    const suppressEmptyValidation = options?.suppressEmptyValidation ?? false

    useEffect(() => {
        setInput(promo?.code ?? "")
    }, [promo?.code])

    const removePromo = useCallback(
        (options?: RemoveOptions) => {
            setPromo(null)
            setInput("")
            if (options?.silent) {
                return
            }
            if (options?.message) {
                setFeedback({ status: options.status ?? "info", message: options.message })
            } else {
                setFeedback({ status: "info", message: "Promo code removed." })
            }
        },
        [setPromo],
    )

    useEffect(() => {
        if (!promo) return
        if (!suppressEmptyValidation && items.length === 0) {
            removePromo({ message: "Promo code removed because your cart is empty." })
            return
        }
        if (promo.product_id && !items.some((item) => item.product_id === promo.product_id)) {
            removePromo({ message: "Promo code removed because the eligible item is no longer in your cart." })
        }
    }, [items, promo, removePromo, suppressEmptyValidation])

    const applyPromo = useCallback(async () => {
        try {
            setApplying(true)
            setFeedback(null)
            const validated = await validatePromoCode(input, items)
            setPromo(validated)
            setInput(validated.code)
            setFeedback({ status: "success", message: `Promo ${validated.code} applied.` })
        } catch (error) {
            if (error instanceof PromoCodeError) {
                setFeedback({ status: "error", message: error.message })
            } else {
                setFeedback({ status: "error", message: "Unable to apply that promo code right now. Please try again." })
            }
        } finally {
            setApplying(false)
        }
    }, [input, items, setPromo])

    const discount = useMemo(() => calculatePromoDiscount(items, promo), [items, promo])

    const setExternalFeedback = useCallback((status: PromoFeedbackStatus, message: string) => {
        setFeedback({ status, message })
    }, [])

    return {
        promo,
        input,
        setInput,
        applyPromo,
        removePromo,
        applying,
        feedback,
        setFeedback: setExternalFeedback,
        discount,
    }
}