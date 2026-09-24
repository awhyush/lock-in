"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { HISTORY_RANGE_OPTIONS, dateKey } from "@/lib/habits";
import {
  computeGoalStreak,
  computeGoalWeekCompletion,
  goalEntryDone,
  goalTargetText,
  type GoalDayData,
  type GoalDef,
} from "@/lib/goals";
import { Avatar } from "@/components/Avatar";
import { AppNav } from "@/components/AppNav";
import { HabitGrid, type HabitGridRow } from "@/components/HabitGrid";
import { NudgeBanner, type NudgeNotice } from "@/components/NudgeBanner";

export function GoalTracker({
  name,
  todayKey,
  todayLabel,
  goals,
  initialHistory,
  initialLoadedDays,
  nudges,
}: {
  name: string;
  todayKey: string;
  todayLabel: string;
  goals: GoalDef[];
  initialHistory: Record<string, GoalDayData>;
  initialLoadedDays: number;
  nudges: NudgeNotice[];
}) {
  const [history, setHistory] = useState<Record<string, GoalDayData>>(initialHistory);
  const [status, setStatus] = useState<string | null>(null);
  const [rangeDays, setRangeDays] = useState<number>(HISTORY_RANGE_OPTIONS[0]);
  const [loadedDays, setLoadedDays] = useState(initialLoadedDays);
  const [historyLoading, setHistoryLoading] = useState(false);
  const stripScrollRef = useRef<HTMLDivElement>(null);
  const firstName = name.split(" ")[0];
  const today = history[todayKey] ?? {};

  const days = useMemo(() => {
    const base = new Date(`${todayKey}T00:00:00`);
    const arr: { key: string; label: string }[] = [];
    for (let i = rangeDays - 1; i >= 0; i--) {
      const d = new Date(base);
      d.setDate(d.getDate() - i);
      arr.push({ key: dateKey(d), label: d.toLocaleDateString("en-US", { weekday: "narrow" }) });
    }
    return arr;
  }, [todayKey, rangeDays]);

  useEffect(() => {
    const el = stripScrollRef.current;
    if (el) el.scrollLeft = el.scrollWidth;
  }, [days]);

  const gridRows: HabitGridRow[] = useMemo(
    () =>
      goals.map((g) => ({
        key: g.id,
        label: g.label,
        history: Object.fromEntries(
          Object.entries(history).map(([date, data]) => [date, goalEntryDone(g, data[g.id])]),
        ),
      })),
    [goals, history],
  );

  const streak = useMemo(
    () => computeGoalStreak(history, goals, new Date(`${todayKey}T00:00:00`)),
    [history, goals, todayKey],
  );

  const weekPercent = useMemo(
    () => computeGoalWeekCompletion(history, goals, new Date(`${todayKey}T00:00:00`)),
    [history, goals, todayKey],
  );

  async function selectRange(n: number) {
    setRangeDays(n);
    if (n <= loadedDays) return;
    setHistoryLoading(true);
    try {
      const res = await fetch(`/api/goal-history?days=${n}`);
      if (res.ok) {
        const body = (await res.json()) as { history: Record<string, GoalDayData> };
        setHistory((h) => ({ ...body.history, ...h }));
        setLoadedDays(n);
      }
    } catch {
      // offline or a blip, the strip just shows what's already loaded
    } finally {
      setHistoryLoading(false);
    }
  }

  async function persistEntry(goal: GoalDef, next: { done: boolean; count: number }) {
    setHistory((h) => ({ ...h, [todayKey]: { ...(h[todayKey] ?? {}), [goal.id]: next } }));
    try {
      const res = await fetch("/api/goal-entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          goal.type === "counter"
            ? { goalId: goal.id, date: todayKey, count: next.count }
            : { goalId: goal.id, date: todayKey, done: next.done },
        ),
      });
      setStatus(res.ok ? null : "not saved, try again");
    } catch {
      setStatus("offline, not saved");
    }
  }

  function toggleGoal(goal: GoalDef) {
    const done = goalEntryDone(goal, today[goal.id]);
    persistEntry(goal, { done: !done, count: 0 });
  }

  function stepGoalCount(goal: GoalDef, delta: number) {
    const count = Math.max(0, (today[goal.id]?.count ?? 0) + delta);
    persistEntry(goal, { done: count >= 1, count });
  }

  return (
    <>
      <main className="mx-auto flex max-w-xl flex-col gap-5 px-4 py-8 pb-32">
        <header className="flex items-start justify-between gap-3">
          <div>
            <p className="font-bold text-[10px] uppercase tracking-[0.16em] text-sage">{todayLabel}</p>
            <h1 className="font-black text-[32px] leading-[1.05] tracking-tight text-ink">Hey {firstName}</h1>
          </div>
          <Avatar name={name} />
        </header>

        <NudgeBanner nudges={nudges} />

        <section className="relative overflow-hidden rounded-[2.5rem] border border-line bg-surface p-5 shadow-soft">
          <div className="pointer-events-none absolute right-0 top-0 h-40 w-40 translate-x-10 -translate-y-10 rounded-full bg-sage/20" />

          <p className="relative mb-4 font-bold text-[10px] uppercase tracking-[0.16em] text-sage">Today</p>

          <div className="relative mb-4 grid grid-cols-2 gap-3">
            <MetricCard label="Streak" value={`${streak}d`} />
            <MetricCard label="This week" value={weekPercent != null ? `${weekPercent}%` : "-"} />
          </div>

          <div className="relative flex flex-col gap-2">
            {goals.map((g) => {
              const entry = today[g.id];
              const done = goalEntryDone(g, entry);
              const targetText = goalTargetText(g);

              if (g.type === "counter") {
                return (
                  <div key={g.id} className="flex items-center gap-3 rounded-[1.5rem] border border-line bg-surface px-3 py-3">
                    <IconHolder done={done} />
                    <span className="min-w-0 flex-1">
                      <span className="block text-[15px] font-bold text-ink">{g.label}</span>
                      {targetText && <span className="block text-xs text-muted">{targetText}</span>}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        aria-label="decrease"
                        onClick={() => stepGoalCount(g, -1)}
                        className="flex h-7 w-7 items-center justify-center rounded-full border border-line bg-surface-2 text-sm leading-none text-ink"
                      >
                        -
                      </button>
                      <span className="min-w-4 text-center text-sm font-bold tabular-nums text-ink">
                        {entry?.count ?? 0}
                      </span>
                      <button
                        type="button"
                        aria-label="increase"
                        onClick={() => stepGoalCount(g, 1)}
                        className="flex h-7 w-7 items-center justify-center rounded-full border border-line bg-surface-2 text-sm leading-none text-ink"
                      >
                        +
                      </button>
                    </div>
                  </div>
                );
              }

              return (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => toggleGoal(g)}
                  className={`flex items-center gap-3 rounded-[1.5rem] border px-3 py-3 text-left transition-colors ${
                    done ? "border-transparent bg-good-bg" : "border-line bg-surface"
                  }`}
                >
                  <IconHolder done={done} />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[15px] font-bold text-ink">{g.label}</span>
                    {targetText && <span className="block text-xs text-muted">{targetText}</span>}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="rounded-[2.5rem] border border-line bg-surface p-5 shadow-soft">
          <div className="mb-3 flex items-center justify-between gap-3 px-0.5">
            <p className="font-bold text-[10px] uppercase tracking-[0.16em] text-sage">
              Last {rangeDays} days{historyLoading ? "..." : ""}
            </p>
            <div className="flex items-center gap-1">
              {HISTORY_RANGE_OPTIONS.map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => selectRange(n)}
                  className={`rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${
                    rangeDays === n ? "border-accent text-accent" : "border-line text-muted"
                  }`}
                >
                  {n}d
                </button>
              ))}
            </div>
          </div>
          <HabitGrid rows={gridRows} days={days} todayKey={todayKey} scrollRef={stripScrollRef} />
        </section>

        <p className="text-center text-xs text-muted">Every goal, every day, that&apos;s the whole rule.</p>
        {status && <p className="text-center text-[11px] font-bold text-warn">{status}</p>}
      </main>
      <AppNav />
    </>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1rem] border border-line bg-surface-2/80 p-3 backdrop-blur">
      <p className="font-bold text-[10px] uppercase tracking-[0.14em] text-sage">{label}</p>
      <p className="mt-1 text-2xl font-black tabular-nums text-ink">{value}</p>
    </div>
  );
}

function IconHolder({ done }: { done: boolean }) {
  return (
    <span className={`flex h-9 w-9 flex-none items-center justify-center rounded-full ${done ? "bg-accent" : "bg-surface-2"}`}>
      {done && (
        <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
          <path d="M4 12l5 5L20 6" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </span>
  );
}
