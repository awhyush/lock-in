import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Tracker } from "@/components/Tracker";
import {
  DEFAULT_HISTORY_DAYS,
  dateKey,
  parseSportDays,
  parseStoredPlan,
  resolveTargets,
  type CheckInData,
} from "@/lib/habits";

export const metadata: Metadata = {
  title: "Dashboard",
  robots: { index: false, follow: false },
};

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) redirect("/login");
  if (!user.onboarded) redirect("/onboarding");

  const today = new Date();
  const todayKey = dateKey(today);

  const fromDate = new Date(today);
  fromDate.setDate(fromDate.getDate() - (DEFAULT_HISTORY_DAYS - 1));
  const fromKey = dateKey(fromDate);

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

  const { mode, custom } = parseStoredPlan(user.intensity, user.customTargets);
  const targets = resolveTargets(mode, custom);
  const sportDays = parseSportDays(user.sportDays);

  const todayLabel = today.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });

  return (
    <Tracker
      name={user.name}
      targets={targets}
      todayKey={todayKey}
      todayLabel={todayLabel}
      initialHistory={history}
      initialLoadedDays={DEFAULT_HISTORY_DAYS}
      sportDays={sportDays}
    />
  );
}
