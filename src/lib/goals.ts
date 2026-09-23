import { dateKey } from "@/lib/habits";

export const MAX_GOALS = 12;
export const MAX_GOAL_LABEL_LENGTH = 60;

/** checkbox = plain done/not-done, no target.
 * duration = target is minutes; still tracked as a done/not-done toggle, target is just
 *   shown as a reminder ("30 min minimum") — mirrors the fixed preset habits.
 * counter = target is an "aim for N" count; tracked as an actual running count, and counts
 *   as done the moment the count is at least 1 — mirrors the "Work" (apply) habit. */
export type GoalType = "checkbox" | "duration" | "counter";
export const GOAL_TYPES: GoalType[] = ["checkbox", "duration", "counter"];

export const GOAL_DURATION_BOUNDS = { min: 5, max: 240, step: 5 };
export const GOAL_COUNTER_BOUNDS = { min: 1, max: 30, step: 1 };

export type GoalDef = { id: string; label: string; type: GoalType; target: number | null };

export type GoalEntryData = { done: boolean; count: number };
/** A user's own custom goals are required every day — no weekday variation, unlike the
 * fixed-habit DAY_RULES system in lib/habits.ts. */
export type GoalDayData = Record<string, GoalEntryData>; // goalId -> entry

export function goalTargetText(goal: Pick<GoalDef, "type" | "target">): string {
  if (goal.target == null) return "";
  if (goal.type === "counter") return `aim for ${goal.target}`;
  if (goal.type === "duration") return `${goal.target} min minimum`;
  return "";
}

export function goalEntryDone(goal: Pick<GoalDef, "type">, entry: GoalEntryData | undefined): boolean {
  if (!entry) return false;
  return goal.type === "counter" ? entry.count >= 1 : entry.done;
}

export function goalDayComplete(data: GoalDayData | undefined, goals: GoalDef[]): boolean | null {
  if (goals.length === 0) return null;
  if (!data) return false;
  return goals.every((g) => goalEntryDone(g, data[g.id]));
}

export function computeGoalStreak(
  historyByDate: Record<string, GoalDayData>,
  goals: GoalDef[],
  today: Date,
): number {
  let streak = 0;
  for (let i = 0; i < 400; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const complete = goalDayComplete(historyByDate[dateKey(d)], goals);
    if (i === 0 && complete !== true) continue;
    if (complete === false) break;
    if (complete === true) streak++;
  }
  return streak;
}

export function computeGoalWeekCompletion(
  historyByDate: Record<string, GoalDayData>,
  goals: GoalDef[],
  today: Date,
): number | null {
  if (goals.length === 0) return null;
  let completed = 0;
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    if (goalDayComplete(historyByDate[dateKey(d)], goals)) completed++;
  }
  return Math.round((completed / 7) * 100);
}
