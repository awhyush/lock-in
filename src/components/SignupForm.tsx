"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { AuthCard } from "@/components/AuthCard";

const inputClass =
  "w-full rounded-full border border-line bg-surface-2 px-4 py-2.5 text-sm text-ink outline-none focus-visible:ring-2 focus-visible:ring-accent";

export function SignupForm() {
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
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5 text-sm font-medium">
          Name
          <input
            type="text"
            required
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-medium">
          Email
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-medium">
          Password
          <input
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClass}
          />
          <span className="text-xs text-muted">At least 8 characters.</span>
        </label>
        {error && <p className="text-sm text-warn">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="mt-1 rounded-full bg-accent px-4 py-3 text-sm font-bold text-accent-ink disabled:opacity-60"
        >
          {loading ? "Creating account..." : "Create account"}
        </button>
      </form>
      <p className="mt-5 text-center text-sm text-muted">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-ink underline underline-offset-2">
          Sign in
        </Link>
      </p>
    </AuthCard>
  );
}
