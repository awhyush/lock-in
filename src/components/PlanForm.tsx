"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  CUSTOM_TARGET_BOUNDS,
  DEFAULT_CUSTOM_TARGETS,
  HABIT_LABELS,
  PLAN_INFO,
  PLAN_MODES,
  type CustomTargets,
  type HabitKey,
  type PlanMode,
} from "@/lib/habits";
import { ThemeToggle } from "@/components/ThemeToggle";

const CUSTOM_ROWS: { key: keyof CustomTargets; suffix: string }[] = [
  { key: "exercise", suffix: "min" },
  { key: "study", suffix: "min" },
  { key: "apply", suffix: "apps" },
  { key: "build", suffix: "min" },
  { key: "movement", suffix: "min" },
];

export function PlanForm({
  name,
  mode,
  initialPlanMode,
  initialCustomTargets,
}: {
  name: string;
  mode: "onboarding" | "settings";
  initialPlanMode: PlanMode;
  initialCustomTargets: CustomTargets | null;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<PlanMode>(initialPlanMode);
  const [custom, setCustom] = useState<CustomTargets>(initialCustomTargets ?? DEFAULT_CUSTOM_TARGETS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const firstName = name.split(" ")[0];

  async function handleSubmit() {
    setLoading(true);
    setError(null);
    const res = await fetch("/api/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode: selected,
        customTargets: selected === "custom" ? custom : undefined,
      }),
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
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-mono text-[11px] tracking-[0.14em] uppercase text-muted">
              {mode === "onboarding" ? `Hey ${firstName}` : "Your plan"}
            </p>
            <h1 className="font-display text-4xl font-extrabold leading-[0.95] tracking-wide">
              {mode === "onboarding" ? "How much are you investing right now?" : "How much are you investing?"}
            </h1>
          </div>
          <ThemeToggle className="mt-1 flex-none" />
        </div>
        <p className="mt-2 text-sm text-muted">
          Pick a recommended plan, or set your own minutes per habit. You can change this anytime.
        </p>

        <div className="mt-6 flex flex-col gap-3">
          {PLAN_MODES.map((key) => {
            const info = PLAN_INFO[key];
            const active = selected === key;
            return (
              <div key={key}>
                <button
                  type="button"
                  onClick={() => setSelected(key)}
                  className={`flex w-full flex-col gap-1 rounded-xl border px-4 py-3.5 text-left transition-colors ${
                    active ? "border-accent bg-good-bg/40" : "border-line bg-surface"
                  }`}
                >
                  <span className="flex items-center gap-2 font-semibold">
                    <span className={`inline-block h-2.5 w-2.5 rounded-full ${active ? "bg-accent" : "bg-surface-2"}`} />
                    {info.title}
                  </span>
                  <span className="text-sm text-muted">{info.description}</span>
                </button>

                {key === "custom" && active && (
                  <div className="mt-2 flex flex-col gap-2 rounded-xl border border-line bg-surface-2 p-3.5">
                    {CUSTOM_ROWS.map((row) => {
                      const bounds = CUSTOM_TARGET_BOUNDS[row.key];
                      return (
                        <label key={row.key} className="flex items-center justify-between gap-3 text-sm">
                          <span className="font-medium">{HABIT_LABELS[row.key as HabitKey]}</span>
                          <span className="flex items-center gap-2">
                            <input
                              type="number"
                              min={bounds.min}
                              max={bounds.max}
                              step={bounds.step}
                              value={custom[row.key]}
                              onChange={(e) =>
                                setCustom((c) => ({
                                  ...c,
                                  [row.key]: Math.min(
                                    bounds.max,
                                    Math.max(bounds.min, Number(e.target.value) || 0),
                                  ),
                                }))
                              }
                              className="w-16 rounded-md border border-line bg-surface px-2 py-1 text-right text-sm text-ink outline-none focus-visible:ring-2 focus-visible:ring-accent"
                            />
                            <span className="w-9 text-xs text-muted">{row.suffix}</span>
                          </span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {error && <p className="mt-3 text-sm text-warn">{error}</p>}

        <button
          type="button"
          onClick={handleSubmit}
          disabled={loading}
          className="mt-6 w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-accent-ink disabled:opacity-60"
        >
          {loading ? "Saving…" : mode === "onboarding" ? "Start the reset" : "Save plan"}
        </button>
      </div>
    </main>
  );
}
