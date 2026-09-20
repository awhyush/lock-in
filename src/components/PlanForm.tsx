"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PLAN_INFO, PLAN_MODES, type PlanMode } from "@/lib/habits";
import { MAX_GOALS, MAX_GOAL_LABEL_LENGTH } from "@/lib/goals";
import { ThemeToggle } from "@/components/ThemeToggle";

type GoalDraft = { id: string | null; label: string };

export function PlanForm({
  name,
  mode,
  initialPlanMode,
  initialGoals,
}: {
  name: string;
  mode: "onboarding" | "settings";
  initialPlanMode: PlanMode;
  initialGoals: { id: string; label: string }[];
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<PlanMode>(initialPlanMode);
  const [goals, setGoals] = useState<GoalDraft[]>(initialGoals.length > 0 ? initialGoals : [{ id: null, label: "" }]);
  const [newGoalLabel, setNewGoalLabel] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const firstName = name.split(" ")[0];

  function addGoal() {
    const label = newGoalLabel.trim();
    if (!label || goals.length >= MAX_GOALS) return;
    setGoals((g) => [...g, { id: null, label }]);
    setNewGoalLabel("");
  }

  function updateGoalLabel(index: number, label: string) {
    setGoals((g) => g.map((goal, i) => (i === index ? { ...goal, label } : goal)));
  }

  function removeGoal(index: number) {
    setGoals((g) => (g.length <= 1 ? g : g.filter((_, i) => i !== index)));
  }

  async function handleSubmit() {
    setLoading(true);
    setError(null);
    const res = await fetch("/api/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode: selected,
        goals: selected === "custom" ? goals.filter((g) => g.label.trim()) : undefined,
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
          Pick a recommended plan, or track your own goals. You can change this anytime.
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
                    {goals.map((g, i) => (
                      <div key={g.id ?? `new-${i}`} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={g.label}
                          maxLength={MAX_GOAL_LABEL_LENGTH}
                          placeholder="e.g. Read, Meditate, No sugar"
                          onChange={(e) => updateGoalLabel(i, e.target.value)}
                          className="w-full rounded-md border border-line bg-surface px-2.5 py-1.5 text-sm text-ink outline-none focus-visible:ring-2 focus-visible:ring-accent"
                        />
                        <button
                          type="button"
                          onClick={() => removeGoal(i)}
                          disabled={goals.length <= 1}
                          aria-label={`Remove ${g.label || "goal"}`}
                          className="flex-none text-muted disabled:opacity-30"
                        >
                          {"✕"}
                        </button>
                      </div>
                    ))}
                    {goals.length < MAX_GOALS && (
                      <div className="flex items-center gap-2 pt-1">
                        <input
                          type="text"
                          value={newGoalLabel}
                          maxLength={MAX_GOAL_LABEL_LENGTH}
                          placeholder="Add a goal"
                          onChange={(e) => setNewGoalLabel(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              addGoal();
                            }
                          }}
                          className="w-full rounded-md border border-line bg-surface px-2.5 py-1.5 text-sm text-ink outline-none focus-visible:ring-2 focus-visible:ring-accent"
                        />
                        <button
                          type="button"
                          onClick={addGoal}
                          className="flex-none rounded-md bg-accent px-3 py-1.5 text-xs font-semibold text-accent-ink"
                        >
                          Add
                        </button>
                      </div>
                    )}
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
