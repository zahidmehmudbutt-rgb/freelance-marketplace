"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Loader2, MailCheck, ArrowLeft } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const sb = createClient();
    const { error: err } = await sb.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/api/auth/callback?next=/settings`,
    });
    setLoading(false);
    if (err) setError(err.message);
    else setSent(true);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-canvas px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-semibold text-brand-primary tracking-tight">
            Brellis
          </Link>
        </div>
        <div className="bg-white p-7 sm:p-8 rounded-2xl border border-line shadow-card">
          {sent ? (
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-brand-primary-50 text-brand-primary-dark flex items-center justify-center">
                <MailCheck className="w-5 h-5" />
              </div>
              <h1 className="font-heading text-xl text-ink mb-2">Check your email</h1>
              <p className="text-sm text-ink-muted leading-relaxed mb-6">
                If an account exists for <strong className="text-ink">{email}</strong>, we&apos;ve sent a
                reset link. The link expires in 1 hour.
              </p>
              <p className="text-xs text-ink-subtle leading-relaxed bg-canvas-subtle border border-line rounded-md p-3">
                <strong>Portfolio demo:</strong> emails are logged, not actually sent. Check the{" "}
                <Link href="/admin/emails" className="text-brand-primary-dark font-medium hover:underline">
                  admin email inbox
                </Link>.
              </p>
            </div>
          ) : (
            <>
              <h1 className="font-heading text-2xl text-ink text-center mb-1.5">Reset password</h1>
              <p className="text-sm text-ink-subtle text-center mb-6">
                We&apos;ll email you a link to set a new password.
              </p>
              <form onSubmit={onSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-ink mb-1.5">Email</label>
                  <Input
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                  />
                </div>
                {error && (
                  <p className="text-sm text-error bg-error/5 border border-error/20 rounded-md px-3 py-2">{error}</p>
                )}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 inline-flex items-center justify-center gap-2 rounded-md bg-brand-primary text-white text-sm font-semibold hover:bg-brand-primary-dark transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  Send reset link
                </button>
              </form>
            </>
          )}
        </div>
        <p className="text-sm text-center text-ink-muted mt-6">
          <Link href="/login" className="inline-flex items-center gap-1 font-medium text-brand-primary-dark hover:underline">
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
