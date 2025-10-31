import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react"
import type { PromoCode } from "../types"

interface PromoContextValue {
    promo: PromoCode | null
    setPromo: (promo: PromoCode | null) => void
}

const STORAGE_KEY = "activePromoCode"

function loadInitialPromo(): PromoCode | null {
    if (typeof window === "undefined") return null

    try {
        const stored = window.localStorage.getItem(STORAGE_KEY)
        if (!stored) return null
        const parsed = JSON.parse(stored) as PromoCode
        if (!parsed || typeof parsed !== "object") return null
        if (!parsed.code || typeof parsed.code !== "string") return null
        return {
            code: parsed.code,
            percent_off: parsed.percent_off ?? null,
            amount_off_cents: parsed.amount_off_cents ?? null,
            product_id: parsed.product_id ?? null,
        }
    } catch (error) {
        console.warn("Failed to load stored promo code", error)
        return null
    }
}

const PromoContext = createContext<PromoContextValue | undefined>(undefined)

export function PromoProvider({ children }: { children: ReactNode }) {
    const [promo, setPromoState] = useState<PromoCode | null>(loadInitialPromo)

    useEffect(() => {
        if (typeof window === "undefined") return
        if (promo) {
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify(promo))
        } else {
            window.localStorage.removeItem(STORAGE_KEY)
        }
    }, [promo])

    const value = useMemo<PromoContextValue>(
        () => ({
            promo,
            setPromo: setPromoState,
        }),
        [promo],
    )

    return <PromoContext.Provider value={value}>{children}</PromoContext.Provider>
}

export function usePromo(): PromoContextValue {
    const context = useContext(PromoContext)
    if (!context) {
        throw new Error("usePromo must be used within a PromoProvider")
    }
    return context
}