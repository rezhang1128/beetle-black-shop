import { useEffect, useRef, useState } from "react"
import TextField from "@mui/material/TextField"

interface Props {
    onSelect: (address: string) => void
    value?: string
}

export default function AddressInput({ onSelect, value: valueProp }: Props) {
    const inputRef = useRef<HTMLInputElement | null>(null)
    const [value, setValue] = useState("")
    useEffect(() => {
        if (typeof valueProp === "string") {
            setValue(valueProp)
        }
    }, [valueProp])

    useEffect(() => {
        if (!inputRef.current) return
        const googleMaps = (window as typeof window & { google?: typeof google }).google
        if (!googleMaps?.maps?.places) return

        const autocomplete = new googleMaps.maps.places.Autocomplete(inputRef.current, {
            componentRestrictions: { country: "au" },
            types: ["address"],
            fields: ["formatted_address", "place_id", "geometry"],
        })

        const listener = autocomplete.addListener("place_changed", () => {
            const place = autocomplete.getPlace()
            if (place?.formatted_address) {
                setValue(place.formatted_address)
                onSelect(place.formatted_address)
            }
        })

        return () => {
            googleMaps.maps.event.removeListener(listener)
        }
    }, [onSelect])

    return (
        <TextField
            label="Search Australian address"
            fullWidth
            value={value}
            onChange={(event) => {
                const next = event.target.value
                setValue(next)
                onSelect(next)
            }}
            inputRef={inputRef}
        />
    )
}