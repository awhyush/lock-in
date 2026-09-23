"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { AuthCard } from "@/components/AuthCard";

const inputClass =
  "w-full rounded-full border border-line bg-surface-2 px-4 py-2.5 text-sm text-ink outline-none focus-visible:ring-2 focus-visible:ring-accent";

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
        <p className="text-sm text-ink">
          If an account exists for <b>{email}</b>, we&apos;ve sent a link to reset your password. It expires in 30
          minutes.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
          <button
            type="submit"
            disabled={loading}
            className="mt-1 rounded-full bg-accent px-4 py-3 text-sm font-bold text-accent-ink disabled:opacity-60"
          >
            {loading ? "Sending..." : "Send reset link"}
          </button>
        </form>
      )}
      <p className="mt-5 text-center text-sm text-muted">
        <Link href="/login" className="font-medium text-ink underline underline-offset-2">
          Back to sign in
        </Link>
      </p>
    </AuthCard>
  );
}
