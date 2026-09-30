import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendStreakReminder } from "@/lib/push";
import { dateKey, dayComplete, parseRestDays, parseStoredPlan, type CheckInData } from "@/lib/habits";
import { goalDayComplete, type GoalDayData, type GoalDef } from "@/lib/goals";

/** Vercel Cron-only route — not reachable by a signed-in user, so it authenticates via a
 * shared secret instead of the NextAuth session every other route uses. Vercel automatically
 * sends `Authorization: Bearer $CRON_SECRET` when it invokes a scheduled route, provided an
 * env var of that exact name is configured on the project; if CRON_SECRET isn't set at all,
 * this always 401s rather than becoming an open "notify everyone" endpoint. */
function isAuthorizedCronRequest(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return req.headers.get("authorization") === `Bearer ${secret}`;
}

export async function GET(req: Request) {
  if (!isAuthorizedCronRequest(req)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const today = new Date();
  const todayKey = dateKey(today);
  const weekday = today.getDay();

  const users = await prisma.user.findMany({
    where: { pushSubscriptions: { some: {} } },
    include: {
      pushSubscriptions: true,
      checkIns: { where: { date: todayKey } },
      goals: { orderBy: { sortOrder: "asc" } },
    },
  });

  // GoalEntry has no Prisma relation back to User (same reason lib/circles.ts fetches it
  // separately) — scope to the subscribed custom-plan users and index by userId.
  const customUserIds = users
    .filter((u) => parseStoredPlan(u.intensity, u.customTargets).mode === "custom")
    .map((u) => u.id);
  const goalEntries = customUserIds.length
    ? await prisma.goalEntry.findMany({ where: { userId: { in: customUserIds }, date: todayKey } })
    : [];
  const goalEntriesByUser = new Map<string, GoalDayData>();
  for (const id of customUserIds) goalEntriesByUser.set(id, {});
  for (const e of goalEntries) {
    goalEntriesByUser.get(e.userId)![e.goalId] = { done: e.done, count: e.count };
  }

  let sent = 0;

  for (const user of users) {
    const { mode } = parseStoredPlan(user.intensity, user.customTargets);

    let incomplete: boolean;
    if (mode === "custom") {
      const goalDefs: GoalDef[] = user.goals.map((g) => ({
        id: g.id,
        label: g.label,
        type: g.type as GoalDef["type"],
        target: g.target,
      }));
      const data = goalEntriesByUser.get(user.id) ?? {};
      incomplete = goalDayComplete(data, goalDefs) === false;
    } else {
      const c = user.checkIns[0];
      const data: CheckInData | undefined = c
        ? {
            exercise: c.exercise,
            study: c.study,
            apply: c.apply,
            build: c.build,
            movement: c.movement,
            noNap: c.noNap,
          }
        : undefined;
      incomplete = dayComplete(data, weekday, undefined, parseRestDays(user.restDays)) === false;
    }

    if (incomplete) {
      await sendStreakReminder(user.pushSubscriptions);
      sent++;
    }
  }

  return NextResponse.json({ sent });
}
