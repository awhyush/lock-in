import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const MAX_KEYS = 50;

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const { id: circleId } = await params;

  const body = await req.json().catch(() => null);
  const rawKeys = body?.keys;

  // null means "show everything" (the default). Otherwise it must be an array of strings.
  let keys: string[] | null;
  if (rawKeys === null) {
    keys = null;
  } else if (Array.isArray(rawKeys) && rawKeys.every((k) => typeof k === "string")) {
    keys = rawKeys.slice(0, MAX_KEYS);
  } else {
    return NextResponse.json({ error: "Invalid value." }, { status: 400 });
  }

  // Scoped to circleId + the caller's own id from the session — this can only ever update
  // the caller's own membership row, never another member's.
  const membership = await prisma.circleMember.findUnique({
    where: { circleId_userId: { circleId, userId: session.user.id } },
  });
  if (!membership) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  await prisma.circleMember.update({
    where: { circleId_userId: { circleId, userId: session.user.id } },
    data: { visibleKeys: keys === null ? null : JSON.stringify(keys) },
  });

  return NextResponse.json({ ok: true });
}
