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
  effectiveRequiredKeys,
  habitDone,
  habitTargetText,
  type CheckInData,
  type HabitKey,
  type HabitTarget,
  type RestDays,
} from "@/lib/habits";
import { AvatarMenu } from "@/components/AvatarMenu";
import { AppNav } from "@/components/AppNav";
import { HabitGrid, type HabitGridRow } from "@/components/HabitGrid";
import { NudgeBanner, type NudgeNotice } from "@/components/NudgeBanner";
import { ProgressBar } from "@/components/ProgressBar";
import { updateAppBadge } from "@/lib/badge";

const BOOLEAN_KEYS: Extract<HabitKey, "exercise" | "study" | "build" | "movement">[] = [
  "exercise",
  "study",
  "build",
  "movement",
];

const HABIT_TILE: Record<HabitKey, "sage" | "peach" | "butter" | "sky"> = {
  exercise: "sage",
  study: "sky",
  apply: "peach",
  build: "butter",
  movement: "sky",
};

const TILE_CLASSES: Record<"sage" | "peach" | "butter" | "sky", { bg: string; ink: string; clay: string }> = {
  sage: { bg: "bg-sage", ink: "text-sage-ink", clay: "shadow-clay-sage" },
  peach: { bg: "bg-peach", ink: "text-peach-ink", clay: "shadow-clay-peach" },
  butter: { bg: "bg-butter", ink: "text-butter-ink", clay: "shadow-clay-butter" },
  sky: { bg: "bg-sky", ink: "text-sky-ink", clay: "shadow-clay-sky" },
};

