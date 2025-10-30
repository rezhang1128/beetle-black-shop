import {
    useEffect,
    useMemo,
    useState,
    type ComponentProps,
    type ElementType,
} from 'react'
import { useCurrency } from './CurrencyContext'

const baseCurrency = 'USD'

const CACHE_TTL_MS = 1000 * 60 * 30 // 30 minutes

const ratesCache: {
    rates?: Record<string, number>
    expiresAt?: number
} = {}

async function fetchRates(signal: AbortSignal): Promise<Record<string, number>> {
    const now = Date.now()
    if (ratesCache.rates && ratesCache.expiresAt && ratesCache.expiresAt > now) {
        return ratesCache.rates
    }

    const response = await fetch(`https://open.er-api.com/v6/latest/${baseCurrency}`, { signal })
    if (!response.ok) {
        throw new Error(`Failed to load exchange rates: ${response.status}`)
    }

    const payload: unknown = await response.json()
    if (!payload || typeof payload !== 'object' || !('rates' in payload)) {
        throw new Error('Exchange rate response missing rates field')
    }

    const rates = (payload as { rates: Record<string, number> }).rates
    ratesCache.rates = rates
    ratesCache.expiresAt = now + CACHE_TTL_MS
    return rates
}

function isAbortError(error: unknown): boolean {
    return (
        typeof error === 'object' &&
        error !== null &&
        'name' in error &&
        (error as { name?: string }).name === 'AbortError'
    )
}

type ConvertedPriceProps<T extends ElementType> = {
    amountCents: number
    quantity?: number
    as?: T
} & Omit<ComponentProps<T>, 'as' | 'children'>

type RateState =
    | { status: 'ready'; rate: number }
    | { status: 'loading' }
    | { status: 'error' }


export default function ConvertedPrice<T extends ElementType = 'span'>(
    props: ConvertedPriceProps<T>
) {
    const { amountCents, quantity = 1, as, ...rest } = props
    const { currency } = useCurrency()

    const Component = (as || 'span') as ElementType
    const normalizedCurrency = currency.toUpperCase()
    const amount = (amountCents * quantity) / 100

    const [state, setState] = useState<RateState>(() =>
        normalizedCurrency === baseCurrency
            ? { status: 'ready', rate: 1 }
            : { status: 'loading' }
    )

    useEffect(() => {
        if (normalizedCurrency === baseCurrency) {
            setState({ status: 'ready', rate: 1 })
            return
        }

        let active = true
        const controller = new AbortController()

        setState({ status: 'loading' })

        fetchRates(controller.signal)
            .then(rates => {
                if (!active) return
                const rate = rates[normalizedCurrency]
                if (typeof rate !== 'number') {
                    throw new Error(`Missing exchange rate for ${normalizedCurrency}`)
                }
                setState({ status: 'ready', rate })
            })
            .catch(error => {
                if (!active || isAbortError(error)) return
                console.error('Failed to fetch exchange rate', error)
                setState({ status: 'error' })
            })

        return () => {
            active = false
            controller.abort()
        }
    }, [normalizedCurrency])

    const formattedValue = useMemo(() => {
        if (state.status !== 'ready') return ''

        const convertedAmount = amount * state.rate
        return new Intl.NumberFormat(undefined, {
            style: 'currency',
            currency: normalizedCurrency,
        }).format(convertedAmount)
    }, [amount, state, normalizedCurrency])

    if (state.status === 'loading') {
        return <Component {...rest}></Component>
    }

    if (state.status === 'error') {
        return <Component {...rest}>Conversion unavailable</Component>
    }

    return <Component {...rest}>{formattedValue}</Component>

}