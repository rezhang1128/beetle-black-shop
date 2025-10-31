export type Role = 'admin' | 'user'


export interface User {
    id: number
    name: string
    email: string
    role: Role
}


export interface Shop {
    id: number
    name: string
    address: string | null
    photo: string | null
}


export interface Product {
    id: number
    shop_id: number
    name: string
    description: string | null
    price_cents: number
    photo: string | null
    active: 0 | 1
}


export interface CartItem {
    id: number
    product_id: number
    qty: number
    name: string
    price_cents: number
    photo: string | null
}

export interface PromoCode {
    id?: number
    code: string
    percent_off: number | null
    amount_off_cents: number | null
    product_id: number | null
    starts_at?: string | null
    ends_at?: string | null
}