export type HabitKey = "exercise" | "study" | "apply" | "build" | "movement";

/** A recommended, pre-built plan. */
export type Preset = "light" | "standard" | "ambitious";

/** What the user actually has selected: one of the recommended presets, or their own numbers. */
export type PlanMode = Preset | "custom";

export const PRESETS: Preset[] = ["light", "standard", "ambitious"];
export const PLAN_MODES: PlanMode[] = [...PRESETS, "custom"];

export const PLAN_INFO: Record<PlanMode, { title: string; description: string }> = {
  light: {
    title: "Light",
    description: "Easing back in. Small, unskippable minimums while the habit forms.",
  },
  standard: {
    title: "Standard",
    description: "The actual reset: gym, study, applications and build time, most days.",
  },
  ambitious: {
    title: "Ambitious",
    description: "Full send. Longer blocks across the board for when you're ready to push.",
  },
  custom: {
    title: "Custom",
    description: "Set your own minutes for each habit — how much time are you actually willing to spend on yourself?",
  },
};

export type HabitTarget = { label: string; minutes?: number; aim?: number };

/** Minutes (or, for applications, a target count) per habit — what a custom plan stores. */
export type CustomTargets = {
  exercise: number;
  study: number;
  apply: number;
  build: number;
  movement: number;
};

export const CUSTOM_TARGET_BOUNDS: Record<keyof CustomTargets, { min: number; max: number; step: number }> = {
  exercise: { min: 0, max: 180, step: 5 },
  study: { min: 0, max: 240, step: 5 },
  apply: { min: 0, max: 30, step: 1 },
  build: { min: 0, max: 240, step: 5 },
  movement: { min: 0, max: 120, step: 5 },
};

export const DEFAULT_CUSTOM_TARGETS: CustomTargets = {
  exercise: 30,
  study: 60,
  apply: 5,
  build: 60,
  movement: 25,
};

export const HABIT_LABELS: Record<HabitKey, string> = {
  exercise: "Exercise",
  study: "Study",
  apply: "Job applications",
  build: "Technical work",
  movement: "Movement",
};

export function customTargetsToHabitTargets(custom: CustomTargets): Record<HabitKey, HabitTarget> {
  return {
    exercise: { label: HABIT_LABELS.exercise, minutes: custom.exercise },
    study: { label: HABIT_LABELS.study, minutes: custom.study },
    apply: { label: HABIT_LABELS.apply, aim: custom.apply },
    build: { label: HABIT_LABELS.build, minutes: custom.build },
    movement: { label: HABIT_LABELS.movement, minutes: custom.movement },
  };
}

/** Resolves whatever plan a user has (preset or custom) into the targets the dashboard renders. */
export function resolveTargets(mode: PlanMode, custom: CustomTargets | null): Record<HabitKey, HabitTarget> {
  if (mode === "custom") return customTargetsToHabitTargets(custom ?? DEFAULT_CUSTOM_TARGETS);
  return HABIT_TARGETS[mode];
}

export const HABIT_TARGETS: Record<Preset, Record<HabitKey, HabitTarget>> = {
  light: {
    exercise: { label: "Exercise", minutes: 20 },
    study: { label: "Study", minutes: 30 },
    apply: { label: "Job applications", aim: 3 },
    build: { label: "Technical work", minutes: 30 },
    movement: { label: "Movement", minutes: 15 },
  },
  standard: {
    exercise: { label: "Exercise", minutes: 30 },
    study: { label: "Study", minutes: 60 },
    apply: { label: "Job applications", aim: 5 },
    build: { label: "Technical work", minutes: 60 },
    movement: { label: "Movement", minutes: 25 },
  },
  ambitious: {
    exercise: { label: "Exercise", minutes: 45 },
    study: { label: "Study", minutes: 90 },
    apply: { label: "Job applications", aim: 8 },
    build: { label: "Technical work", minutes: 90 },
    movement: { label: "Movement", minutes: 30 },
  },
};

export function habitTargetText(t: HabitTarget): string {
  if (t.aim != null) return `aim for ${t.aim}`;
  if (t.minutes != null) return `${t.minutes} min minimum`;
  return "";
}

export function clampCustomTargets(input: Partial<Record<keyof CustomTargets, unknown>>): CustomTargets | null {
  const result = {} as CustomTargets;
  for (const key of Object.keys(CUSTOM_TARGET_BOUNDS) as (keyof CustomTargets)[]) {
    const bounds = CUSTOM_TARGET_BOUNDS[key];
    const raw = input[key];
    if (typeof raw !== "number" || !Number.isFinite(raw)) return null;
    result[key] = Math.min(bounds.max, Math.max(bounds.min, Math.round(raw)));
  }
  return result;
}

