"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  DAY_RULES,
  HABIT_KEYS,
  HISTORY_RANGE_OPTIONS,
  SCHEDULE,
  computeStreak,
  dateKey,
  habitDone,
  habitTargetText,
  type CheckInData,
  type HabitKey,
  type HabitTarget,
} from "@/lib/habits";
import { SignOutButton } from "@/components/SignOutButton";
import { ThemeToggle } from "@/components/ThemeToggle";

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
}: {
  name: string;
  targets: Record<HabitKey, HabitTarget>;
  todayKey: string;
  todayLabel: string;
  initialHistory: Record<string, CheckInData>;
  initialLoadedDays: number;
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

  const streak = useMemo(() => computeStreak(history, new Date(`${todayKey}T00:00:00`)), [history, todayKey]);

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
      // offline or a blip — the strip just shows what's already loaded
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
      setStatus(res.ok ? null : "not saved — try again");
    } catch {
      setStatus("offline — not saved");
    }
  }

  function toggle(key: (typeof BOOLEAN_KEYS)[number] | "noNap") {
    persist({ ...today, [key]: !today[key] });
  }

  function stepApply(delta: number) {
    persist({ ...today, apply: Math.max(0, today.apply + delta) });
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

        {rule.note && (
          <div className="mb-3 rounded-lg bg-surface-2 px-3 py-2.5 text-sm">
            <b className="text-accent">{rule.name}.</b> {rule.note}
          </div>
        )}

        <div className="flex flex-col gap-2">
          {BOOLEAN_KEYS.map((key) => {
            const done = habitDone(today, key);
            const required = rule.required.includes(key);
            return (
              <button
                key={key}
                type="button"
                onClick={() => toggle(key)}
                className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors ${
                  done ? "border-transparent bg-good-bg" : "border-line bg-surface"
                }`}
              >
                <Check done={done} />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold">{targets[key].label}</span>
                  <span className="block text-xs text-muted">{habitTargetText(targets[key])}</span>
                </span>
                <span className="rounded-full border border-line px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-muted">
                  {required ? "core" : "bonus"}
                </span>
              </button>
            );
          })}

          <div className="flex items-center gap-3 rounded-lg border border-line bg-surface px-3 py-2.5">
            <Check done={today.apply >= 1} />
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold">{targets.apply.label}</span>
              <span className="block text-xs text-muted">{habitTargetText(targets.apply)}</span>
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label="decrease"
                onClick={() => stepApply(-1)}
                className="h-6 w-6 rounded-md border border-line bg-surface-2 text-sm leading-none"
              >
                –
              </button>
              <span className="min-w-4 text-center font-mono text-sm font-semibold tabular-nums">{today.apply}</span>
              <button
                type="button"
                aria-label="increase"
                onClick={() => stepApply(1)}
                className="h-6 w-6 rounded-md border border-line bg-surface-2 text-sm leading-none"
              >
                +
              </button>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => toggle("noNap")}
          className={`mt-3 flex w-full items-center gap-2.5 border-t border-dashed border-line pt-3 text-left text-sm ${
            today.noNap ? "text-ink" : "text-muted"
          }`}
        >
          <span
            className={`flex h-5 w-5 items-center justify-center rounded-[7px] border-2 ${
              today.noNap ? "border-warn bg-warn" : "border-line bg-surface-2"
            }`}
          >
            {today.noNap && <CheckIcon className="h-3 w-3" />}
          </span>
          Didn&apos;t lie down when I got home
        </button>
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
        <div ref={stripScrollRef} className="overflow-x-auto">
          <div
            className="grid w-max gap-x-1 gap-y-2"
            style={{ gridTemplateColumns: `92px repeat(${rangeDays}, 20px)` }}
          >
            <div className="sticky left-0 z-10 bg-surface" />
            {days.map((d) => (
              <div key={d.key} className="text-center font-mono text-[9px] text-muted">
                {d.label}
              </div>
            ))}
            {HABIT_KEYS.map((key) => (
              <StripRow key={key} name={targets[key].label} days={days} history={history} habitKey={key} todayKey={todayKey} />
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-line bg-surface p-4 shadow-sm">
        <p className="mb-1 px-0.5 font-mono text-[11px] tracking-[0.1em] uppercase text-muted">Weekly plan</p>
        {SCHEDULE.map((s) => (
          <details key={s.name} className="border-t border-line first:border-t-0">
            <summary className="flex cursor-pointer list-none items-center justify-between py-3 text-sm font-semibold">
              {s.name}
              <span className="text-xs text-muted">▸</span>
            </summary>
            <div className="pb-3.5 text-sm leading-relaxed text-muted">
              {s.lines.map((l) => (
                <div key={l}>{l}</div>
              ))}
            </div>
          </details>
        ))}
      </section>

      <p className="text-center text-xs text-muted">If you only hit the minimum today, the day still counts.</p>
      {status && <p className="text-center font-mono text-[11px] text-warn">{status}</p>}
    </main>
  );
}

function Check({ done }: { done: boolean }) {
  return (
    <span
      className={`flex h-6 w-6 flex-none items-center justify-center rounded-[7px] border-2 ${
        done ? "border-good bg-good" : "border-line bg-surface-2"
      }`}
    >
      {done && <CheckIcon className="h-3.5 w-3.5" />}
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

function StripRow({
  name,
  days,
  history,
  habitKey,
  todayKey,
}: {
  name: string;
  days: { key: string; weekday: number }[];
  history: Record<string, CheckInData>;
  habitKey: HabitKey;
  todayKey: string;
}) {
  return (
    <>
      <div className="sticky left-0 z-10 self-center truncate bg-surface pr-2 text-xs text-muted">{name}</div>
      {days.map((d) => {
        const done = habitDone(history[d.key], habitKey);
        const isToday = d.key === todayKey;
        return (
          <div
            key={d.key}
            className={`h-5 w-5 rounded-[4px] ${done ? "bg-good" : "bg-surface-2"} ${
              isToday ? "ring-2 ring-inset ring-accent" : ""
            }`}
          />
        );
      })}
    </>
  );
}
