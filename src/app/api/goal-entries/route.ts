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

  if (typeof goalId !== "string" || !goalId) {
    return NextResponse.json({ error: "Invalid goal." }, { status: 400 });
  }
  if (typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "Invalid date." }, { status: 400 });
  }

  const goal = await prisma.goal.findUnique({ where: { id: goalId } });
  if (!goal || goal.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  // The goal's actual type decides which field is authoritative — never trust the client
  // to say which shape it's sending, since that would let a checkbox goal be fed an
  // arbitrary count or vice versa.
  let done: boolean;
  let count: number;
  if (goal.type === "counter") {
    const rawCount = body?.count;
    if (typeof rawCount !== "number" || !Number.isFinite(rawCount) || rawCount < 0) {
      return NextResponse.json({ error: "Invalid value." }, { status: 400 });
    }
    count = Math.floor(rawCount);
    done = count >= 1;
  } else {
    const rawDone = body?.done;
    if (typeof rawDone !== "boolean") {
      return NextResponse.json({ error: "Invalid value." }, { status: 400 });
    }
    done = rawDone;
    count = 0;
  }

  const entry = await prisma.goalEntry.upsert({
    where: { goalId_date: { goalId, date } },
    create: { goalId, userId: session.user.id, date, done, count },
    update: { done, count },
  });

  return NextResponse.json(entry);
}
