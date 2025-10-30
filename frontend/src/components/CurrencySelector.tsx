import type { ChangeEvent } from 'react'
import { useCurrency } from './CurrencyContext'

export default function CurrencySelector() {
    const { currency, setCurrency, options } = useCurrency()

    const handleChange = (event: ChangeEvent<HTMLSelectElement>) => {
        setCurrency(event.target.value)
    }

    return (
        <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 14, color: '#444' }}>Currency</span>
            <select value={currency} onChange={handleChange} style={{ padding: '4px 8px' }}>
                {options.map(option => (
                    <option key={option.code} value={option.code}>
                        {option.code} - {option.label}
                    </option>
                ))}
            </select>
        </label>
    )
}