import { ComponentProps, ElementType } from 'react'
import CurrencyConverter from 'react-currency-converter'
import { useCurrency } from './CurrencyContext'

const baseCurrency = 'USD'

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
    const amount = (amountCents * quantity) / 100

    const formatValue = (raw: string) => {
        const parsed = Number.parseFloat(raw)
        if (Number.isNaN(parsed)) return raw
        return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(parsed)
    }

    return (
        <CurrencyConverter
            from={baseCurrency}
            to={currency}
            amount={amount}
            renderText={(value: string) => <Component {...rest}>{formatValue(value)}</Component>}
            loadingText={<Component {...rest}>бн</Component>}
            errorText={<Component {...rest}>Conversion unavailable</Component>}
        />
    )
}