import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const inviteCode = typeof body?.inviteCode === "string" ? body.inviteCode.trim() : "";
  if (!inviteCode) {
    return NextResponse.json({ error: "Invite code is required." }, { status: 400 });
  }

  const circle = await prisma.circle.findUnique({ where: { inviteCode } });
  if (!circle) {
    return NextResponse.json({ error: "That code doesn't match a circle." }, { status: 404 });
  }

  await prisma.circleMember.upsert({
    where: { circleId_userId: { circleId: circle.id, userId: session.user.id } },
    create: { circleId: circle.id, userId: session.user.id },
    update: {},
  });

  return NextResponse.json({ id: circle.id });
}
