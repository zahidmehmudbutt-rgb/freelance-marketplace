"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Lock, Loader2, Info, ShieldCheck, ChevronLeft } from "lucide-react";
import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { calculateOrderPricing, DEFAULT_PLATFORM_SETTINGS } from "@/lib/utils/fee-calculator";
import { formatMoney } from "@/lib/utils/format";
import { toast } from "sonner";
import { cn } from "@/lib/utils/cn";
import { isStripeLive } from "@/lib/stripe/browser";
import { StripePaymentForm } from "@/components/checkout/stripe-payment-form";
import type { GigPackage, Gig } from "@/types/database.types";

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="text-center py-16">
          <Loader2 className="w-6 h-6 animate-spin mx-auto text-ink-faint" />
        </div>
      }
    >
      <CheckoutInner />
    </Suspense>
  );
}

function CheckoutInner() {
  const router = useRouter();
  const search = useSearchParams();
  const gigId = search.get("gig");
  const pkgId = search.get("pkg");
  const extrasParam = search.get("extras") || "";

  const [gig, setGig] = useState<Gig | null>(null);
  const [pkg, setPkg] = useState<GigPackage | null>(null);
  const [extras, setExtras] = useState<any[]>([]);
  const [intent, setIntent] = useState<{ clientSecret: string; orderId: string } | null>(null);
  const [intentLoading, setIntentLoading] = useState(false);
  const [intentError, setIntentError] = useState<string | null>(null);
  const [useStripeFlow, setUseStripeFlow] = useState<boolean>(false);

  useEffect(() => {
    if (!gigId || !pkgId) return;
    const sb = createClient();
    (async () => {
      const [{ data: g }, { data: p }, { data: ex }] = await Promise.all([
        sb.from("gigs").select("*").eq("id", gigId).single(),
        sb.from("gig_packages").select("*").eq("id", pkgId).single(),
        sb
          .from("gig_extras")
          .select("*")
          .in(
            "id",
            extrasParam ? extrasParam.split(",").filter(Boolean) : ["00000000-0000-0000-0000-000000000000"]
          ),
      ]);
      setGig(g as Gig);
      setPkg(p as GigPackage);
      setExtras(ex ?? []);
    })();
  }, [gigId, pkgId, extrasParam]);

  // Decide flow + create PaymentIntent once we have order context
  useEffect(() => {
    if (!gig || !pkg || intent || intentLoading) return;
    if (!isStripeLive()) {
      setUseStripeFlow(false);
      return;
    }
    (async () => {
      setIntentLoading(true);
      setIntentError(null);
      try {
        const res = await fetch("/api/payments/create-intent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            gig_id: gigId,
            package_id: pkgId,
            selected_extras: extras.map((e) => ({ id: e.id, title: e.title, price: Number(e.price) })),
          }),
        });
        if (res.status === 503) {
          // Server says Stripe isn't configured — fall back gracefully
          setUseStripeFlow(false);
          return;
        }
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to start payment");
        setIntent({ clientSecret: data.clientSecret, orderId: data.orderId });
        setUseStripeFlow(true);
      } catch (e: any) {
        setIntentError(e.message);
        setUseStripeFlow(false);
      } finally {
        setIntentLoading(false);
      }
    })();
  }, [gig, pkg, extras, gigId, pkgId, intent, intentLoading]);

  if (!gig || !pkg) {
    return (
      <>
        <Navbar />
        <main className="max-w-4xl mx-auto px-4 py-16 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-ink-faint" />
        </main>
        <Footer />
      </>
    );
  }

  const extrasTotal = extras.reduce((s, e) => s + Number(e.price), 0);
  const pricing = calculateOrderPricing(Number(pkg.price), extrasTotal, DEFAULT_PLATFORM_SETTINGS);

  return (
    <>
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <Link
          href={`/gig/${gig.slug}`}
          className="inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink mb-4 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to gig
        </Link>

        <h1 className="font-heading text-2xl sm:text-3xl text-ink mb-1">Secure checkout</h1>
        <p className="text-sm text-ink-subtle mb-8">
          Review your order, then complete payment to release the brief to your seller.
        </p>

        <div className="grid lg:grid-cols-[1fr_380px] gap-6 lg:gap-8">
          <section className="space-y-5">
            {useStripeFlow ? (
              <div className="bg-brand-primary-50 border border-brand-primary/20 rounded-xl p-4 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-brand-primary-dark shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-semibold text-ink mb-0.5">Test mode payment</p>
                  <p className="text-ink-muted leading-relaxed">
                    Use <code className="px-1.5 py-0.5 bg-white border border-line rounded text-xs">4242 4242 4242 4242</code>,
                    any future expiry, any CVC.
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-info/5 border border-info/20 rounded-xl p-4 flex items-start gap-3">
                <Info className="w-5 h-5 text-info shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-semibold text-ink mb-0.5">Demo mode — no real charge</p>
                  <p className="text-ink-muted leading-relaxed">
                    Stripe isn&apos;t configured in this environment. Fill in any card details to
                    simulate placing the order.
                  </p>
                </div>
              </div>
            )}

            <div className="bg-white border border-line rounded-2xl p-6 sm:p-7">
              <h2 className="font-heading text-base text-ink mb-5">Payment details</h2>
              {useStripeFlow ? (
                intent ? (
                  <StripePaymentForm
                    clientSecret={intent.clientSecret}
                    orderId={intent.orderId}
                    totalCents={Math.round(pricing.buyerTotalPaid * 100)}
                  />
                ) : intentLoading ? (
                  <div className="py-10 text-center">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-ink-faint" />
                    <p className="text-sm text-ink-subtle mt-2">Preparing secure payment…</p>
                  </div>
                ) : intentError ? (
                  <div className="py-8 text-center">
                    <p className="text-sm text-error mb-1">Couldn&apos;t start payment</p>
                    <p className="text-xs text-ink-subtle">{intentError}</p>
                  </div>
                ) : null
              ) : (
                <DemoCardForm
                  totalPaid={pricing.buyerTotalPaid}
                  onPlaceOrder={async () => {
                    const res = await fetch("/api/orders", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        gig_id: gigId,
                        package_id: pkgId,
                        selected_extras: extras.map((e) => ({ id: e.id, title: e.title, price: Number(e.price) })),
                      }),
                    });
                    const data = await res.json();
                    if (!res.ok) throw new Error(data.error || "Failed to place order");
                    toast.success("Order placed!");
                    router.push(`/order/${data.order.id}/requirements`);
                  }}
                />
              )}
            </div>
          </section>

          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="bg-white border border-line rounded-2xl overflow-hidden shadow-card">
              <div className="p-5 border-b border-line bg-canvas-subtle">
                <h2 className="font-heading text-base text-ink mb-2">Order summary</h2>
                <p className="text-sm font-medium text-ink line-clamp-2">{gig.title}</p>
                <p className="text-xs text-ink-subtle mt-1">
                  {pkg.name} · {pkg.delivery_days} days · {pkg.revisions === -1 ? "Unlimited" : pkg.revisions} revisions
                </p>
              </div>

              <div className="p-5 space-y-2 text-sm border-b border-line">
                <div className="flex justify-between text-ink-muted">
                  <span>Package</span>
                  <span className="tabular-nums">{formatMoney(Number(pkg.price))}</span>
                </div>
                {extras.length > 0 && (
                  <>
                    {extras.map((e) => (
                      <div key={e.id} className="flex justify-between text-ink-muted">
                        <span className="truncate pr-2">+ {e.title}</span>
                        <span className="tabular-nums shrink-0">{formatMoney(Number(e.price))}</span>
                      </div>
                    ))}
                  </>
                )}
                <div className="flex justify-between text-ink-subtle text-xs pt-2">
                  <span>Service fee</span>
                  <span className="tabular-nums">{formatMoney(pricing.buyerServiceFee)}</span>
                </div>
                {pricing.buyerSmallOrderFee > 0 && (
                  <div className="flex justify-between text-ink-subtle text-xs">
                    <span>Small order fee</span>
                    <span className="tabular-nums">{formatMoney(pricing.buyerSmallOrderFee)}</span>
                  </div>
                )}
              </div>

              <div className="p-5 flex justify-between text-base font-semibold text-ink">
                <span>Total</span>
                <span className="tabular-nums">{formatMoney(pricing.buyerTotalPaid)}</span>
              </div>
            </div>
          </aside>
        </div>
      </main>
      <Footer />
    </>
  );
}

