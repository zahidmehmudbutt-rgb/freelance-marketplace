import Link from "next/link";
import { Sparkles } from "lucide-react";

/**
 * Slim banner announcing that this is a live demo and that sign-in details are
 * offered on the login form. Without it a visitor meets a login wall with no
 * obvious way through, and leaves without seeing buyer, seller, or admin views.
 */
export function DemoBanner() {
  return (
    <div className="border-b border-line bg-brand-primary-50">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-2 gap-y-1 px-4 py-2 text-center sm:px-6">
        <Sparkles className="h-3.5 w-3.5 shrink-0 text-brand-primary-dark" aria-hidden="true" />
        <span className="text-xs font-semibold text-ink">Live demo</span>
        <span className="text-xs text-ink-muted">
          — buyer, seller, and admin accounts are listed on the sign-in form; pick one and it fills itself in.
        </span>
        <Link
          href="/login"
          className="text-xs font-semibold text-brand-primary-dark underline-offset-2 hover:underline"
        >
          Sign in
        </Link>
      </div>
    </div>
  );
}
