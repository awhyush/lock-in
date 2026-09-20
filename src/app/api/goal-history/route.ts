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

  const entries = await prisma.goalEntry.findMany({
    where: { userId: session.user.id, date: { gte: dateKey(fromDate), lte: dateKey(today) } },
  });

  const history: Record<string, Record<string, boolean>> = {};
  for (const e of entries) {
    (history[e.date] ??= {})[e.goalId] = e.done;
  }

  return NextResponse.json({ history });
}
