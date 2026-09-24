"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { useTheme } from "next-themes";
import { useEffect } from "react";
import { Avatar } from "@/components/Avatar";
import { AppNav } from "@/components/AppNav";

const inputClass =
  "w-full rounded-full border border-line bg-surface-2 px-4 py-2.5 text-sm text-ink outline-none focus-visible:ring-2 focus-visible:ring-accent";

function SunIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="12" r="4.2" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M12 2.5v2.2M12 19.3v2.2M4.9 4.9l1.55 1.55M17.55 17.55l1.55 1.55M2.5 12h2.2M19.3 12h2.2M4.9 19.1l1.55-1.55M17.55 6.45l1.55-1.55"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function MoonIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  );
}

function SignOutIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M9 4H5.5A1.5 1.5 0 0 0 4 5.5v13A1.5 1.5 0 0 0 5.5 20H9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14 16l4-4-4-4M18 12H9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ThemeRow() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const isDark = mounted && resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="flex items-center justify-between rounded-[1.5rem] border border-line bg-surface-2 px-4 py-3 text-left"
    >
      <span className="text-sm font-bold text-ink">{isDark ? "Dark mode" : "Light mode"}</span>
      {mounted && (isDark ? <SunIcon className="h-5 w-5 text-muted" /> : <MoonIcon className="h-5 w-5 text-muted" />)}
    </button>
  );
}

export function ProfileView({ name, email, hasPassword }: { name: string; email: string; hasPassword: boolean }) {
  const router = useRouter();
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
    if (!hasPassword) router.refresh(); // flips the form from "set" to "change" copy
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
          <p className="mb-3 font-bold text-[10px] uppercase tracking-[0.16em] text-sage">Preferences</p>
          <div className="flex flex-col gap-2">
            <ThemeRow />
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="flex items-center justify-between rounded-[1.5rem] border border-line bg-surface-2 px-4 py-3 text-left"
            >
              <span className="text-sm font-bold text-warn">Sign out</span>
              <SignOutIcon className="h-5 w-5 text-warn" />
            </button>
          </div>
        </section>

        <section className="rounded-[2.5rem] border border-line bg-surface p-5 shadow-soft">
          <p className="mb-3 font-bold text-[10px] uppercase tracking-[0.16em] text-sage">
            {hasPassword ? "Change password" : "Set a password"}
          </p>
          {!hasPassword && (
            <p className="mb-4 text-sm text-muted">
              You signed up with Google, so there&apos;s no password yet. Set one to also be able to sign in
              directly.
            </p>
          )}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {hasPassword && (
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
            )}
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
            {success && <p className="text-sm text-good">{hasPassword ? "Password updated." : "Password set."}</p>}
            <button
              type="submit"
              disabled={loading}
              className="mt-1 rounded-full bg-accent px-4 py-3 text-sm font-bold text-accent-ink disabled:opacity-60"
            >
              {loading ? "Saving..." : hasPassword ? "Update password" : "Set password"}
            </button>
          </form>
        </section>
      </main>
      <AppNav />
    </>
  );
}
