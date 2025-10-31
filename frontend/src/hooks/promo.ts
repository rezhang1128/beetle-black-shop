import { api } from "../api"
import type { CartItem, PromoCode } from "../types"

export type PromoValidationResponse = {
    valid: boolean
    percent_off?: number | null
    amount_off_cents?: number | null
    product_id?: number | null
    starts_at?: string | null
    ends_at?: string | null
    reason?: string
}

export class PromoCodeError extends Error {
    reason?: string

    constructor(message: string, reason?: string) {
        super(message)
        this.name = "PromoCodeError"
        this.reason = reason
    }
}

export function describePromoRejection(reason?: string): string {
    switch (reason) {
        case "not_found":
            return "That promo code could not be found."
        case "not_started":
            return "That promo code isn't active yet."
        case "expired":
            return "That promo code has expired."
        case "wrong_product":
            return "That promo code doesn't apply to the items in your cart."
        default:
            return "That promo code isn't valid for your cart."
    }
}

export function calculatePromoDiscount(items: CartItem[], promo: PromoCode | null): number {
    if (!promo || items.length === 0) {
        return 0
    }

    const cartSubtotal = items.reduce((sum, item) => sum + item.price_cents * item.qty, 0)
    if (cartSubtotal <= 0) {
        return 0
    }

    const eligibleItems = promo.product_id
        ? items.filter((item) => item.product_id === promo.product_id)
        : items

    const eligibleSubtotal = eligibleItems.reduce((sum, item) => sum + item.price_cents * item.qty, 0)
    if (eligibleSubtotal <= 0) {
        return 0
    }

    let discount = 0
    if (promo.percent_off && promo.percent_off > 0) {
        discount += Math.floor((eligibleSubtotal * promo.percent_off) / 100)
    }
    if (promo.amount_off_cents && promo.amount_off_cents > 0) {
        discount += promo.amount_off_cents
    }

    if (discount > eligibleSubtotal) {
        discount = eligibleSubtotal
    }
    if (discount > cartSubtotal) {
        discount = cartSubtotal
    }

    return discount
}

export async function validatePromoCode(code: string, items: CartItem[]): Promise<PromoCode> {
    const normalized = code.trim().toUpperCase()
    if (!normalized) {
        throw new PromoCodeError("Enter a promo code to apply.")
    }
    if (items.length === 0) {
        throw new PromoCodeError("Add an item to your cart before applying a promo code.")
    }

    const payload = {
        code: normalized,
        product_ids: items.map((item) => item.product_id),
    }

    const { data } = await api.post<PromoValidationResponse>("/promo.php", payload)

    if (!data.valid) {
        throw new PromoCodeError(describePromoRejection(data.reason), data.reason)
    }

    return {
        code: normalized,
        percent_off: data.percent_off ?? null,
        amount_off_cents: data.amount_off_cents ?? null,
        product_id: data.product_id ?? null,
        starts_at: data.starts_at ?? null,
        ends_at: data.ends_at ?? null,
    }
}