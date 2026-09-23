import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getCircleForMember } from "@/lib/circles";
import { isNudgeWindowOpen } from "@/lib/nudges";
import { dateKey } from "@/lib/habits";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const { id: circleId } = await params;

  const body = await req.json().catch(() => null);
  const toUserId = body?.toUserId;
  if (typeof toUserId !== "string" || !toUserId) {
    return NextResponse.json({ error: "Invalid recipient." }, { status: 400 });
  }
  if (toUserId === session.user.id) {
    return NextResponse.json({ error: "You can't nudge yourself." }, { status: 400 });
  }

  if (!isNudgeWindowOpen(new Date())) {
    return NextResponse.json({ error: "Nudges only open in the last 2 hours of the day." }, { status: 400 });
  }

  // getCircleForMember membership-gates the caller and already computes each member's
  // per-circle doneToday (respecting their own visibility filter) — reuse it instead of
  // re-deriving streak logic here. It also implicitly confirms toUserId is a real member:
  // if they're not in circle.members, the lookup below just won't find them.
  const circle = await getCircleForMember(circleId, session.user.id);
  if (!circle) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const target = circle.members.find((m) => m.userId === toUserId);
  if (!target) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }
  if (target.doneToday) {
    return NextResponse.json({ error: "They're already done for today." }, { status: 400 });
  }

  const today = dateKey(new Date());
  const existing = await prisma.nudge.findUnique({
    where: {
      circleId_fromUserId_toUserId_date: { circleId, fromUserId: session.user.id, toUserId, date: today },
    },
  });
  if (existing) {
    return NextResponse.json({ error: "You already nudged them today." }, { status: 400 });
  }

  await prisma.nudge.create({
    data: { circleId, fromUserId: session.user.id, toUserId, date: today },
  });

  return NextResponse.json({ ok: true });
}
