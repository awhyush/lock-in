export type HabitKey = "exercise" | "study" | "apply" | "build" | "movement";

export type Intensity = "light" | "standard" | "ambitious";

export const INTENSITIES: Intensity[] = ["light", "standard", "ambitious"];

export const INTENSITY_INFO: Record<
  Intensity,
  { title: string; description: string }
> = {
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
};

export type HabitTarget = { label: string; minutes?: number; aim?: number };

export const HABIT_TARGETS: Record<Intensity, Record<HabitKey, HabitTarget>> = {
  light: {
    exercise: { label: "Exercise", minutes: 20 },
    study: { label: "Study / DSA", minutes: 30 },
    apply: { label: "Job applications", aim: 3 },
    build: { label: "Technical work", minutes: 30 },
    movement: { label: "Movement", minutes: 15 },
  },
  standard: {
    exercise: { label: "Exercise", minutes: 30 },
    study: { label: "Study / DSA", minutes: 60 },
    apply: { label: "Job applications", aim: 5 },
    build: { label: "Technical work", minutes: 60 },
    movement: { label: "Movement", minutes: 25 },
  },
  ambitious: {
    exercise: { label: "Exercise", minutes: 45 },
    study: { label: "Study / DSA", minutes: 90 },
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

export const HABIT_KEYS: HabitKey[] = ["exercise", "study", "apply", "build", "movement"];

export type DayRule = { name: string; required: HabitKey[]; note: string | null };

// weekday index: 0 = Sunday .. 6 = Saturday
export const DAY_RULES: Record<number, DayRule> = {
  0: { name: "Sunday", required: [], note: "Recovery + weekly planning. Light study only, no pressure." },
  1: { name: "Monday", required: ["exercise", "study", "apply", "build"], note: null },
  2: {
    name: "Tuesday",
    required: ["exercise", "movement"],
    note: "Football covers today’s movement — no serious studying tonight.",
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
    lines: ["Gym in the morning", "Study / DSA block", "Applications squeezed in around work", "Consistent bedtime"],
  },
  {
    name: "Tuesday",
    lines: ["Normal workday", "Football in the evening", "Dinner, shower, no serious study", "Sleep"],
  },
  { name: "Friday", lines: ["Lighter study block", "Applications still happen", "PC / social time in the evening"] },
  { name: "Saturday", lines: ["Longer study / technical work session", "Job applications", "Gym or football, proper leisure time"] },
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
  for (let i = 0; i < 60; i++) {
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