function DemoCardForm({
  totalPaid,
  onPlaceOrder,
}: {
  totalPaid: number;
  onPlaceOrder: () => Promise<void>;
}) {
  const [card, setCard] = useState("");
  const [exp, setExp] = useState("");
  const [cvc, setCvc] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState(false);

  const errors = {
    card: card.length !== 16 ? "Card number must be 16 digits" : "",
    exp: !/^\d{2}\/\d{2}$/.test(exp) ? "Use MM/YY format" : "",
    cvc: cvc.length < 3 ? "CVC must be 3–4 digits" : "",
    name: name.trim().length < 2 ? "Required" : "",
  };
  const valid = !errors.card && !errors.exp && !errors.cvc && !errors.name;

  function fmtExpiry(v: string) {
    const digits = v.replace(/\D/g, "").slice(0, 4);
    if (digits.length < 3) return digits;
    return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  }
  function fmtCard(v: string) {
    return v.replace(/\D/g, "").slice(0, 16);
  }

  async function submit() {
    setTouched(true);
    if (!valid) {
      toast.error("Please fill in all card details.");
      return;
    }
    setLoading(true);
    try {
      await onPlaceOrder();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="space-y-4">
        <Field label="Cardholder name" error={touched ? errors.name : ""}>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="As shown on card" autoComplete="cc-name" />
        </Field>

        <Field label="Card number" error={touched ? errors.card : ""}>
          <div className="relative">
            <Input
              value={card.replace(/(\d{4})(?=\d)/g, "$1 ")}
              onChange={(e) => setCard(fmtCard(e.target.value))}
              placeholder="1234 5678 9012 3456"
              inputMode="numeric"
              autoComplete="cc-number"
              className="pr-14"
            />
            <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-faint pointer-events-none" />
          </div>
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Expiry" error={touched ? errors.exp : ""}>
            <Input value={exp} onChange={(e) => setExp(fmtExpiry(e.target.value))} placeholder="MM/YY" inputMode="numeric" autoComplete="cc-exp" />
          </Field>
          <Field label="CVC" error={touched ? errors.cvc : ""}>
            <Input value={cvc} onChange={(e) => setCvc(e.target.value.replace(/\D/g, "").slice(0, 4))} placeholder="123" inputMode="numeric" autoComplete="cc-csc" />
          </Field>
        </div>
      </div>

      <div className="flex items-start gap-2 mt-5 text-xs text-ink-subtle">
        <ShieldCheck className="w-4 h-4 shrink-0 text-brand-primary-dark mt-0.5" />
        <p>
          Your payment is held in escrow by Brellis until you approve the delivery.
          Card details are not saved.
        </p>
      </div>

      <button
        onClick={submit}
        disabled={loading}
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
            Pay {formatMoney(totalPaid)}
          </>
        )}
      </button>
    </>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-ink mb-1.5">{label}</label>
      {children}
      {error && <p className="mt-1 text-xs text-error">{error}</p>}
    </div>
  );
}
