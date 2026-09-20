"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { HISTORY_RANGE_OPTIONS, dateKey } from "@/lib/habits";
import { computeGoalStreak, computeGoalWeekCompletion, type GoalDayData } from "@/lib/goals";
import { Avatar } from "@/components/Avatar";
import { AppNav } from "@/components/AppNav";
import { HabitGrid, type HabitGridRow } from "@/components/HabitGrid";

export function GoalTracker({
  name,
  todayKey,
  todayLabel,
  goals,
  initialHistory,
  initialLoadedDays,
}: {
  name: string;
  todayKey: string;
  todayLabel: string;
  goals: { id: string; label: string }[];
  initialHistory: Record<string, GoalDayData>;
  initialLoadedDays: number;
}) {
  const [history, setHistory] = useState<Record<string, GoalDayData>>(initialHistory);
  const [status, setStatus] = useState<string | null>(null);
  const [rangeDays, setRangeDays] = useState<number>(HISTORY_RANGE_OPTIONS[0]);
  const [loadedDays, setLoadedDays] = useState(initialLoadedDays);
  const [historyLoading, setHistoryLoading] = useState(false);
  const stripScrollRef = useRef<HTMLDivElement>(null);
  const firstName = name.split(" ")[0];
  const goalIds = useMemo(() => goals.map((g) => g.id), [goals]);
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
        history: Object.fromEntries(Object.entries(history).map(([date, data]) => [date, data[g.id] === true])),
      })),
    [goals, history],
  );

  const streak = useMemo(
    () => computeGoalStreak(history, goalIds, new Date(`${todayKey}T00:00:00`)),
    [history, goalIds, todayKey],
  );

  const weekPercent = useMemo(
    () => computeGoalWeekCompletion(history, goalIds, new Date(`${todayKey}T00:00:00`)),
    [history, goalIds, todayKey],
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

  async function toggleGoal(goalId: string) {
    const next = today[goalId] !== true;
    setHistory((h) => ({ ...h, [todayKey]: { ...(h[todayKey] ?? {}), [goalId]: next } }));
    try {
      const res = await fetch("/api/goal-entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goalId, date: todayKey, done: next }),
      });
      setStatus(res.ok ? null : "not saved, try again");
    } catch {
      setStatus("offline, not saved");
    }
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

        <section className="relative overflow-hidden rounded-[2.5rem] border border-line bg-surface p-5 shadow-soft">
          <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-sage/20" />

          <p className="relative mb-4 font-bold text-[10px] uppercase tracking-[0.16em] text-sage">Today</p>

          <div className="relative mb-4 grid grid-cols-2 gap-3">
            <MetricCard label="Streak" value={`${streak}d`} />
            <MetricCard label="This week" value={weekPercent != null ? `${weekPercent}%` : "-"} />
          </div>

          <div className="relative flex flex-col gap-2">
            {goals.map((g) => {
              const done = today[g.id] === true;
              return (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => toggleGoal(g.id)}
                  className={`flex items-center gap-3 rounded-[1.5rem] border px-3 py-3 text-left transition-colors ${
                    done ? "border-transparent bg-good-bg" : "border-line bg-surface"
                  }`}
                >
                  <span className={`flex h-9 w-9 flex-none items-center justify-center rounded-full ${done ? "bg-accent" : "bg-surface-2"}`}>
                    {done && (
                      <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
                        <path d="M4 12l5 5L20 6" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </span>
                  <span className="text-[15px] font-bold text-ink">{g.label}</span>
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
