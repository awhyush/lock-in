"use client";

import { signIn } from "next-auth/react";

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden>
      <path
        fill="#4285F4"
        d="M46.5 24.5c0-1.6-.15-3.15-.42-4.64H24v9.05h12.66c-.55 2.9-2.2 5.37-4.68 7.02v5.84h7.57c4.43-4.08 6.95-10.1 6.95-17.27Z"
      />
      <path
        fill="#34A853"
        d="M24 47c6.33 0 11.64-2.1 15.52-5.68l-7.57-5.84c-2.1 1.4-4.78 2.24-7.95 2.24-6.1 0-11.27-4.12-13.12-9.66H3.06v6.06C6.92 41.98 14.83 47 24 47Z"
      />
      <path
        fill="#FBBC05"
        d="M10.88 27.9c-.47-1.4-.74-2.9-.74-4.4s.27-3 .74-4.4v-6.06H3.06A22.97 22.97 0 0 0 1 23.5c0 3.74.9 7.27 2.06 10.46l7.82-6.06Z"
      />
      <path
        fill="#EA4335"
        d="M24 9.94c3.44 0 6.52 1.18 8.95 3.5l6.71-6.71C35.63 3.05 30.32 1 24 1 14.83 1 6.92 6.02 3.06 13.04l7.82 6.06C12.73 14.06 17.9 9.94 24 9.94Z"
      />
    </svg>
  );
}

export function GoogleSignInButton({ callbackUrl }: { callbackUrl: string }) {
  return (
    <button
      type="button"
      onClick={() => signIn("google", { callbackUrl })}
      className="flex w-full items-center justify-center gap-2.5 rounded-full border border-line bg-surface-2 px-4 py-3 text-sm font-bold text-ink"
    >
      <GoogleIcon className="h-4 w-4" />
      Continue with Google
    </button>
  );
}
