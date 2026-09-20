"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { HISTORY_RANGE_OPTIONS, dateKey } from "@/lib/habits";
import { computeGoalStreak, type GoalDayData } from "@/lib/goals";
import { HabitGrid, type HabitGridRow } from "@/components/HabitGrid";
import { SignOutButton } from "@/components/SignOutButton";
import { ThemeToggle } from "@/components/ThemeToggle";

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
      // offline or a blip — the strip just shows what's already loaded
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
      setStatus(res.ok ? null : "not saved — try again");
    } catch {
      setStatus("offline — not saved");
    }
  }

  return (
    <main className="mx-auto flex max-w-xl flex-col gap-5 px-4 py-8">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-mono text-[11px] tracking-[0.14em] uppercase text-muted">{todayLabel}</p>
          <h1 className="font-display text-4xl font-extrabold leading-[0.9] tracking-wide">
            HEY {firstName.toUpperCase()}
          </h1>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className="text-right">
            <div className="font-mono text-3xl font-semibold leading-none text-accent tabular-nums">{streak}</div>
            <div className="text-[11px] text-muted">day streak</div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/circles"
              className="font-mono text-[11px] uppercase tracking-wide text-muted underline underline-offset-2"
            >
              Circles
            </Link>
            <Link
              href="/settings"
              className="font-mono text-[11px] uppercase tracking-wide text-muted underline underline-offset-2"
            >
              Edit plan
            </Link>
            <SignOutButton />
            <ThemeToggle />
          </div>
        </div>
      </header>

      <section className="rounded-2xl border border-line bg-surface p-4 shadow-sm">
        <p className="mb-3 px-0.5 font-mono text-[11px] tracking-[0.1em] uppercase text-muted">Today</p>
        <div className="flex flex-col gap-2">
          {goals.map((g) => {
            const done = today[g.id] === true;
            return (
              <button
                key={g.id}
                type="button"
                onClick={() => toggleGoal(g.id)}
                className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors ${
                  done ? "border-transparent bg-good-bg" : "border-line bg-surface"
                }`}
              >
                <span
                  className={`flex h-6 w-6 flex-none items-center justify-center rounded-[7px] border-2 ${
                    done ? "border-good bg-good" : "border-line bg-surface-2"
                  }`}
                >
                  {done && (
                    <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5">
                      <path d="M4 12l5 5L20 6" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </span>
                <span className="text-sm font-semibold">{g.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="rounded-2xl border border-line bg-surface p-4 shadow-sm">
        <div className="mb-2 flex items-center justify-between gap-3 px-0.5">
          <p className="font-mono text-[11px] tracking-[0.1em] uppercase text-muted">
            Last {rangeDays} days{historyLoading ? "…" : ""}
          </p>
          <div className="flex items-center gap-1">
            {HISTORY_RANGE_OPTIONS.map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => selectRange(n)}
                className={`rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-wide ${
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

      <p className="text-center text-xs text-muted">Every goal, every day — that&apos;s the whole rule.</p>
      {status && <p className="text-center font-mono text-[11px] text-warn">{status}</p>}
    </main>
  );
}
