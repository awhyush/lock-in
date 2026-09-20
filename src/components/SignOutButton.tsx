"use client";

import { signOut } from "next-auth/react";

export function SignOutButton() {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: "/login" })}
      className="font-mono text-[11px] uppercase tracking-wide text-muted underline underline-offset-2"
    >
      Sign out
    </button>
  );
}
