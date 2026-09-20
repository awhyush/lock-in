import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { MAX_HISTORY_DAYS, dateKey } from "@/lib/habits";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const requested = Number(searchParams.get("days"));
  const days = Number.isFinite(requested) ? Math.min(MAX_HISTORY_DAYS, Math.max(1, Math.floor(requested))) : 14;

  const today = new Date();
  const fromDate = new Date(today);
  fromDate.setDate(fromDate.getDate() - (days - 1));

  const checkIns = await prisma.checkIn.findMany({
    where: { userId: session.user.id, date: { gte: dateKey(fromDate), lte: dateKey(today) } },
  });

  const history: Record<string, unknown> = {};
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

  return NextResponse.json({ history });
}
