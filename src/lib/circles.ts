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
  type HabitKey,
} from "@/lib/habits";
import {
  computeGoalStreak,
  computeGoalWeekCompletion,
  goalDayComplete,
  goalEntryDone,
  type GoalDayData,
  type GoalDef,
} from "@/lib/goals";
import { isNudgeWindowOpen } from "@/lib/nudges";
import type { HabitGridRow } from "@/components/HabitGrid";

const VISIBLE_DAYS = HISTORY_RANGE_OPTIONS[0]; // 14 — circle members only ever see this much

export type CircleKeyOption = { key: string; label: string };

export type CircleMemberView = {
  userId: string;
  name: string;
  streak: number;
  weekPercent: number | null;
  doneToday: boolean;
  rows: HabitGridRow[];
  /** Can the viewer nudge this member right now: not themselves, not done today, the
   * nudge window is open (< NUDGE_WINDOW_HOURS left today), and the viewer hasn't already
   * nudged them today. */
  canNudge: boolean;
};

export type CircleDetail = {
  id: string;
  name: string;
  inviteCode: string;
  ownerId: string;
  todayKey: string;
  members: CircleMemberView[];
  /** The viewer's own full, unfiltered set of habit/goal keys — for the "what you share
   * here" visibility editor. Not filtered, since you always get to see the full list of
   * things you could choose to show. */
  viewerAllKeys: CircleKeyOption[];
  /** The viewer's current visibility choice for this circle. Null means "show everything". */
  viewerVisibleKeys: string[] | null;
};

/** Parses the CircleMember.visibleKeys JSON column. Null/invalid/non-array-of-strings all
 * mean "show everything" — the safe default so a corrupt value never hides more than it should. */
export function parseVisibleKeys(raw: string | null): string[] | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.every((k) => typeof k === "string")) return parsed;
    return null;
  } catch {
    return null;
  }
}

function filterByVisibility<T extends { key: string }>(items: T[], visibleKeys: string[] | null): T[] {
  if (visibleKeys === null) return items;
  const set = new Set(visibleKeys);
  return items.filter((item) => set.has(item.key));
}

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
 * read from their own Goal/GoalEntry rows — a circle can mix both freely.
 *
 * Each member can restrict which of their own habits/goals show up in THIS circle
 * (CircleMember.visibleKeys) — streak/weekPercent/doneToday/rows are all computed from that
 * restricted subset, not their true full plan, so hidden habits can't leak through the
 * aggregate numbers either. */
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

  const [checkIns, goals, goalEntries, nudgesSentByViewerToday] = await Promise.all([
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
    prisma.nudge.findMany({ where: { circleId, fromUserId: viewerId, date: todayKey }, select: { toUserId: true } }),
  ]);

  const nudgeWindowOpen = isNudgeWindowOpen(today);
  const alreadyNudgedToday = new Set(nudgesSentByViewerToday.map((n) => n.toUserId));

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

  const goalsByUser = new Map<string, GoalDef[]>();
  for (const m of customMembers) goalsByUser.set(m.user.id, []);
  for (const g of goals) {
    goalsByUser.get(g.userId)?.push({ id: g.id, label: g.label, type: g.type as GoalDef["type"], target: g.target });
  }

  const goalHistoryByUser = new Map<string, Record<string, GoalDayData>>();
  for (const m of customMembers) goalHistoryByUser.set(m.user.id, {});
  for (const e of goalEntries) {
    const userHistory = goalHistoryByUser.get(e.userId)!;
    (userHistory[e.date] ??= {})[e.goalId] = { done: e.done, count: e.count };
  }

  let viewerAllKeys: CircleKeyOption[] = [];
  let viewerVisibleKeys: string[] | null = null;

  function canNudge(memberUserId: string, doneToday: boolean): boolean {
    return memberUserId !== viewerId && !doneToday && nudgeWindowOpen && !alreadyNudgedToday.has(memberUserId);
  }

  const members: CircleMemberView[] = circle.members.map((m) => {
    const isCustom = parseStoredPlan(m.user.intensity, m.user.customTargets).mode === "custom";
    const visibleKeys = parseVisibleKeys(m.visibleKeys);

    if (isCustom) {
      const allGoals = goalsByUser.get(m.user.id) ?? [];
      const visibleGoals = filterByVisibility(
        allGoals.map((g) => ({ ...g, key: g.id })),
        visibleKeys,
      );
      const fullHistory = goalHistoryByUser.get(m.user.id) ?? {};
      const streak = computeGoalStreak(fullHistory, visibleGoals, today);
      const weekPercent = computeGoalWeekCompletion(fullHistory, visibleGoals, today);
      const doneToday = goalDayComplete(fullHistory[todayKey], visibleGoals) !== false;
      const visibleHistory = trimToVisible(fullHistory, visibleFromKey);
      const rows: HabitGridRow[] = visibleGoals.map((g) => ({
        key: g.id,
        label: g.label,
        history: Object.fromEntries(
          Object.entries(visibleHistory).map(([date, data]) => [date, goalEntryDone(g, data[g.id])]),
        ),
      }));
      if (m.user.id === viewerId) {
        viewerAllKeys = allGoals.map((g) => ({ key: g.id, label: g.label }));
        viewerVisibleKeys = visibleKeys;
      }
      return { userId: m.user.id, name: m.user.name, streak, weekPercent, doneToday, rows, canNudge: canNudge(m.user.id, doneToday) };
    }

    const visibleHabitKeys = filterByVisibility(
      HABIT_KEYS.map((key) => ({ key })),
      visibleKeys,
    ).map((h) => h.key as HabitKey);
    const fullHistory = checkInHistoryByUser.get(m.user.id) ?? {};
    const streak = computeStreak(fullHistory, today, visibleHabitKeys);
    const weekPercent = computeWeekCompletion(fullHistory, today, visibleHabitKeys);
    const doneToday = dayComplete(fullHistory[todayKey], today.getDay(), visibleHabitKeys) !== false;
    const visibleHistory = trimToVisible(fullHistory, visibleFromKey);
    const rows: HabitGridRow[] = visibleHabitKeys.map((key) => ({
      key,
      label: HABIT_LABELS[key],
      history: Object.fromEntries(
        Object.entries(visibleHistory).map(([date, data]) => [date, habitDone(data, key)]),
      ),
    }));
    if (m.user.id === viewerId) {
      viewerAllKeys = HABIT_KEYS.map((key) => ({ key, label: HABIT_LABELS[key] }));
      viewerVisibleKeys = visibleKeys;
    }
    return { userId: m.user.id, name: m.user.name, streak, weekPercent, doneToday, rows, canNudge: canNudge(m.user.id, doneToday) };
  });

  return {
    id: circle.id,
    name: circle.name,
    inviteCode: circle.inviteCode,
    ownerId: circle.ownerId,
    todayKey,
    members,
    viewerAllKeys,
    viewerVisibleKeys,
  };
}
