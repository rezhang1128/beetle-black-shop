/* global google */
import Autocomplete from "react-google-autocomplete";
import { useRef } from "react";

interface Props {
    onSelect: (address: string) => void;
}

export default function AddressInput({ onSelect }: Props) {
    const inputRef = useRef<HTMLInputElement | null>(null);

    const handlePlaceSelected = (place: google.maps.places.PlaceResult) => {
        if (place && place.formatted_address) {
            onSelect(place.formatted_address);
            if (inputRef.current) inputRef.current.value = place.formatted_address;
        }
    };

    return (
        <Autocomplete
            apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string}
            onPlaceSelected={handlePlaceSelected}
            language="en-AU"
            options={{
                componentRestrictions: { country: "au" }, // Focus on Australia
                types: ["address"],                        // Only addresses
                fields: ["formatted_address", "place_id", "geometry"],
            }}
            ref={inputRef}
            placeholder="Search Australian address"
            style={{ width: "100%", padding: "8px" }}
            onKeyDown={(e) => e.preventDefault()} // Prevent manual typing
        />
    );
}
