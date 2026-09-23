"use client";

import { useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { AuthCard } from "@/components/AuthCard";

const inputClass =
  "w-full rounded-full border border-line bg-surface-2 px-4 py-2.5 text-sm text-ink outline-none focus-visible:ring-2 focus-visible:ring-accent";

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
        <p className="text-sm text-warn">
          That reset link is missing its token. Request a new one from{" "}
          <Link href="/forgot-password" className="font-medium text-ink underline underline-offset-2">
            forgot password
          </Link>
          .
        </p>
      </AuthCard>
    );
  }

  return (
    <AuthCard eyebrow="Reset access" title="Reset password">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5 text-sm font-medium">
          New password
          <input
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClass}
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-medium">
          Confirm new password
          <input
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className={inputClass}
          />
        </label>
        {error && <p className="text-sm text-warn">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="mt-1 rounded-full bg-accent px-4 py-3 text-sm font-bold text-accent-ink disabled:opacity-60"
        >
          {loading ? "Saving..." : "Set new password"}
        </button>
      </form>
    </AuthCard>
  );
}
