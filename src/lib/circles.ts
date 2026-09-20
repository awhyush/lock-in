import { prisma } from "@/lib/prisma";
import {
  DEFAULT_HISTORY_DAYS,
  HISTORY_RANGE_OPTIONS,
  computeStreak,
  computeWeekCompletion,
  dateKey,
  dayComplete,
  parseSportDays,
  type CheckInData,
} from "@/lib/habits";

const VISIBLE_DAYS = HISTORY_RANGE_OPTIONS[0]; // 14 — circle members only ever see this much

export type CircleMemberView = {
  userId: string;
  name: string;
  streak: number;
  weekPercent: number | null;
  doneToday: boolean;
  history: Record<string, CheckInData>;
};

export type CircleDetail = {
  id: string;
  name: string;
  inviteCode: string;
  ownerId: string;
  todayKey: string;
  members: CircleMemberView[];
};

/** Loads a circle's detail for a given viewer, or null if they're not a member (404, not 403 —
 * don't confirm a circle exists to non-members). Fetches DEFAULT_HISTORY_DAYS per member so
 * streak/weekPercent are accurate, but only returns the last VISIBLE_DAYS of raw history. */
export async function getCircleForMember(circleId: string, viewerId: string): Promise<CircleDetail | null> {
  const membership = await prisma.circleMember.findUnique({
    where: { circleId_userId: { circleId, userId: viewerId } },
  });
  if (!membership) return null;

  const circle = await prisma.circle.findUnique({
    where: { id: circleId },
    include: { members: { include: { user: { select: { id: true, name: true, sportDays: true } } } } },
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

  const memberIds = circle.members.map((m) => m.user.id);
  const checkIns = await prisma.checkIn.findMany({
    where: { userId: { in: memberIds }, date: { gte: fromKey, lte: todayKey } },
  });

  const historyByUser = new Map<string, Record<string, CheckInData>>();
  for (const memberId of memberIds) historyByUser.set(memberId, {});
  for (const c of checkIns) {
    historyByUser.get(c.userId)![c.date] = {
      exercise: c.exercise,
      study: c.study,
      apply: c.apply,
      build: c.build,
      movement: c.movement,
      noNap: c.noNap,
    };
  }

  const members: CircleMemberView[] = circle.members.map((m) => {
    const sportDays = parseSportDays(m.user.sportDays);
    const fullHistory = historyByUser.get(m.user.id) ?? {};
    const streak = computeStreak(fullHistory, today, sportDays);
    const weekPercent = computeWeekCompletion(fullHistory, today, sportDays);
    const doneToday = dayComplete(fullHistory[todayKey], today.getDay(), sportDays) !== false;
    const history: Record<string, CheckInData> = {};
    for (const [date, data] of Object.entries(fullHistory)) {
      if (date >= visibleFromKey) history[date] = data;
    }
    return { userId: m.user.id, name: m.user.name, streak, weekPercent, doneToday, history };
  });

  return { id: circle.id, name: circle.name, inviteCode: circle.inviteCode, ownerId: circle.ownerId, todayKey, members };
}
