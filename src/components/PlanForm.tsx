"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PLAN_INFO, PLAN_MODES, type PlanMode } from "@/lib/habits";
import {
  GOAL_COUNTER_BOUNDS,
  GOAL_DURATION_BOUNDS,
  MAX_GOALS,
  MAX_GOAL_LABEL_LENGTH,
  goalTargetText,
  type GoalDef,
  type GoalType,
} from "@/lib/goals";
import { ThemeToggle } from "@/components/ThemeToggle";
import { AppNav } from "@/components/AppNav";

type GoalDraft = { id: string | null; label: string; type: GoalType; target: number | null };

const TYPE_OPTIONS: { type: GoalType; label: string }[] = [
  { type: "checkbox", label: "Checkbox" },
  { type: "duration", label: "Duration" },
  { type: "counter", label: "Counter" },
];

export function PlanForm({
  name,
  mode,
  initialPlanMode,
  initialGoals,
}: {
  name: string;
  mode: "onboarding" | "settings";
  initialPlanMode: PlanMode;
  initialGoals: GoalDef[];
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<PlanMode>(initialPlanMode);
  const [goals, setGoals] = useState<GoalDraft[]>(initialGoals);
  const [newGoalLabel, setNewGoalLabel] = useState("");
  const [newGoalType, setNewGoalType] = useState<GoalType>("checkbox");
  const [newGoalTarget, setNewGoalTarget] = useState(GOAL_DURATION_BOUNDS.min);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const firstName = name.split(" ")[0];

  function changeNewGoalType(type: GoalType) {
    setNewGoalType(type);
    setNewGoalTarget(type === "counter" ? GOAL_COUNTER_BOUNDS.min : GOAL_DURATION_BOUNDS.min);
  }

  function addGoal() {
    const label = newGoalLabel.trim();
    if (!label || goals.length >= MAX_GOALS) return;
    const target = newGoalType === "checkbox" ? null : newGoalTarget;
    setGoals((g) => [...g, { id: null, label, type: newGoalType, target }]);
    setNewGoalLabel("");
    changeNewGoalType("checkbox");
  }

  function removeGoal(index: number) {
    setGoals((g) => g.filter((_, i) => i !== index));
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

  const targetBounds = newGoalType === "counter" ? GOAL_COUNTER_BOUNDS : GOAL_DURATION_BOUNDS;

  return (
    <>
      <main className={`flex min-h-screen items-center justify-center px-4 py-12 ${mode === "settings" ? "pb-32" : ""}`}>
        <div className="w-full max-w-lg">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-bold text-[10px] uppercase tracking-[0.16em] text-sage">
                {mode === "onboarding" ? `Hey ${firstName}` : "Your plan"}
              </p>
              <h1 className="font-black text-[32px] leading-[1.05] tracking-tight text-ink">
                {mode === "onboarding" ? "How much are you investing right now?" : "How much are you investing?"}
              </h1>
            </div>
            {mode === "onboarding" && <ThemeToggle className="mt-1 flex-none" />}
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
                    className={`flex w-full flex-col gap-1 rounded-[1.5rem] border px-5 py-4 text-left transition-colors ${
                      active ? "border-accent bg-good-bg/40" : "border-line bg-surface"
                    }`}
                  >
                    <span className="flex items-center gap-2 font-bold text-ink">
                      <span className={`inline-block h-2.5 w-2.5 rounded-full ${active ? "bg-accent" : "bg-surface-2"}`} />
                      {info.title}
                    </span>
                    <span className="text-sm text-muted">{info.description}</span>
                  </button>

                  {key === "custom" && active && (
                    <div className="mt-2 flex flex-col gap-3 rounded-[1.5rem] border border-line bg-surface-2 p-4">
                      <div className="flex flex-col gap-2">
                        <input
                          type="text"
                          value={newGoalLabel}
                          maxLength={MAX_GOAL_LABEL_LENGTH}
                          placeholder="e.g. Read, Meditate, No sugar"
                          onChange={(e) => setNewGoalLabel(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              addGoal();
                            }
                          }}
                          className="w-full rounded-full border border-line bg-surface px-4 py-2 text-sm text-ink outline-none focus-visible:ring-2 focus-visible:ring-accent"
                        />

                        <div className="flex items-center gap-1.5">
                          {TYPE_OPTIONS.map((opt) => (
                            <button
                              key={opt.type}
                              type="button"
                              onClick={() => changeNewGoalType(opt.type)}
                              className={`rounded-full border px-3 py-1.5 text-xs font-bold ${
                                newGoalType === opt.type ? "border-accent bg-accent text-accent-ink" : "border-line text-muted"
                              }`}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>

                        {newGoalType !== "checkbox" && (
                          <div className="flex items-center gap-3 rounded-full border border-line bg-surface px-4 py-2">
                            <span className="text-xs font-medium text-muted">
                              {newGoalType === "counter" ? "Aim for" : "Minutes"}
                            </span>
                            <input
                              type="range"
                              min={targetBounds.min}
                              max={targetBounds.max}
                              step={targetBounds.step}
                              value={newGoalTarget}
                              onChange={(e) => setNewGoalTarget(Number(e.target.value))}
                              className="flex-1 accent-accent"
                            />
                            <span className="w-10 flex-none text-right text-sm font-bold tabular-nums text-ink">
                              {newGoalTarget}
                            </span>
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={addGoal}
                          disabled={!newGoalLabel.trim() || goals.length >= MAX_GOALS}
                          className="rounded-full bg-accent px-4 py-2 text-xs font-bold text-accent-ink disabled:opacity-50"
                        >
                          Add goal
                        </button>
                      </div>

                      {goals.length > 0 ? (
                        <ul className="flex flex-col gap-1.5">
                          {goals.map((g, i) => (
                            <li
                              key={g.id ?? `new-${i}`}
                              className="flex items-center justify-between gap-2 rounded-[1rem] border border-line bg-surface px-4 py-2.5"
                            >
                              <span className="min-w-0">
                                <span className="block truncate text-sm text-ink">{g.label}</span>
                                {goalTargetText(g) && (
                                  <span className="block text-xs text-muted">{goalTargetText(g)}</span>
                                )}
                              </span>
                              <button
                                type="button"
                                onClick={() => removeGoal(i)}
                                aria-label={`Remove ${g.label}`}
                                className="flex-none text-muted"
                              >
                                {"✕"}
                              </button>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="px-1 text-xs text-muted">Add at least one goal to track.</p>
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
            className="mt-6 w-full rounded-full bg-accent px-4 py-3 text-sm font-bold text-accent-ink disabled:opacity-60"
          >
            {loading ? "Saving..." : mode === "onboarding" ? "Start the reset" : "Save plan"}
          </button>
        </div>
      </main>
      {mode === "settings" && <AppNav />}
    </>
  );
}
