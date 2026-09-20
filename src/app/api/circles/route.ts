import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const memberships = await prisma.circleMember.findMany({
    where: { userId: session.user.id },
    include: { circle: { include: { _count: { select: { members: true } } } } },
    orderBy: { joinedAt: "desc" },
  });

  const circles = memberships.map((m) => ({
    id: m.circle.id,
    name: m.circle.name,
    memberCount: m.circle._count.members,
  }));

  return NextResponse.json({ circles });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim().slice(0, 60) : "";
  if (!name) {
    return NextResponse.json({ error: "Name is required." }, { status: 400 });
  }

  const inviteCode = randomBytes(9).toString("base64url");

  const circle = await prisma.circle.create({
    data: {
      name,
      inviteCode,
      ownerId: session.user.id,
      members: { create: { userId: session.user.id } },
    },
  });

  return NextResponse.json({ id: circle.id });
}
