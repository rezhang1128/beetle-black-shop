import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

export type SupportedCurrency = {
    code: string
    label: string
}

type CurrencyContextValue = {
    currency: string
    setCurrency: (code: string) => void
    options: SupportedCurrency[]
}

const supportedCurrencies: SupportedCurrency[] = [
    { code: 'USD', label: 'United States Dollar' },
    { code: 'EUR', label: 'Euro' },
    { code: 'GBP', label: 'British Pound' },
    { code: 'JPY', label: 'Japanese Yen' },
    { code: 'AUD', label: 'Australian Dollar' }
]

const CurrencyContext = createContext<CurrencyContextValue | undefined>(undefined)

function loadInitialCurrency(): string {
    if (typeof window === 'undefined') return 'AUD'

    const stored = window.localStorage.getItem('selectedCurrency')
    return stored && supportedCurrencies.some(opt => opt.code === stored) ? stored : 'AUD'
}

export function CurrencyProvider({ children }: { children: ReactNode }) {
    const [currency, setCurrencyState] = useState<string>(loadInitialCurrency)

    useEffect(() => {
        if (typeof window === 'undefined') return
        window.localStorage.setItem('selectedCurrency', currency)
    }, [currency])

    const setCurrency = (code: string) => {
        setCurrencyState(prev => (prev === code ? prev : code))
    }

    const value = useMemo<CurrencyContextValue>(
        () => ({ currency, setCurrency, options: supportedCurrencies }),
        [currency]
    )

    return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useCurrency() {
    const context = useContext(CurrencyContext)
    if (!context) {
        throw new Error('useCurrency must be used within a CurrencyProvider')
    }
    return context
}