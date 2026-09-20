import { dateKey } from "@/lib/habits";

export const MAX_GOALS = 12;
export const MAX_GOAL_LABEL_LENGTH = 60;

/** A user's own custom goals are checkboxes, required every day — no weekday variation,
 * unlike the fixed-habit DAY_RULES system in lib/habits.ts. */
export type GoalDayData = Record<string, boolean>; // goalId -> done

export function goalDayComplete(data: GoalDayData | undefined, goalIds: string[]): boolean | null {
  if (goalIds.length === 0) return null;
  if (!data) return false;
  return goalIds.every((id) => data[id] === true);
}

export function computeGoalStreak(
  historyByDate: Record<string, GoalDayData>,
  goalIds: string[],
  today: Date,
): number {
  let streak = 0;
  for (let i = 0; i < 400; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const complete = goalDayComplete(historyByDate[dateKey(d)], goalIds);
    if (i === 0 && complete !== true) continue;
    if (complete === false) break;
    if (complete === true) streak++;
  }
  return streak;
}

export function computeGoalWeekCompletion(
  historyByDate: Record<string, GoalDayData>,
  goalIds: string[],
  today: Date,
): number | null {
  if (goalIds.length === 0) return null;
  let completed = 0;
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    if (goalDayComplete(historyByDate[dateKey(d)], goalIds)) completed++;
  }
  return Math.round((completed / 7) * 100);
}