/** Parses the raw `intensity` / `customTargets` DB columns into a valid PlanMode + CustomTargets. */
export function parseStoredPlan(
  rawMode: string,
  rawCustomTargets: string | null,
): { mode: PlanMode; custom: CustomTargets | null } {
  const mode: PlanMode = PLAN_MODES.includes(rawMode as PlanMode) ? (rawMode as PlanMode) : "standard";
  if (!rawCustomTargets) return { mode, custom: null };
  try {
    const parsed = JSON.parse(rawCustomTargets);
    return { mode, custom: clampCustomTargets(parsed) };
  } catch {
    return { mode, custom: null };
  }
}

export const HABIT_KEYS: HabitKey[] = ["exercise", "study", "apply", "build", "movement"];

export type DayRule = { name: string; required: HabitKey[]; note: string | null };

// weekday index: 0 = Sunday .. 6 = Saturday
export const DAY_RULES: Record<number, DayRule> = {
  0: { name: "Sunday", required: [], note: "Recovery + weekly planning. Light study only, no pressure." },
  1: { name: "Monday", required: ["exercise", "study", "apply", "build"], note: null },
  2: {
    name: "Tuesday",
    required: ["exercise", "movement"],
    note: "Sport night covers today’s movement — no serious studying tonight.",
  },
  3: { name: "Wednesday", required: ["exercise", "study", "apply", "build"], note: null },
  4: { name: "Thursday", required: ["exercise", "study", "apply", "build"], note: null },
  5: {
    name: "Friday",
    required: ["exercise", "apply"],
    note: "Lighter study day — keep the applications moving.",
  },
  6: {
    name: "Saturday",
    required: ["exercise"],
    note: "Longer session day: extra study/technical work, plus proper leisure.",
  },
};

export const SCHEDULE = [
  {
    name: "Monday / Wednesday / Thursday",
    lines: ["Gym in the morning", "Study block", "Applications squeezed in around work", "Consistent bedtime"],
  },
  {
    name: "Tuesday",
    lines: ["Normal workday", "Sport in the evening", "Dinner, shower, no serious study", "Sleep"],
  },
  { name: "Friday", lines: ["Lighter study block", "Applications still happen", "PC / social time in the evening"] },
  { name: "Saturday", lines: ["Longer study / technical work session", "Job applications", "Gym or sport, proper leisure time"] },
  { name: "Sunday", lines: ["Recovery", "Weekly review + planning", "Some light studying", "Prep for Monday"] },
];

export type CheckInData = {
  exercise: boolean;
  study: boolean;
  apply: number;
  build: boolean;
  movement: boolean;
  noNap: boolean;
};

/** How many days of history the dashboard fetches up front — covers streak accuracy for
 * realistically everyone without a client round-trip. The visible strip can start narrower
 * (see HISTORY_RANGE_OPTIONS) and only fetches more if the user asks for a wider window. */
export const DEFAULT_HISTORY_DAYS = 60;
export const STREAK_LOOKBACK_DAYS = 400;
export const MAX_HISTORY_DAYS = 400;
export const HISTORY_RANGE_OPTIONS = [14, 30, 90] as const;

export const EMPTY_CHECKIN: CheckInData = {
  exercise: false,
  study: false,
  apply: 0,
  build: false,
  movement: false,
  noNap: false,
};

export function pad(n: number): string {
  return String(n).padStart(2, "0");
}

export function dateKey(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function habitDone(data: CheckInData | undefined, key: HabitKey): boolean {
  if (!data) return false;
  return key === "apply" ? data.apply >= 1 : Boolean(data[key]);
}

/** true = every required habit met, false = a required habit is missing,
 * null = nothing was required that day (doesn't break or extend a streak) */
export function dayComplete(data: CheckInData | undefined, weekday: number): boolean | null {
  const required = (DAY_RULES[weekday] ?? DAY_RULES[1]).required;
  if (!data) return required.length === 0 ? null : false;
  return required.every((k) => habitDone(data, k));
}

export function computeStreak(historyByDate: Record<string, CheckInData>, today: Date): number {
  let streak = 0;
  for (let i = 0; i < STREAK_LOOKBACK_DAYS; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const complete = dayComplete(historyByDate[dateKey(d)], d.getDay());
    // today not finished yet doesn't break the streak, it just doesn't add to it
    if (i === 0 && complete !== true) continue;
    if (complete === false) break;
    if (complete === true) streak++;
  }
  return streak;
}

/** Percent of the last 7 days that were fully complete, counting only days that actually
 * required something (a light Sunday doesn't help or hurt the score). Null if nothing in
 * the window was eligible. */
export function computeWeekCompletion(historyByDate: Record<string, CheckInData>, today: Date): number | null {
  let eligible = 0;
  let completed = 0;
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const complete = dayComplete(historyByDate[dateKey(d)], d.getDay());
    if (complete === null) continue;
    eligible++;
    if (complete) completed++;
  }
  if (eligible === 0) return null;
  return Math.round((completed / eligible) * 100);
}
