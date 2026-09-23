"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

function CirclesIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="8.5" cy="8.5" r="3.2" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="16" cy="10.5" r="2.6" stroke="currentColor" strokeWidth="1.8" />
      <path d="M3.5 19c.6-2.8 2.6-4.4 5-4.4s4.4 1.6 5 4.4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M14.5 19c.4-2 1.8-3.3 3.8-3.3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function SettingsIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M19.4 13.5a1.7 1.7 0 0 0 .34 1.87l.06.06a2.05 2.05 0 1 1-2.9 2.9l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1 1.55v.17a2.05 2.05 0 1 1-4.1 0v-.09a1.7 1.7 0 0 0-1.1-1.55 1.7 1.7 0 0 0-1.87.34l-.06.06a2.05 2.05 0 1 1-2.9-2.9l.06-.06a1.7 1.7 0 0 0 .34-1.87 1.7 1.7 0 0 0-1.55-1H4.6a2.05 2.05 0 1 1 0-4.1h.09a1.7 1.7 0 0 0 1.55-1.1 1.7 1.7 0 0 0-.34-1.87l-.06-.06a2.05 2.05 0 1 1 2.9-2.9l.06.06a1.7 1.7 0 0 0 1.87.34H10.7a1.7 1.7 0 0 0 1-1.55V4.6a2.05 2.05 0 1 1 4.1 0v.09a1.7 1.7 0 0 0 1 1.55 1.7 1.7 0 0 0 1.87-.34l.06-.06a2.05 2.05 0 1 1 2.9 2.9l-.06.06a1.7 1.7 0 0 0-.34 1.87v.09a1.7 1.7 0 0 0 1.55 1h.17a2.05 2.05 0 1 1 0 4.1h-.09a1.7 1.7 0 0 0-1.55 1Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ProfileIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="8.2" r="3.4" stroke="currentColor" strokeWidth="1.8" />
      <path d="M4.5 19.5c1-3.5 3.8-5.5 7.5-5.5s6.5 2 7.5 5.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function HomeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M4 11.5 12 4l8 7.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6 10v9h12v-9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

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

/** Fixed floating bottom nav shown on every authenticated page: Circles / Settings / Profile
 * on the left, a Dashboard "home" FAB floating above the center, then theme + sign out on the right. */
export function AppNav() {
  const pathname = usePathname();
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const isDark = mounted && resolvedTheme === "dark";

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex justify-center pb-[calc(env(safe-area-inset-bottom,0px)+16px)]">
      <div className="relative flex h-16 items-center gap-1 rounded-full bg-[#171e19] px-3 shadow-soft">
        <NavIcon href="/circles" label="Circles" active={pathname.startsWith("/circles")}>
          <CirclesIcon className="h-5 w-5" />
        </NavIcon>
        <NavIcon href="/settings" label="Edit plan" active={pathname === "/settings"}>
          <SettingsIcon className="h-5 w-5" />
        </NavIcon>
        <NavIcon href="/profile" label="My profile" active={pathname === "/profile"}>
          <ProfileIcon className="h-5 w-5" />
        </NavIcon>

        <span className="w-14 flex-none" aria-hidden />

        <button
          type="button"
          onClick={() => setTheme(isDark ? "light" : "dark")}
          aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
          title={isDark ? "Switch to light mode" : "Switch to dark mode"}
          className="flex h-12 w-12 flex-none items-center justify-center rounded-full text-[#eeebe3]/70 transition-colors hover:text-[#eeebe3]"
        >
          {isDark ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
        </button>
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/login" })}
          aria-label="Sign out"
          title="Sign out"
          className="flex h-12 w-12 flex-none items-center justify-center rounded-full text-[#eeebe3]/70 transition-colors hover:text-[#eeebe3]"
        >
          <SignOutIcon className="h-5 w-5" />
        </button>

        <Link
          href="/dashboard"
          aria-label="Dashboard"
          title="Dashboard"
          className="absolute left-1/2 -top-8 flex h-14 w-14 -translate-x-1/2 items-center justify-center rounded-full border-4 border-ground bg-accent text-accent-ink shadow-[0_10px_25px_-6px_rgba(202,0,19,0.55)] transition-transform active:scale-95"
        >
          <HomeIcon className="h-6 w-6" />
        </Link>
      </div>
    </nav>
  );
}

function NavIcon({
  href,
  label,
  active,
  children,
}: {
  href: string;
  label: string;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      title={label}
      className={`flex h-12 w-12 flex-none items-center justify-center rounded-full transition-colors ${
        active ? "bg-accent text-accent-ink" : "text-[#eeebe3]/70 hover:text-[#eeebe3]"
      }`}
    >
      {children}
    </Link>
  );
}
