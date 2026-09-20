"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { INTENSITIES, INTENSITY_INFO, type Intensity } from "@/lib/habits";

export function OnboardingForm({ name }: { name: string }) {
  const router = useRouter();
  const [selected, setSelected] = useState<Intensity>("standard");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const firstName = name.split(" ")[0];

  async function handleContinue() {
    setLoading(true);
    setError(null);
    const res = await fetch("/api/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ intensity: selected }),
    });
    setLoading(false);
    if (!res.ok) {
      setError("Couldn't save that. Try again.");
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        <p className="font-mono text-[11px] tracking-[0.14em] uppercase text-muted">Hey {firstName}</p>
        <h1 className="font-display text-4xl font-extrabold leading-[0.95] tracking-wide">
          How much are you investing right now?
        </h1>
        <p className="mt-2 text-sm text-muted">
          Pick what matches your actual life this month, not your ideal one. You can change this later.
        </p>

        <div className="mt-6 flex flex-col gap-3">
          {INTENSITIES.map((key) => {
            const info = INTENSITY_INFO[key];
            const active = selected === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setSelected(key)}
                className={`flex flex-col gap-1 rounded-xl border px-4 py-3.5 text-left transition-colors ${
                  active ? "border-accent bg-good-bg/40" : "border-line bg-surface"
                }`}
              >
                <span className="flex items-center gap-2 font-semibold">
                  <span
                    className={`inline-block h-2.5 w-2.5 rounded-full ${active ? "bg-accent" : "bg-surface-2"}`}
                  />
                  {info.title}
                </span>
                <span className="text-sm text-muted">{info.description}</span>
              </button>
            );
          })}
        </div>

        {error && <p className="mt-3 text-sm text-warn">{error}</p>}

        <button
          type="button"
          onClick={handleContinue}
          disabled={loading}
          className="mt-6 w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-accent-ink disabled:opacity-60"
        >
          {loading ? "Setting up…" : "Start the reset"}
        </button>
      </div>
    </main>
  );
}
