import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Tracker } from "@/components/Tracker";
import { GoalTracker } from "@/components/GoalTracker";
import { DEFAULT_HISTORY_DAYS, HABIT_LABELS, dateKey, parseStoredPlan, resolveTargets, type CheckInData } from "@/lib/habits";
import type { GoalDayData, GoalDef } from "@/lib/goals";
import type { NudgeNotice } from "@/components/NudgeBanner";

export const metadata: Metadata = {
  title: "Dashboard",
  robots: { index: false, follow: false },
};

const DEFAULT_GOAL_LABELS = [
  HABIT_LABELS.exercise,
  HABIT_LABELS.study,
  HABIT_LABELS.apply,
  HABIT_LABELS.build,
  HABIT_LABELS.movement,
];

/** Fetches today's not-yet-seen nudges for this user and marks them seen in the same
 * request, so the banner surfaces exactly once — the next dashboard load won't show it again. */
async function getAndMarkSeenNudges(userId: string, todayKey: string): Promise<NudgeNotice[]> {
  const nudges = await prisma.nudge.findMany({
    where: { toUserId: userId, date: todayKey, seenAt: null },
    include: { fromUser: { select: { name: true } }, circle: { select: { name: true } } },
  });
  if (nudges.length === 0) return [];

  await prisma.nudge.updateMany({
    where: { id: { in: nudges.map((n) => n.id) } },
    data: { seenAt: new Date() },
  });

  return nudges.map((n) => ({ id: n.id, fromName: n.fromUser.name, circleName: n.circle.name }));
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) redirect("/login");
  if (!user.onboarded) redirect("/onboarding");

  const today = new Date();
  const todayKey = dateKey(today);
  const todayLabel = today.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });

  const fromDate = new Date(today);
  fromDate.setDate(fromDate.getDate() - (DEFAULT_HISTORY_DAYS - 1));
  const fromKey = dateKey(fromDate);

  const { mode, custom } = parseStoredPlan(user.intensity, user.customTargets);
  const nudges = await getAndMarkSeenNudges(user.id, todayKey);

  if (mode === "custom") {
    let goals = await prisma.goal.findMany({ where: { userId: user.id }, orderBy: { sortOrder: "asc" } });
    if (goals.length === 0) {
      await prisma.goal.createMany({
        data: DEFAULT_GOAL_LABELS.map((label, i) => ({ userId: user.id, label, sortOrder: i })),
      });
      goals = await prisma.goal.findMany({ where: { userId: user.id }, orderBy: { sortOrder: "asc" } });
    }

    const entries = await prisma.goalEntry.findMany({
      where: { userId: user.id, date: { gte: fromKey, lte: todayKey } },
    });
    const history: Record<string, GoalDayData> = {};
    for (const e of entries) {
      (history[e.date] ??= {})[e.goalId] = { done: e.done, count: e.count };
    }

    const goalDefs: GoalDef[] = goals.map((g) => ({
      id: g.id,
      label: g.label,
      type: g.type as GoalDef["type"],
      target: g.target,
    }));

    return (
      <GoalTracker
        name={user.name}
        todayKey={todayKey}
        todayLabel={todayLabel}
        goals={goalDefs}
        initialHistory={history}
        initialLoadedDays={DEFAULT_HISTORY_DAYS}
        nudges={nudges}
      />
    );
  }

  const checkIns = await prisma.checkIn.findMany({
    where: { userId: user.id, date: { gte: fromKey, lte: todayKey } },
  });

  const history: Record<string, CheckInData> = {};
  for (const c of checkIns) {
    history[c.date] = {
      exercise: c.exercise,
      study: c.study,
      apply: c.apply,
      build: c.build,
      movement: c.movement,
      noNap: c.noNap,
    };
  }
  if (!history[todayKey]) {
    history[todayKey] = { exercise: false, study: false, apply: 0, build: false, movement: false, noNap: false };
  }

  const targets = resolveTargets(mode, custom);

  return (
    <Tracker
      name={user.name}
      targets={targets}
      todayKey={todayKey}
      todayLabel={todayLabel}
      initialHistory={history}
      initialLoadedDays={DEFAULT_HISTORY_DAYS}
      nudges={nudges}
    />
  );
}
