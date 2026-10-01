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
import { AvatarMenu } from "@/components/AvatarMenu";
import { AppNav } from "@/components/AppNav";
import { HabitGrid, type HabitGridRow } from "@/components/HabitGrid";
import { NudgeBanner, type NudgeNotice } from "@/components/NudgeBanner";
import { ProgressBar } from "@/components/ProgressBar";

const TILE_TONES = ["sage", "peach", "butter", "sky"] as const;
type Tone = (typeof TILE_TONES)[number];

const TILE_CLASSES: Record<Tone, { bg: string; ink: string; clay: string }> = {
  sage: { bg: "bg-sage", ink: "text-sage-ink", clay: "shadow-clay-sage" },
  peach: { bg: "bg-peach", ink: "text-peach-ink", clay: "shadow-clay-peach" },
  butter: { bg: "bg-butter", ink: "text-butter-ink", clay: "shadow-clay-butter" },
  sky: { bg: "bg-sky", ink: "text-sky-ink", clay: "shadow-clay-sky" },
};

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

  const doneCount = goals.filter((g) => goalEntryDone(g, today[g.id])).length;
  const progressPercent = goals.length > 0 ? Math.round((doneCount / goals.length) * 100) : 0;

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
      <main className="mx-auto flex w-full max-w-xl flex-col gap-5 px-4 py-8 pb-32">
        <header className="flex items-start justify-between gap-3">
          <div>
            <p className="font-semibold text-[10px] uppercase tracking-[0.16em] text-muted">{todayLabel}</p>
            <h1 className="font-black text-[32px] leading-[1.05] tracking-tight text-ink">Hey {firstName}</h1>
          </div>
          <AvatarMenu name={name} />
        </header>

        <NudgeBanner nudges={nudges} />

        <section className="relative overflow-hidden rounded-hero bg-sage p-6 shadow-clay-sage">
          <p className="font-bold text-[10px] uppercase tracking-[0.18em] text-sage-ink/80">Today&apos;s progress</p>
          <p className="mt-1 font-black text-3xl tracking-tight text-sage-ink">
            {doneCount} of {goals.length} goals
          </p>
          <div className="mt-4">
            <ProgressBar percent={progressPercent} />
          </div>
          <p className="mt-3 max-w-[70%] text-sm text-sage-ink/90">
            {streak > 0 ? `You're on a ${streak}-day streak, keep it up.` : "Check off today's goals to start a streak."}
          </p>
          <div className="absolute bottom-5 right-5 flex items-center gap-1.5 rounded-pill bg-surface px-3 py-1.5 shadow-clay">
            <FlameIcon className="h-4 w-4 text-peach-ink" />
            <span className="font-black text-sm tabular-nums text-ink">{streak}</span>
          </div>
        </section>

        <div className="grid grid-cols-2 gap-3">
          <StatTile tone="sky" icon={<ChartIcon className="h-5 w-5" />} value={weekPercent != null ? `${weekPercent}%` : "-"} label="This week" />
          <StatTile tone="butter" icon={<ListIcon className="h-5 w-5" />} value={`${goals.length}`} label="Goals tracked" />
        </div>

        <section className="flex flex-col gap-3">
          <p className="px-1 font-bold text-[10px] uppercase tracking-[0.16em] text-muted">Today&apos;s goals</p>

          {goals.map((g, i) => {
            const entry = today[g.id];
            const done = goalEntryDone(g, entry);
            const targetText = goalTargetText(g);
            const tone = TILE_TONES[i % TILE_TONES.length];

            if (g.type === "counter") {
              return (
                <div key={g.id} className="flex items-center gap-3 rounded-card bg-surface p-3 shadow-clay">
                  <IconTile tone={tone}>
                    <GoalIcon className="h-5 w-5" />
                  </IconTile>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[15px] font-bold text-ink">{g.label}</span>
                    {targetText && <span className="block text-xs text-muted">{targetText}</span>}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      aria-label="decrease"
                      onClick={() => stepGoalCount(g, -1)}
                      className="flex h-7 w-7 items-center justify-center rounded-full bg-surface-2 text-sm leading-none text-ink shadow-clay-inset"
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
                      className="flex h-7 w-7 items-center justify-center rounded-full bg-surface-2 text-sm leading-none text-ink shadow-clay-inset"
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
                className="flex items-center gap-3 rounded-card bg-surface p-3 text-left shadow-clay"
              >
                <IconTile tone={tone}>
                  <GoalIcon className="h-5 w-5" />
                </IconTile>
                <span className="min-w-0 flex-1">
                  <span className="block text-[15px] font-bold text-ink">{g.label}</span>
                  {targetText && <span className="block text-xs text-muted">{targetText}</span>}
                </span>
                <ToggleCircle done={done} />
              </button>
            );
          })}
        </section>

        <section className="rounded-card bg-surface p-5 shadow-clay">
          <div className="mb-3 flex items-center justify-between gap-3 px-0.5">
            <p className="font-bold text-[10px] uppercase tracking-[0.16em] text-muted">
              Last {rangeDays} days{historyLoading ? "..." : ""}
            </p>
            <div className="flex items-center gap-1">
              {HISTORY_RANGE_OPTIONS.map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => selectRange(n)}
                  className={`rounded-pill px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${
                    rangeDays === n ? "bg-sage text-sage-ink shadow-clay-sage" : "bg-surface-2 text-muted shadow-clay-inset"
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

function StatTile({ tone, icon, value, label }: { tone: Tone; icon: React.ReactNode; value: string; label: string }) {
  return (
    <div className="rounded-card bg-surface p-4 shadow-clay">
      <IconTile tone={tone}>{icon}</IconTile>
      <p className="mt-3 font-black text-2xl tabular-nums text-ink">{value}</p>
      <p className="text-xs font-medium text-muted">{label}</p>
    </div>
  );
}

function IconTile({ tone, children }: { tone: Tone; children: React.ReactNode }) {
  const t = TILE_CLASSES[tone];
  return (
    <span className={`flex h-11 w-11 flex-none items-center justify-center rounded-tile ${t.bg} ${t.ink} ${t.clay}`}>
      {children}
    </span>
  );
}

function ToggleCircle({ done }: { done: boolean }) {
  if (done) {
    return (
      <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-sage shadow-clay-sage">
        <CheckIcon className="h-4 w-4 text-sage-ink" />
      </span>
    );
  }
  return <span className="h-9 w-9 flex-none rounded-full bg-surface-2 shadow-clay-inset ring-2 ring-line" />;
}

function GoalIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M12 3.5l2.2 4.6 5 .7-3.6 3.6.9 5.1L12 15l-4.5 2.5.9-5.1-3.6-3.6 5-.7Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function FlameIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M12 2.5c1 2.5-1.5 3.5-1.5 6 0 1.4 1 2.3 2.2 2.3.9 0 1.6-.6 1.8-1.4 1.6 1.4 2.5 3.3 2.5 5.1a5 5 0 0 1-10 0c0-4 2.5-6.5 5-12Z"
        fill="currentColor"
      />
    </svg>
  );
}

function ChartIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M5 19V10M12 19V5M19 19v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function ListIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M8 7h10M8 12h10M8 17h10M4.5 7h.01M4.5 12h.01M4.5 17h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M4 12l5 5L20 6" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
