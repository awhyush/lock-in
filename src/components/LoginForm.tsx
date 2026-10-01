"use client";

import { useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { AuthCard, authButtonClass, authInputClass, authLabelClass, authLinkClass } from "@/components/AuthCard";
import { GoogleSignInButton } from "@/components/GoogleSignInButton";

export function LoginForm({ googleEnabled }: { googleEnabled: boolean }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const justReset = searchParams.get("reset") === "1";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);
    if (!res || res.error) {
      setError("Wrong email or password.");
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <AuthCard eyebrow="Welcome back" title="Sign in">
      {justReset && (
        <p className="mb-6 border-[0.5px] border-white/15 px-4 py-3 font-[family-name:var(--font-jetbrains-mono)] text-[10px] uppercase tracking-[0.2em] text-white/70">
          Password_updated. Sign in below.
        </p>
      )}
      {googleEnabled && (
        <>
          <GoogleSignInButton callbackUrl="/dashboard" />
          <div className="my-6 flex items-center gap-3 font-[family-name:var(--font-jetbrains-mono)] text-[10px] uppercase tracking-[0.3em] text-white/30">
            <span className="h-[0.5px] flex-1 bg-white/15" />
            Or
            <span className="h-[0.5px] flex-1 bg-white/15" />
          </div>
        </>
      )}
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <label className={authLabelClass}>
          Email
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={authInputClass}
          />
        </label>
        <label className={authLabelClass}>
          {/* Forgot-password is disabled for now (see src/app/forgot-password/page.tsx) until
              a verified sending domain is set up — Resend's sandbox can only deliver to the
              account owner's own email, not real users. Re-add this link when it's back. */}
          Password
          <input
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={authInputClass}
          />
        </label>
        {error && (
          <p className="font-[family-name:var(--font-jetbrains-mono)] text-[10px] uppercase tracking-[0.2em] text-white/70">
            Error_ {error}
          </p>
        )}
        <button type="submit" disabled={loading} className={authButtonClass}>
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>
      <p className="mt-6 text-center font-[family-name:var(--font-inter)] text-sm font-light text-white/50">
        New here? <Link href="/signup" className={authLinkClass}>Create an account</Link>
      </p>
    </AuthCard>
  );
}
