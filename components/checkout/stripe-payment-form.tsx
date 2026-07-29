"use client";

import { useState } from "react";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { Loader2, Lock, ShieldCheck } from "lucide-react";
import { getStripeBrowser } from "@/lib/stripe/browser";
import { formatMoney } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

interface Props {
  clientSecret: string;
  orderId: string;
  totalCents: number;
}

export function StripePaymentForm({ clientSecret, orderId, totalCents }: Props) {
  return (
    <Elements
      stripe={getStripeBrowser()}
      options={{
        clientSecret,
        appearance: {
          theme: "flat",
          variables: {
            colorPrimary: "#0F766E",
            colorText: "#111827",
            colorTextSecondary: "#6B7280",
            colorTextPlaceholder: "#9CA3AF",
            colorBackground: "#FFFFFF",
            colorDanger: "#EF4444",
            borderRadius: "8px",
            fontFamily: "Inter, system-ui, sans-serif",
            fontSizeBase: "14px",
            spacingUnit: "4px",
          },
          rules: {
            ".Input": {
              border: "1px solid #D1D5DB",
              boxShadow: "none",
              padding: "10px 12px",
            },
            ".Input:focus": {
              border: "1px solid #0F766E",
              boxShadow: "0 0 0 3px rgba(15, 118, 110, 0.15)",
            },
            ".Label": {
              fontWeight: "500",
              color: "#111827",
              marginBottom: "6px",
            },
          },
        },
      }}
    >
      <InnerForm orderId={orderId} totalCents={totalCents} />
    </Elements>
  );
}

function InnerForm({ orderId, totalCents }: { orderId: string; totalCents: number }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;
    setLoading(true);
    setError(null);

    const { error: stripeErr } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/checkout/success?order=${orderId}`,
      },
    });

    // If we get here, there was an immediate error (e.g. validation).
    // Successful payments redirect away — see return_url above.
    setLoading(false);
    if (stripeErr) {
      setError(stripeErr.message ?? "Payment failed");
    }
  }

  return (
    <form onSubmit={onSubmit}>
      <PaymentElement options={{ layout: "tabs" }} />

      {error && (
        <p className="mt-4 text-sm text-error bg-error/5 border border-error/20 rounded-md px-3 py-2">
          {error}
        </p>
      )}

      <div className="flex items-start gap-2 mt-5 text-xs text-ink-subtle">
        <ShieldCheck className="w-4 h-4 shrink-0 text-brand-primary-dark mt-0.5" />
        <p>
          Your payment is held in escrow by Freelance Marketplace until you approve the delivery.
          We never store your card details — Stripe handles all sensitive data.
        </p>
      </div>

      <button
        type="submit"
        disabled={loading || !stripe || !elements}
        className={cn(
          "w-full h-12 mt-5 inline-flex items-center justify-center gap-2 rounded-md text-sm font-semibold transition-colors",
          "bg-brand-primary text-white hover:bg-brand-primary-dark disabled:opacity-60 disabled:cursor-not-allowed"
        )}
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <>
            <Lock className="w-4 h-4" />
            Pay {formatMoney(totalCents / 100)}
          </>
        )}
      </button>
    </form>
  );
}
