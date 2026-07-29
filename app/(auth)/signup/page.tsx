"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Loader2, AtSign } from "lucide-react";
import { Input } from "@/components/ui/input";
import { slugify } from "@/lib/utils/slug-generator";

export default function SignupPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const finalUsername =
      (username && username.trim()) ||
      slugify(fullName).replace(/-/g, "_").slice(0, 30) ||
      `user_${Date.now()}`;

    // Server-side create (skips Supabase's email confirmation + rate limit).
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, fullName, username: finalUsername }),
    });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      setLoading(false);
      setError(data?.error ?? "Couldn't create your account. Please try again.");
      return;
    }

    // Immediately sign in to establish a session.
    const sb = createClient();
    const { error: signInErr } = await sb.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (signInErr) {
      // The account was created but sign-in failed (rare). Send them to /login.
      router.push(`/login?redirect=/dashboard`);
      return;
    }
    router.push("/dashboard");
    router.refresh();
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
          <h1 className="font-heading text-2xl text-ink text-center mb-1.5">Create your account</h1>
          <p className="text-sm text-ink-subtle text-center mb-6">Join in under a minute. No card required.</p>
          <form onSubmit={onSubmit} className="space-y-4">
            <Field label="Full name">
              <Input
                required
                autoComplete="name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Ada Lovelace"
              />
            </Field>
            <Field label="Username" hint="Lowercase letters, numbers, underscores">
              <div className="relative">
                <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-faint pointer-events-none" />
                <Input
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                  placeholder="ada_l"
                  className="pl-9"
                />
              </div>
            </Field>
            <Field label="Email">
              <Input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </Field>
            <Field label="Password" hint="At least 6 characters">
              <Input
                type="password"
                required
                autoComplete="new-password"
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </Field>
            {error && (
              <p className="text-sm text-error bg-error/5 border border-error/20 rounded-md px-3 py-2">{error}</p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 inline-flex items-center justify-center gap-2 rounded-md bg-brand-primary text-white text-sm font-semibold hover:bg-brand-primary-dark transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Create account
            </button>
            <p className="text-xs text-center text-ink-subtle leading-relaxed">
              By creating an account, you agree to our terms of service and privacy policy.
            </p>
          </form>
        </div>
        <p className="text-sm text-center text-ink-muted mt-6">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-brand-primary-dark hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-baseline justify-between mb-1.5">
        <label className="text-sm font-medium text-ink">{label}</label>
        {hint && <span className="text-2xs text-ink-subtle">{hint}</span>}
      </div>
      {children}
    </div>
  );
}
