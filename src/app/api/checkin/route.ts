import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const BOOLEAN_FIELDS = ["exercise", "study", "build", "movement", "noNap"] as const;

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const date = body?.date;
  const data = body?.data;

  if (typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "Invalid date." }, { status: 400 });
  }
  if (typeof data !== "object" || data === null) {
    return NextResponse.json({ error: "Invalid data." }, { status: 400 });
  }

  const clean: Record<string, boolean | number> = {};
  for (const key of BOOLEAN_FIELDS) {
    if (key in data && typeof data[key] === "boolean") clean[key] = data[key];
  }
  if ("apply" in data && typeof data.apply === "number" && Number.isFinite(data.apply)) {
    clean.apply = Math.max(0, Math.floor(data.apply));
  }

  const checkIn = await prisma.checkIn.upsert({
    where: { userId_date: { userId: session.user.id, date } },
    create: { userId: session.user.id, date, ...clean },
    update: clean,
  });

  return NextResponse.json(checkIn);
}
