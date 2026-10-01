"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { AuthCard, authButtonClass, authInputClass, authLabelClass, authLinkClass } from "@/components/AuthCard";
import { GoogleSignInButton } from "@/components/GoogleSignInButton";

export function SignupForm({ googleEnabled }: { googleEnabled: boolean }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch("/api/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    const body = await res.json();

    if (!res.ok) {
      setLoading(false);
      setError(body.error ?? "Something went wrong.");
      return;
    }

    const signInRes = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);
    if (!signInRes || signInRes.error) {
      setError("Account created, but sign-in failed. Try signing in.");
      return;
    }
    router.push("/onboarding");
    router.refresh();
  }

  return (
    <AuthCard eyebrow="Let's lock in" title="Create account">
      {googleEnabled && (
        <>
          <GoogleSignInButton callbackUrl="/onboarding" />
          <div className="my-6 flex items-center gap-3 font-[family-name:var(--font-jetbrains-mono)] text-[10px] uppercase tracking-[0.3em] text-white/30">
            <span className="h-[0.5px] flex-1 bg-white/15" />
            Or
            <span className="h-[0.5px] flex-1 bg-white/15" />
          </div>
        </>
      )}
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <label className={authLabelClass}>
          Name
          <input
            type="text"
            required
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={authInputClass}
          />
        </label>
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
          Password
          <input
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={authInputClass}
          />
          <span className="normal-case tracking-normal text-white/30">At least 8 characters.</span>
        </label>
        {error && (
          <p className="font-[family-name:var(--font-jetbrains-mono)] text-[10px] uppercase tracking-[0.2em] text-white/70">
            Error_ {error}
          </p>
        )}
        <button type="submit" disabled={loading} className={authButtonClass}>
          {loading ? "Creating account..." : "Create account"}
        </button>
      </form>
      <p className="mt-6 text-center font-[family-name:var(--font-inter)] text-sm font-light text-white/50">
        Already have an account? <Link href="/login" className={authLinkClass}>Sign in</Link>
      </p>
    </AuthCard>
  );
}