export function Tracker({
  name,
  targets,
  todayKey,
  todayLabel,
  initialHistory,
  initialLoadedDays,
  nudges,
  restDays,
}: {
  name: string;
  targets: Record<HabitKey, HabitTarget>;
  todayKey: string;
  todayLabel: string;
  initialHistory: Record<string, CheckInData>;
  initialLoadedDays: number;
  nudges: NudgeNotice[];
  restDays: RestDays | null;
}) {
  const [history, setHistory] = useState<Record<string, CheckInData>>(initialHistory);
  const [status, setStatus] = useState<string | null>(null);
  const [rangeDays, setRangeDays] = useState<number>(HISTORY_RANGE_OPTIONS[0]);
  const [loadedDays, setLoadedDays] = useState(initialLoadedDays);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [weeklyPlanOpen, setWeeklyPlanOpen] = useState(false);
  const stripScrollRef = useRef<HTMLDivElement>(null);
  const firstName = name.split(" ")[0];

  const weekday = useMemo(() => new Date(`${todayKey}T00:00:00`).getDay(), [todayKey]);
  const rule = DAY_RULES[weekday];
  const requiredToday = useMemo(() => effectiveRequiredKeys(weekday, restDays), [weekday, restDays]);
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
    () => computeStreak(history, new Date(`${todayKey}T00:00:00`), undefined, restDays),
    [history, todayKey, restDays],
  );

  const weekPercent = useMemo(
    () => computeWeekCompletion(history, new Date(`${todayKey}T00:00:00`), undefined, restDays),
    [history, todayKey, restDays],
  );

  const doneTodayCount = requiredToday.filter((key) => habitDone(today, key)).length;
  const requiredTodayCount = requiredToday.length;
  const progressPercent = requiredTodayCount > 0 ? Math.round((doneTodayCount / requiredTodayCount) * 100) : 100;

  useEffect(() => {
    updateAppBadge(requiredTodayCount - doneTodayCount);
  }, [requiredTodayCount, doneTodayCount]);

  const minutesToday = BOOLEAN_KEYS.filter((key) => habitDone(today, key)).reduce(
    (sum, key) => sum + (targets[key].minutes ?? 0),
    0,
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
            {doneTodayCount} of {requiredTodayCount} habits
          </p>
          <div className="mt-4">
            <ProgressBar percent={progressPercent} />
          </div>
          <p className="mt-3 max-w-[70%] text-sm text-sage-ink/90">
            {streak > 0 ? `You're on a ${streak}-day streak, keep it up.` : "Check off today's habits to start a streak."}
          </p>
          <div className="absolute bottom-5 right-5 flex items-center gap-1.5 rounded-pill bg-surface px-3 py-1.5 shadow-clay">
            <FlameIcon className="h-4 w-4 text-peach-ink" />
            <span className="font-black text-sm tabular-nums text-ink">{streak}</span>
          </div>
        </section>

        <div className="grid grid-cols-2 gap-3">
          <StatTile tone="sky" icon={<ChartIcon className="h-5 w-5" />} value={weekPercent != null ? `${weekPercent}%` : "-"} label="This week" />
          <StatTile tone="butter" icon={<ClockIcon className="h-5 w-5" />} value={`${minutesToday} min`} label="Logged today" />
        </div>

        <section className="flex flex-col gap-3">
          <p className="px-1 font-bold text-[10px] uppercase tracking-[0.16em] text-muted">Today&apos;s habits</p>

          {BOOLEAN_KEYS.map((key) => {
            const done = habitDone(today, key);
            const required = requiredToday.includes(key);
            return (
              <FeedRow
                key={key}
                tone={HABIT_TILE[key]}
                icon={<HabitIcon habit={key} className="h-5 w-5" />}
                label={targets[key].label}
                sub={habitTargetText(targets[key])}
                tag={required ? "core" : "bonus"}
                done={done}
                onToggle={() => toggle(key)}
              />
            );
          })}

          <div className="flex items-center gap-3 rounded-card bg-surface p-3 shadow-clay">
            <IconTile tone={HABIT_TILE.apply}>
              <HabitIcon habit="apply" className="h-5 w-5" />
            </IconTile>
            <span className="min-w-0 flex-1">
              <span className="block text-[15px] font-bold text-ink">{targets.apply.label}</span>
              <span className="block text-xs text-muted">{habitTargetText(targets.apply)}</span>
            </span>
            <span className="rounded-pill bg-surface-2 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-muted shadow-clay-inset">
              {requiredToday.includes("apply") ? "core" : "bonus"}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label="decrease"
                onClick={() => stepApply(-1)}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-surface-2 text-sm leading-none text-ink shadow-clay-inset"
              >
                -
              </button>
              <span className="min-w-4 text-center text-sm font-bold tabular-nums text-ink">{today.apply}</span>
              <button
                type="button"
                aria-label="increase"
                onClick={() => stepApply(1)}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-surface-2 text-sm leading-none text-ink shadow-clay-inset"
              >
                +
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={() => toggle("noNap")}
            className={`flex w-full items-center gap-2.5 rounded-card bg-surface p-3 text-left text-sm shadow-clay ${
              today.noNap ? "text-ink" : "text-muted"
            }`}
          >
            <span
              className={`flex h-7 w-7 flex-none items-center justify-center rounded-full ${
                today.noNap ? "bg-warn shadow-clay-peach" : "bg-surface-2 shadow-clay-inset"
              }`}
            >
              {today.noNap && <CheckIcon className="h-3.5 w-3.5 text-peach-ink" />}
            </span>
            Didn&apos;t lie down when I got home
          </button>

          {rule.note && (
            <div className="rounded-card bg-butter p-4 text-sm text-butter-ink shadow-clay-butter">
              <b>{rule.name}.</b> {rule.note}
            </div>
          )}
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

        <section className="rounded-card bg-surface p-5 shadow-clay">
          <button
            type="button"
            onClick={() => setWeeklyPlanOpen((open) => !open)}
            aria-expanded={weeklyPlanOpen}
            className="flex w-full items-center justify-between gap-3"
          >
            <span className="font-bold text-[10px] uppercase tracking-[0.16em] text-muted">Weekly plan</span>
            <ChevronIcon className={`h-4 w-4 text-muted transition-transform ${weeklyPlanOpen ? "rotate-180" : ""}`} />
          </button>
          {weeklyPlanOpen &&
            [0, 1, 2, 3, 4, 5, 6].map((d) => {
              const dayRule = DAY_RULES[d];
              return (
                <div key={d} className="flex items-center justify-between gap-3 border-t border-line py-3 first:mt-3 first:border-t-0">
                  <span className="text-sm font-bold text-ink">{dayRule.name}</span>
                  <span className="text-right text-sm text-muted">
                    {describeDayRule(dayRule, effectiveRequiredKeys(d, restDays))}
                  </span>
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

function StatTile({ tone, icon, value, label }: { tone: "sage" | "peach" | "butter" | "sky"; icon: React.ReactNode; value: string; label: string }) {
  return (
    <div className="rounded-card bg-surface p-4 shadow-clay">
      <IconTile tone={tone}>{icon}</IconTile>
      <p className="mt-3 font-black text-2xl tabular-nums text-ink">{value}</p>
      <p className="text-xs font-medium text-muted">{label}</p>
    </div>
  );
}

function IconTile({ tone, children }: { tone: "sage" | "peach" | "butter" | "sky"; children: React.ReactNode }) {
  const t = TILE_CLASSES[tone];
  return (
    <span className={`flex h-11 w-11 flex-none items-center justify-center rounded-tile ${t.bg} ${t.ink} ${t.clay}`}>
      {children}
    </span>
  );
}

function FeedRow({
  tone,
  icon,
  label,
  sub,
  tag,
  done,
  onToggle,
}: {
  tone: "sage" | "peach" | "butter" | "sky";
  icon: React.ReactNode;
  label: string;
  sub: string;
  tag: string;
  done: boolean;
  onToggle: () => void;
}) {
  return (
    <button type="button" onClick={onToggle} className="flex items-center gap-3 rounded-card bg-surface p-3 text-left shadow-clay">
      <IconTile tone={tone}>{icon}</IconTile>
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-bold text-ink">{label}</span>
        <span className="block text-xs text-muted">{sub}</span>
      </span>
      <span className="rounded-pill bg-surface-2 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-muted shadow-clay-inset">
        {tag}
      </span>
      <ToggleCircle done={done} />
    </button>
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

function HabitIcon({ habit, className }: { habit: HabitKey; className?: string }) {
  switch (habit) {
    case "exercise":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className}>
          <path
            d="M6.5 9v6M4 10.5v3M17.5 9v6M20 10.5v3M6.5 12h11"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "study":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className}>
          <path
            d="M4 5.5c2-1 5-1 8 .5 3-1.5 6-1.5 8-.5v13c-2-1-5-1-8 .5-3-1.5-6-1.5-8-.5Z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <path d="M12 6v13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
    case "apply":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className}>
          <rect x="3.5" y="8" width="17" height="11" rx="2" stroke="currentColor" strokeWidth="1.8" />
          <path d="M8.5 8V6a1.5 1.5 0 0 1 1.5-1.5h4A1.5 1.5 0 0 1 15.5 6v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
    case "build":
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
    case "movement":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className}>
          <circle cx="9" cy="6" r="1.7" stroke="currentColor" strokeWidth="1.6" />
          <path
            d="M9.5 9 7 13l-2 2.5M9.5 9l2.5 2.5-1 5M12 11.5l3.5-1 2 3"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
  }
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

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 8v4.5l3 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
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

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
