import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const goalId = body?.goalId;
  const date = body?.date;
  const done = body?.done;

  if (typeof goalId !== "string" || !goalId) {
    return NextResponse.json({ error: "Invalid goal." }, { status: 400 });
  }
  if (typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "Invalid date." }, { status: 400 });
  }
  if (typeof done !== "boolean") {
    return NextResponse.json({ error: "Invalid value." }, { status: 400 });
  }

  const goal = await prisma.goal.findUnique({ where: { id: goalId } });
  if (!goal || goal.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const entry = await prisma.goalEntry.upsert({
    where: { goalId_date: { goalId, date } },
    create: { goalId, userId: session.user.id, date, done },
    update: { done },
  });

  return NextResponse.json(entry);
}
