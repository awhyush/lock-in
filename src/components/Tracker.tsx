"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  DAY_RULES,
  HABIT_KEYS,
  HISTORY_RANGE_OPTIONS,
  computeStreak,
  computeWeekCompletion,
  dateKey,
  describeDayRule,
  habitDone,
  habitTargetText,
  type CheckInData,
  type HabitKey,
  type HabitTarget,
} from "@/lib/habits";
import { Avatar } from "@/components/Avatar";
import { AppNav } from "@/components/AppNav";
import { HabitGrid, type HabitGridRow } from "@/components/HabitGrid";
import { NudgeBanner, type NudgeNotice } from "@/components/NudgeBanner";

const BOOLEAN_KEYS: Extract<HabitKey, "exercise" | "study" | "build" | "movement">[] = [
  "exercise",
  "study",
  "build",
  "movement",
];

export function Tracker({
  name,
  targets,
  todayKey,
  todayLabel,
  initialHistory,
  initialLoadedDays,
  nudges,
}: {
  name: string;
  targets: Record<HabitKey, HabitTarget>;
  todayKey: string;
  todayLabel: string;
  initialHistory: Record<string, CheckInData>;
  initialLoadedDays: number;
  nudges: NudgeNotice[];
}) {
  const [history, setHistory] = useState<Record<string, CheckInData>>(initialHistory);
  const [status, setStatus] = useState<string | null>(null);
  const [rangeDays, setRangeDays] = useState<number>(HISTORY_RANGE_OPTIONS[0]);
  const [loadedDays, setLoadedDays] = useState(initialLoadedDays);
  const [historyLoading, setHistoryLoading] = useState(false);
  const stripScrollRef = useRef<HTMLDivElement>(null);
  const firstName = name.split(" ")[0];

  const weekday = useMemo(() => new Date(`${todayKey}T00:00:00`).getDay(), [todayKey]);
  const rule = DAY_RULES[weekday];
  const today = history[todayKey] ?? { exercise: false, study: false, apply: 0, build: false, movement: false, noNap: false };

  const days = useMemo(() => {
    const base = new Date(`${todayKey}T00:00:00`);
    const arr: { key: string; weekday: number; label: string }[] = [];
    for (let i = rangeDays - 1; i >= 0; i--) {
      const d = new Date(base);
      d.setDate(d.getDate() - i);
      arr.push({ key: dateKey(d), weekday: d.getDay(), label: d.toLocaleDateString("en-US", { weekday: "narrow" }) });
    }
    return arr;
  }, [todayKey, rangeDays]);

  useEffect(() => {
    const el = stripScrollRef.current;
    if (el) el.scrollLeft = el.scrollWidth;
  }, [days]);

  const gridRows: HabitGridRow[] = useMemo(
    () =>
      HABIT_KEYS.map((key) => ({
        key,
        label: targets[key].label,
        history: Object.fromEntries(
          Object.entries(history).map(([date, data]) => [date, habitDone(data, key)]),
        ),
      })),
    [history, targets],
  );

  const streak = useMemo(
    () => computeStreak(history, new Date(`${todayKey}T00:00:00`)),
    [history, todayKey],
  );

  const weekPercent = useMemo(
    () => computeWeekCompletion(history, new Date(`${todayKey}T00:00:00`)),
    [history, todayKey],
  );

  async function selectRange(n: number) {
    setRangeDays(n);
    if (n <= loadedDays) return;
    setHistoryLoading(true);
    try {
      const res = await fetch(`/api/history?days=${n}`);
      if (res.ok) {
        const body = (await res.json()) as { history: Record<string, CheckInData> };
        setHistory((h) => ({ ...body.history, ...h }));
        setLoadedDays(n);
      }
    } catch {
      // offline or a blip, the strip just shows what's already loaded
    } finally {
      setHistoryLoading(false);
    }
  }

  async function persist(next: CheckInData) {
    setHistory((h) => ({ ...h, [todayKey]: next }));
    try {
      const res = await fetch("/api/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: todayKey, data: next }),
      });
      setStatus(res.ok ? null : "not saved, try again");
    } catch {
      setStatus("offline, not saved");
    }
  }

  function toggle(key: (typeof BOOLEAN_KEYS)[number] | "noNap") {
    persist({ ...today, [key]: !today[key] });
  }

  function stepApply(delta: number) {
    persist({ ...today, apply: Math.max(0, today.apply + delta) });
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
            {BOOLEAN_KEYS.map((key) => {
              const done = habitDone(today, key);
              const required = rule.required.includes(key);
              return (
                <FeedRow
                  key={key}
                  label={targets[key].label}
                  sub={habitTargetText(targets[key])}
                  tag={required ? "core" : "bonus"}
                  done={done}
                  onToggle={() => toggle(key)}
                />
              );
            })}

            <div className="flex items-center gap-3 rounded-[1.5rem] border border-line bg-surface px-3 py-3">
              <IconHolder done={today.apply >= 1} />
              <span className="min-w-0 flex-1">
                <span className="block text-[15px] font-bold text-ink">{targets.apply.label}</span>
                <span className="block text-xs text-muted">{habitTargetText(targets.apply)}</span>
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  aria-label="decrease"
                  onClick={() => stepApply(-1)}
                  className="flex h-7 w-7 items-center justify-center rounded-full border border-line bg-surface-2 text-sm leading-none text-ink"
                >
                  -
                </button>
                <span className="min-w-4 text-center text-sm font-bold tabular-nums text-ink">{today.apply}</span>
                <button
                  type="button"
                  aria-label="increase"
                  onClick={() => stepApply(1)}
                  className="flex h-7 w-7 items-center justify-center rounded-full border border-line bg-surface-2 text-sm leading-none text-ink"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => toggle("noNap")}
            className={`relative mt-4 flex w-full items-center gap-2.5 border-t border-dashed border-line pt-4 text-left text-sm ${
              today.noNap ? "text-ink" : "text-muted"
            }`}
          >
            <span
              className={`flex h-5 w-5 flex-none items-center justify-center rounded-full border-2 ${
                today.noNap ? "border-warn bg-warn" : "border-line bg-surface-2"
              }`}
            >
              {today.noNap && <CheckIcon className="h-3 w-3" />}
            </span>
            Didn&apos;t lie down when I got home
          </button>

          {rule.note && (
            <div className="relative mt-4 rounded-[1.5rem] bg-sage/20 px-4 py-3 text-sm text-ink">
              <b>{rule.name}.</b> {rule.note}
            </div>
          )}
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

        <section className="rounded-[2.5rem] border border-line bg-surface p-5 shadow-soft">
          <p className="mb-1 font-bold text-[10px] uppercase tracking-[0.16em] text-sage">Weekly plan</p>
          {[0, 1, 2, 3, 4, 5, 6].map((d) => {
            const dayRule = DAY_RULES[d];
            return (
              <div key={d} className="flex items-center justify-between gap-3 border-t border-line py-3 first:border-t-0">
                <span className="text-sm font-bold text-ink">{dayRule.name}</span>
                <span className="text-right text-sm text-muted">{describeDayRule(dayRule)}</span>
              </div>
            );
          })}
        </section>

        <p className="text-center text-xs text-muted">If you only hit the minimum today, the day still counts.</p>
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

function FeedRow({
  label,
  sub,
  tag,
  done,
  onToggle,
}: {
  label: string;
  sub: string;
  tag: string;
  done: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`flex items-center gap-3 rounded-[1.5rem] border px-3 py-3 text-left transition-colors ${
        done ? "border-transparent bg-good-bg" : "border-line bg-surface"
      }`}
    >
      <IconHolder done={done} />
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-bold text-ink">{label}</span>
        <span className="block text-xs text-muted">{sub}</span>
      </span>
      <span className="rounded-full border border-line px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-muted">
        {tag}
      </span>
    </button>
  );
}

function IconHolder({ done }: { done: boolean }) {
  return (
    <span
      className={`flex h-9 w-9 flex-none items-center justify-center rounded-full ${
        done ? "bg-accent" : "bg-surface-2"
      }`}
    >
      {done && <CheckIcon className="h-4 w-4" />}
    </span>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M4 12l5 5L20 6" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
