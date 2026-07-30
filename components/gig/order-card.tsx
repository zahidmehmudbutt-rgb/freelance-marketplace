"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { Check, X, Clock, RotateCcw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import { formatMoney } from "@/lib/utils/format";
import { calculateOrderPricing, DEFAULT_PLATFORM_SETTINGS } from "@/lib/utils/fee-calculator";
import type { GigPackage, GigExtra } from "@/types/database.types";

export function OrderCard({
  gigId,
  packages,
  extras,
}: {
  gigId: string;
  packages: GigPackage[];
  extras: GigExtra[];
}) {
  const [pkgType, setPkgType] = useState<string>(packages[0]?.package_type ?? "basic");
  const [selectedExtras, setSelectedExtras] = useState<string[]>([]);

  const currentPkg = packages.find((p) => p.package_type === pkgType) ?? packages[0];
  const extrasTotal = useMemo(
    () => extras.filter((e) => selectedExtras.includes(e.id)).reduce((sum, e) => sum + Number(e.price), 0),
    [extras, selectedExtras]
  );

  const pricing = calculateOrderPricing(Number(currentPkg?.price ?? 0), extrasTotal, DEFAULT_PLATFORM_SETTINGS);
  const orderUrl = `/checkout?gig=${gigId}&pkg=${currentPkg?.id}&extras=${selectedExtras.join(",")}`;

  return (
    <div className="bg-white border border-line rounded-2xl overflow-hidden shadow-card">
      <div role="tablist" aria-label="Package tiers" className="flex border-b border-line bg-canvas-subtle">
        {packages.map((p) => {
          const active = p.package_type === pkgType;
          const isMid = p.package_type === "standard";
          return (
            <button
              key={p.package_type}
              role="tab"
              aria-selected={active}
              onClick={() => setPkgType(p.package_type)}
              className={cn(
                // Label sits on its own baseline at the bottom so the badge above
                // it never overlaps, and the badge stays inside the button — the
                // card's overflow-hidden would clip anything with a negative offset.
                "relative flex-1 h-14 flex items-end justify-center pb-3 text-sm font-medium capitalize transition-colors",
                active
                  ? "bg-white text-ink border-b-2 border-brand-primary -mb-px"
                  : "text-ink-subtle hover:text-ink hover:bg-white/60"
              )}
            >
              {p.package_type}
              {isMid && !active && (
                <span className="pointer-events-none absolute top-1.5 left-1/2 -translate-x-1/2 inline-flex items-center px-1.5 py-0.5 rounded-full bg-brand-accent text-white text-[9px] font-semibold uppercase tracking-wider leading-none">
                  Popular
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="p-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-heading text-base text-ink truncate">{currentPkg?.name}</h3>
            {currentPkg?.description && (
              <p className="text-xs text-ink-subtle mt-1 line-clamp-2">{currentPkg.description}</p>
            )}
          </div>
          <p className="font-heading text-2xl text-ink tabular-nums shrink-0">
            {formatMoney(Number(currentPkg?.price ?? 0))}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 py-3 border-y border-line text-xs">
          <div className="flex items-center gap-1.5 text-ink-muted">
            <Clock className="w-3.5 h-3.5" />
            <span>
              <span className="font-semibold text-ink">{currentPkg?.delivery_days}</span> days delivery
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-ink-muted">
            <RotateCcw className="w-3.5 h-3.5" />
            <span>
              <span className="font-semibold text-ink">
                {currentPkg?.revisions === -1 ? "Unlimited" : currentPkg?.revisions}
              </span>{" "}
              revisions
            </span>
          </div>
        </div>

        <ul className="space-y-2 text-sm">
          {(currentPkg?.features ?? []).map((f, i) => (
            <li key={i} className="flex items-start gap-2">
              {f.included ? (
                <Check className="w-4 h-4 text-brand-primary shrink-0 mt-0.5" />
              ) : (
                <X className="w-4 h-4 text-ink-faint shrink-0 mt-0.5" />
              )}
              <span className={f.included ? "text-ink" : "text-ink-faint line-through"}>{f.name}</span>
            </li>
          ))}
        </ul>
      </div>

      {extras.length > 0 && (
        <div className="border-t border-line p-5 space-y-2.5 bg-canvas-subtle">
          <p className="text-2xs font-semibold text-ink-subtle uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3 h-3" />
            Add-ons
          </p>
          {extras.map((ex) => {
            const checked = selectedExtras.includes(ex.id);
            return (
              <label
                key={ex.id}
                className={cn(
                  "flex items-center justify-between gap-3 p-2.5 -mx-1 rounded-md text-sm cursor-pointer transition-colors",
                  checked ? "bg-brand-primary-50" : "hover:bg-white"
                )}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() =>
                      setSelectedExtras((s) =>
                        s.includes(ex.id) ? s.filter((x) => x !== ex.id) : [...s, ex.id]
                      )
                    }
                    className="w-4 h-4 accent-brand-primary"
                  />
                  <span className="text-ink truncate">{ex.title}</span>
                </div>
                <span className="font-semibold text-ink tabular-nums shrink-0">
                  +{formatMoney(Number(ex.price))}
                </span>
              </label>
            );
          })}
        </div>
      )}

      <div className="border-t border-line p-5 space-y-1.5 text-sm">
        <div className="flex justify-between text-ink-muted">
          <span>Package</span>
          <span className="tabular-nums">{formatMoney(pricing.gigBasePrice)}</span>
        </div>
        {pricing.extrasPrice > 0 && (
          <div className="flex justify-between text-ink-muted">
            <span>Add-ons</span>
            <span className="tabular-nums">+{formatMoney(pricing.extrasPrice)}</span>
          </div>
        )}
        <div className="flex justify-between text-ink-subtle text-xs">
          <span>Service fee</span>
          <span className="tabular-nums">{formatMoney(pricing.buyerServiceFee)}</span>
        </div>
        {pricing.buyerSmallOrderFee > 0 && (
          <div className="flex justify-between text-ink-subtle text-xs">
            <span>Small order fee</span>
            <span className="tabular-nums">{formatMoney(pricing.buyerSmallOrderFee)}</span>
          </div>
        )}
        <div className="flex justify-between font-semibold text-ink pt-2 mt-2 border-t border-line text-base">
          <span>Total</span>
          <span className="tabular-nums">{formatMoney(pricing.buyerTotalPaid)}</span>
        </div>
      </div>

      <div className="p-5 pt-0 space-y-2">
        <Link href={orderUrl} className="block">
          <Button variant="default" size="lg" className="w-full">
            Continue ({formatMoney(pricing.buyerTotalPaid)})
          </Button>
        </Link>
        <Button variant="secondary" className="w-full">
          Contact seller
        </Button>
      </div>
    </div>
  );
}
