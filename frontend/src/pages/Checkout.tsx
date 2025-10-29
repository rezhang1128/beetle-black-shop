// src/pages/Checkout.tsx
import { useEffect, useMemo, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
    Elements,
    PaymentElement,
    useStripe,
    useElements,
} from "@stripe/react-stripe-js";
import { api } from "../api";
import currency from "currency.js";
import type { CartItem } from "../types";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PK as string);

function CheckoutForm() {
    const stripe = useStripe();
    const elements = useElements();
    const [ready, setReady] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const pay = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!stripe || !elements || !ready) return; // guard

        setSubmitting(true);
        try {
            const result = await stripe.confirmPayment({
                elements,
                redirect: "if_required",
            });

            if (result.error) {
                alert(result.error.message);
            } else {
                alert("Payment successful!");
            }
        } catch (err: any) {
            alert(err?.message || "Unexpected error confirming payment.");
            console.error(err);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <form onSubmit={pay}>
            {/* onReady fires when the Payment Element is fully mounted */}
            <PaymentElement onReady={() => setReady(true)} />
            <button
                disabled={!stripe || !elements || !ready || submitting}
                style={{ marginTop: 12 }}
            >
                {submitting ? "Processing..." : "Pay"}
            </button>
        </form>
    );
}

export default function Checkout() {
    const [items, setItems] = useState<CartItem[]>([]);
    const [clientSecret, setClientSecret] = useState("");

    useEffect(() => {
        api.get<CartItem[]>("/cart.php").then(({ data }) => setItems(data));
        api
            .post<{ clientSecret: string }>("/stripe.php")
            .then(({ data }) => setClientSecret(data.clientSecret))
            .catch((err) => {
                const msg =
                    err?.response?.data?.message ||
                    err?.message ||
                    "Failed to create PaymentIntent";
                alert(msg);
                console.error("PI create error:", err);
            });
    }, []);

    const total = useMemo(
        () => items.reduce((s, i) => s + i.price_cents * i.qty, 0),
        [items]
    );

    return (
        <div style={{ padding: 20, maxWidth: 520 }}>
            <h2>Checkout</h2>
            <ul>
                {items.map((i) => (
                    <li key={i.id}>
                        {i.name} ¡Á {i.qty} ={" "}
                        {currency(i.price_cents * i.qty, { fromCents: true }).format()}
                    </li>
                ))}
            </ul>
            <h4>Total: {currency(total, { fromCents: true }).format()}</h4>

            {clientSecret ? (
                <Elements
                    stripe={stripePromise}
                    options={{
                        clientSecret, // REQUIRED: lets PaymentElement mount
                        appearance: { theme: "stripe" },
                    }}
                    key={clientSecret} // force remount if you ever recreate the PI
                >
                    <CheckoutForm />
                </Elements>
            ) : (
                <div>Preparing secure payment¡­</div>
            )}
        </div>
    );
}
