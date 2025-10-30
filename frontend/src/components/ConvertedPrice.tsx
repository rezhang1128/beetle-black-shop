import { useMemo, type ComponentProps, type ElementType } from "react"
import { useExchangeRate } from "../hooks/useExchangeRate"
import { useCurrency } from "./CurrencyContext"

type ConvertedPriceProps<T extends ElementType> = {
    amountCents: number
    quantity?: number
    as?: T
} & Omit<ComponentProps<T>, 'as' | 'children'>


export default function ConvertedPrice<T extends ElementType = 'span'>(
    props: ConvertedPriceProps<T>
) {
    const { amountCents, quantity = 1, as, ...rest } = props
    const { currency } = useCurrency()

    const Component = (as || 'span') as ElementType
    const normalizedCurrency = currency.toUpperCase()
    const amount = (amountCents * quantity) / 100

    const { status, rate } = useExchangeRate(normalizedCurrency)

    const formattedValue = useMemo(() => {
        if (status !== 'ready' || rate === null) return ''

        const convertedAmount = amount * rate
        return new Intl.NumberFormat(undefined, {
            style: 'currency',
            currency: normalizedCurrency,
        }).format(convertedAmount)
    }, [amount, status, rate, normalizedCurrency])

    if (status === 'loading') {
        return <Component {...rest}></Component>
    }

    if (status === 'error') {
        return <Component {...rest}>Conversion unavailable</Component>
    }

    return <Component {...rest}>{formattedValue}</Component>

}