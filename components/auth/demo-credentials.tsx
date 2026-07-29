"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { KeyRound } from "lucide-react";
import { DEMO_ACCOUNTS, type DemoAccount } from "@/lib/demo-credentials";

interface DemoCredentialFieldProps {
  onFill: (account: DemoAccount) => void;
  children: ReactNode;
}

/**
 * Wraps a login input and lists the seeded demo accounts beneath it on focus.
 * Picking one fills the whole form.
 *
 * Focus is tracked on the wrapper rather than the input, because the buttons sit
 * inside the same container — moving focus to one must not count as leaving the
 * field. Escape is handled on the document so the wrapper stays a plain
 * container rather than a non-native interactive element.
 */
export function DemoCredentialField({ onFill, children }: DemoCredentialFieldProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <div
      ref={ref}
      className="relative"
      onFocusCapture={() => setOpen(true)}
      onBlur={(e) => {
        if (!ref.current?.contains(e.relatedTarget as Node | null)) setOpen(false);
      }}
    >
      {children}

      {open && (
        <div
          role="group"
          aria-label="Demo accounts"
          className="absolute left-0 right-0 top-full z-30 mt-2 overflow-hidden rounded-md border border-line-strong bg-white shadow-card-hover"
        >
          <p className="px-3 pb-1.5 pt-2.5 text-[11px] font-semibold uppercase tracking-wider text-ink-subtle">
            Demo accounts
          </p>
          {DEMO_ACCOUNTS.map((account) => (
            <button
              key={account.email}
              type="button"
              // Safari does not focus buttons on click; without this the wrapper
              // would see focus leave and close before the click landed.
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                onFill(account);
                setOpen(false);
              }}
              className="flex w-full items-start gap-2.5 border-t border-line px-3 py-2.5 text-left transition-colors hover:bg-canvas-subtle focus-visible:bg-canvas-subtle focus-visible:outline-none"
            >
              <KeyRound className="mt-0.5 h-4 w-4 shrink-0 text-brand-primary" />
              <span className="min-w-0 flex-1">
                <span className="block text-xs font-semibold text-ink">
                  {account.role} — {account.email}
                </span>
                <span className="block text-[11px] text-ink-subtle">{account.blurb}</span>
              </span>
              <span className="shrink-0 self-center text-[11px] font-semibold text-brand-primary-dark">
                Use
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
