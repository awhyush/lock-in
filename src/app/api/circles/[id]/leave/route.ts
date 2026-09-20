import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const { id } = await params;

  const membership = await prisma.circleMember.findUnique({
    where: { circleId_userId: { circleId: id, userId: session.user.id } },
  });
  if (!membership) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const circle = await prisma.circle.findUnique({ where: { id } });
  if (circle?.ownerId === session.user.id) {
    // Owner leaving disbands the circle; memberships cascade.
    await prisma.circle.delete({ where: { id } });
  } else {
    await prisma.circleMember.delete({ where: { circleId_userId: { circleId: id, userId: session.user.id } } });
  }

  return NextResponse.json({ ok: true });
}
