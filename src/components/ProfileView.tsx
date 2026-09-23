"use client";

import { useState, type FormEvent } from "react";
import { Avatar } from "@/components/Avatar";
import { AppNav } from "@/components/AppNav";

const inputClass =
  "w-full rounded-full border border-line bg-surface-2 px-4 py-2.5 text-sm text-ink outline-none focus-visible:ring-2 focus-visible:ring-accent";

export function ProfileView({ name, email }: { name: string; email: string }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (newPassword !== confirm) {
      setError("New passwords don't match.");
      return;
    }

    setLoading(true);
    const res = await fetch("/api/account/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    const body = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(body.error ?? "Something went wrong.");
      return;
    }

    setCurrentPassword("");
    setNewPassword("");
    setConfirm("");
    setSuccess(true);
  }

  return (
    <>
      <main className="mx-auto flex max-w-xl flex-col gap-5 px-4 py-8 pb-32">
        <header className="flex items-center gap-4">
          <Avatar name={name} />
          <div>
            <p className="font-bold text-[10px] uppercase tracking-[0.16em] text-sage">My profile</p>
            <h1 className="font-black text-[32px] leading-[1.05] tracking-tight text-ink">{name}</h1>
          </div>
        </header>

        <section className="rounded-[2.5rem] border border-line bg-surface p-5 shadow-soft">
          <p className="mb-3 font-bold text-[10px] uppercase tracking-[0.16em] text-sage">Account</p>
          <div className="rounded-[1.5rem] border border-line bg-surface-2 px-4 py-3">
            <p className="text-xs text-muted">Email</p>
            <p className="text-sm font-bold text-ink">{email}</p>
          </div>
        </section>

        <section className="rounded-[2.5rem] border border-line bg-surface p-5 shadow-soft">
          <p className="mb-3 font-bold text-[10px] uppercase tracking-[0.16em] text-sage">Change password</p>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <label className="flex flex-col gap-1.5 text-sm font-medium text-ink">
              Current password
              <input
                type="password"
                required
                autoComplete="current-password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className={inputClass}
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-medium text-ink">
              New password
              <input
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className={inputClass}
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-medium text-ink">
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
            {success && <p className="text-sm text-good">Password updated.</p>}
            <button
              type="submit"
              disabled={loading}
              className="mt-1 rounded-full bg-accent px-4 py-3 text-sm font-bold text-accent-ink disabled:opacity-60"
            >
              {loading ? "Saving..." : "Update password"}
            </button>
          </form>
        </section>
      </main>
      <AppNav />
    </>
  );
}
