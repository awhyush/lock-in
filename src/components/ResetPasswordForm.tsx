"use client";

import { useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { AuthCard, authButtonClass, authInputClass, authLabelClass, authLinkClass } from "@/components/AuthCard";

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }

    setLoading(true);
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });
    const body = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(body.error ?? "Something went wrong.");
      return;
    }

    router.push("/login?reset=1");
  }

  if (!token) {
    return (
      <AuthCard eyebrow="Reset access" title="Reset password">
        <p className="font-[family-name:var(--font-inter)] text-sm font-light text-white/70">
          That reset link is missing its token. Request a new one from{" "}
          <Link href="/forgot-password" className={authLinkClass}>
            forgot password
          </Link>
          .
        </p>
      </AuthCard>
    );
  }

  return (
    <AuthCard eyebrow="Reset access" title="Reset password">
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <label className={authLabelClass}>
          New password
          <input
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={authInputClass}
          />
        </label>
        <label className={authLabelClass}>
          Confirm new password
          <input
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className={authInputClass}
          />
        </label>
        {error && (
          <p className="font-[family-name:var(--font-jetbrains-mono)] text-[10px] uppercase tracking-[0.2em] text-white/70">
            Error_ {error}
          </p>
        )}
        <button type="submit" disabled={loading} className={authButtonClass}>
          {loading ? "Saving..." : "Set new password"}
        </button>
      </form>
    </AuthCard>
  );
}
