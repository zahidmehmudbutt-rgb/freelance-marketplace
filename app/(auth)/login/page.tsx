"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { DemoCredentialField } from "@/components/auth/demo-credentials";
import type { DemoAccount } from "@/lib/demo-credentials";

function LoginForm() {
  const router = useRouter();
  const search = useSearchParams();
  const redirect = search.get("redirect") || "/dashboard";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fillDemo = (account: DemoAccount) => {
    setEmail(account.email);
    setPassword(account.password);
    setError(null);
  };

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const sb = createClient();
    const { error: err } = await sb.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    router.push(redirect);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-ink mb-1.5">Email</label>
        <DemoCredentialField onFill={fillDemo}>
          <Input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
        </DemoCredentialField>
      </div>
      <div>
        <div className="flex items-baseline justify-between mb-1.5">
          <label className="text-sm font-medium text-ink">Password</label>
          <Link href="/forgot-password" className="text-xs font-medium text-brand-primary-dark hover:underline">
            Forgot?
          </Link>
        </div>
        <DemoCredentialField onFill={fillDemo}>
          <Input
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </DemoCredentialField>
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
        Sign in
      </button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-canvas px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-semibold text-brand-primary tracking-tight">
            Brellis
          </Link>
        </div>
        <div className="bg-white p-7 sm:p-8 rounded-2xl border border-line shadow-card">
          <h1 className="font-heading text-2xl text-ink text-center mb-1.5">Welcome back</h1>
          <p className="text-sm text-ink-subtle text-center mb-6">Sign in to your Brellis account.</p>
          <Suspense fallback={<Loader2 className="w-6 h-6 animate-spin mx-auto text-ink-faint" />}>
            <LoginForm />
          </Suspense>
        </div>
        <p className="text-sm text-center text-ink-muted mt-6">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="font-semibold text-brand-primary-dark hover:underline">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
