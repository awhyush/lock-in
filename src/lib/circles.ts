import { prisma } from "@/lib/prisma";
import {
  DEFAULT_HISTORY_DAYS,
  HABIT_KEYS,
  HABIT_LABELS,
  HISTORY_RANGE_OPTIONS,
  computeStreak,
  computeWeekCompletion,
  dateKey,
  dayComplete,
  habitDone,
  parseStoredPlan,
  type CheckInData,
} from "@/lib/habits";
import { computeGoalStreak, computeGoalWeekCompletion, goalDayComplete, type GoalDayData } from "@/lib/goals";
import type { HabitGridRow } from "@/components/HabitGrid";

const VISIBLE_DAYS = HISTORY_RANGE_OPTIONS[0]; // 14 — circle members only ever see this much

export type CircleMemberView = {
  userId: string;
  name: string;
  streak: number;
  weekPercent: number | null;
  doneToday: boolean;
  rows: HabitGridRow[];
};

export type CircleDetail = {
  id: string;
  name: string;
  inviteCode: string;
  ownerId: string;
  todayKey: string;
  members: CircleMemberView[];
};

function trimToVisible<T>(fullHistory: Record<string, T>, visibleFromKey: string): Record<string, T> {
  const trimmed: Record<string, T> = {};
  for (const [date, data] of Object.entries(fullHistory)) {
    if (date >= visibleFromKey) trimmed[date] = data;
  }
  return trimmed;
}

/** Loads a circle's detail for a given viewer, or null if they're not a member (404, not 403 —
 * don't confirm a circle exists to non-members). Fetches DEFAULT_HISTORY_DAYS per member so
 * streak/weekPercent are accurate, but only returns the last VISIBLE_DAYS of raw history.
 * Preset-plan members are read from CheckIn (the fixed 5 habits); custom-plan members are
 * read from their own Goal/GoalEntry rows — a circle can mix both freely. */
export async function getCircleForMember(circleId: string, viewerId: string): Promise<CircleDetail | null> {
  const membership = await prisma.circleMember.findUnique({
    where: { circleId_userId: { circleId, userId: viewerId } },
  });
  if (!membership) return null;

  const circle = await prisma.circle.findUnique({
    where: { id: circleId },
    include: {
      members: {
        include: { user: { select: { id: true, name: true, intensity: true, customTargets: true } } },
      },
    },
  });
  if (!circle) return null;

  const today = new Date();
  const todayKey = dateKey(today);
  const fromDate = new Date(today);
  fromDate.setDate(fromDate.getDate() - (DEFAULT_HISTORY_DAYS - 1));
  const fromKey = dateKey(fromDate);
  const visibleFromDate = new Date(today);
  visibleFromDate.setDate(visibleFromDate.getDate() - (VISIBLE_DAYS - 1));
  const visibleFromKey = dateKey(visibleFromDate);

  const presetMembers = circle.members.filter((m) => parseStoredPlan(m.user.intensity, m.user.customTargets).mode !== "custom");
  const customMembers = circle.members.filter((m) => parseStoredPlan(m.user.intensity, m.user.customTargets).mode === "custom");

  const [checkIns, goals, goalEntries] = await Promise.all([
    presetMembers.length
      ? prisma.checkIn.findMany({
          where: { userId: { in: presetMembers.map((m) => m.user.id) }, date: { gte: fromKey, lte: todayKey } },
        })
      : Promise.resolve([]),
    customMembers.length
      ? prisma.goal.findMany({
          where: { userId: { in: customMembers.map((m) => m.user.id) } },
          orderBy: { sortOrder: "asc" },
        })
      : Promise.resolve([]),
    customMembers.length
      ? prisma.goalEntry.findMany({
          where: { userId: { in: customMembers.map((m) => m.user.id) }, date: { gte: fromKey, lte: todayKey } },
        })
      : Promise.resolve([]),
  ]);

  const checkInHistoryByUser = new Map<string, Record<string, CheckInData>>();
  for (const m of presetMembers) checkInHistoryByUser.set(m.user.id, {});
  for (const c of checkIns) {
    checkInHistoryByUser.get(c.userId)![c.date] = {
      exercise: c.exercise,
      study: c.study,
      apply: c.apply,
      build: c.build,
      movement: c.movement,
      noNap: c.noNap,
    };
  }

  const goalsByUser = new Map<string, { id: string; label: string }[]>();
  for (const m of customMembers) goalsByUser.set(m.user.id, []);
  for (const g of goals) goalsByUser.get(g.userId)?.push({ id: g.id, label: g.label });

  const goalHistoryByUser = new Map<string, Record<string, GoalDayData>>();
  for (const m of customMembers) goalHistoryByUser.set(m.user.id, {});
  for (const e of goalEntries) {
    const userHistory = goalHistoryByUser.get(e.userId)!;
    (userHistory[e.date] ??= {})[e.goalId] = e.done;
  }

  const members: CircleMemberView[] = circle.members.map((m) => {
    const isCustom = parseStoredPlan(m.user.intensity, m.user.customTargets).mode === "custom";

    if (isCustom) {
      const userGoals = goalsByUser.get(m.user.id) ?? [];
      const goalIds = userGoals.map((g) => g.id);
      const fullHistory = goalHistoryByUser.get(m.user.id) ?? {};
      const streak = computeGoalStreak(fullHistory, goalIds, today);
      const weekPercent = computeGoalWeekCompletion(fullHistory, goalIds, today);
      const doneToday = goalDayComplete(fullHistory[todayKey], goalIds) !== false;
      const visibleHistory = trimToVisible(fullHistory, visibleFromKey);
      const rows: HabitGridRow[] = userGoals.map((g) => ({
        key: g.id,
        label: g.label,
        history: Object.fromEntries(
          Object.entries(visibleHistory).map(([date, data]) => [date, data[g.id] === true]),
        ),
      }));
      return { userId: m.user.id, name: m.user.name, streak, weekPercent, doneToday, rows };
    }

    const fullHistory = checkInHistoryByUser.get(m.user.id) ?? {};
    const streak = computeStreak(fullHistory, today);
    const weekPercent = computeWeekCompletion(fullHistory, today);
    const doneToday = dayComplete(fullHistory[todayKey], today.getDay()) !== false;
    const visibleHistory = trimToVisible(fullHistory, visibleFromKey);
    const rows: HabitGridRow[] = HABIT_KEYS.map((key) => ({
      key,
      label: HABIT_LABELS[key],
      history: Object.fromEntries(
        Object.entries(visibleHistory).map(([date, data]) => [date, habitDone(data, key)]),
      ),
    }));
    return { userId: m.user.id, name: m.user.name, streak, weekPercent, doneToday, rows };
  });

  return { id: circle.id, name: circle.name, inviteCode: circle.inviteCode, ownerId: circle.ownerId, todayKey, members };
}
