import { useEffect, useMemo, useState } from "react";

const BASE_CURRENCY = "USD";
const CACHE_TTL_MS = 1000 * 60 * 30; // 30 minutes

type RatesCache = {
    rates?: Record<string, number>;
    expiresAt?: number;
};

const ratesCache: RatesCache = {};

function isAbortError(error: unknown): boolean {
    return (
        typeof error === "object" &&
        error !== null &&
        "name" in error &&
        (error as { name?: string }).name === "AbortError"
    );
}

async function fetchRates(signal: AbortSignal): Promise<Record<string, number>> {
    const now = Date.now();
    if (ratesCache.rates && ratesCache.expiresAt && ratesCache.expiresAt > now) {
        return ratesCache.rates;
    }

    const response = await fetch(`https://open.er-api.com/v6/latest/${BASE_CURRENCY}`, { signal });
    if (!response.ok) {
        throw new Error(`Failed to load exchange rates: ${response.status}`);
    }

    const payload: unknown = await response.json();
    if (!payload || typeof payload !== "object" || !("rates" in payload)) {
        throw new Error("Exchange rate response missing rates field");
    }

    const rates = (payload as { rates: Record<string, number> }).rates;
    ratesCache.rates = rates;
    ratesCache.expiresAt = now + CACHE_TTL_MS;
    return rates;
}

export type ExchangeRateState =
    | { status: "loading"; rate: null }
    | { status: "ready"; rate: number }
    | { status: "error"; rate: null };

export function useExchangeRate(targetCurrency: string): ExchangeRateState {
    const normalizedCurrency = targetCurrency.toUpperCase();

    const initialState = useMemo<ExchangeRateState>(() => {
        if (normalizedCurrency === BASE_CURRENCY) {
            return { status: "ready", rate: 1 };
        }
        return { status: "loading", rate: null };
    }, [normalizedCurrency]);

    const [state, setState] = useState<ExchangeRateState>(initialState);

    useEffect(() => {
        if (normalizedCurrency === BASE_CURRENCY) {
            setState({ status: "ready", rate: 1 });
            return;
        }

        let active = true;
        const controller = new AbortController();

        setState({ status: "loading", rate: null });

        fetchRates(controller.signal)
            .then((rates) => {
                if (!active) return;
                const rate = rates[normalizedCurrency];
                if (typeof rate !== "number") {
                    throw new Error(`Missing exchange rate for ${normalizedCurrency}`);
                }
                setState({ status: "ready", rate });
            })
            .catch((error) => {
                if (!active || isAbortError(error)) return;
                console.error("Failed to fetch exchange rate", error);
                setState({ status: "error", rate: null });
            });

        return () => {
            active = false;
            controller.abort();
        };
    }, [normalizedCurrency]);

    return state;
}

export { BASE_CURRENCY as baseCurrency };