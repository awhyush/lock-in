"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { AuthCard, authButtonClass, authInputClass, authLabelClass, authLinkClass } from "@/components/AuthCard";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setLoading(false);
    // Always show the same success state, whether or not the email exists.
    setSent(true);
  }

  return (
    <AuthCard eyebrow="Reset access" title="Forgot password">
      {sent ? (
        <p className="font-[family-name:var(--font-inter)] text-sm font-light text-white/70">
          If an account exists for <b className="font-medium text-white">{email}</b>, we&apos;ve sent a link to reset
          your password. It expires in 30 minutes.
        </p>
      ) : (
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
          <button type="submit" disabled={loading} className={authButtonClass}>
            {loading ? "Sending..." : "Send reset link"}
          </button>
        </form>
      )}
      <p className="mt-6 text-center font-[family-name:var(--font-inter)] text-sm font-light text-white/50">
        <Link href="/login" className={authLinkClass}>
          Back to sign in
        </Link>
      </p>
    </AuthCard>
  );
}
