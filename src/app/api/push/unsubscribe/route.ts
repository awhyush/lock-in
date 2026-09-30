import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const endpoint = body?.endpoint;
  if (typeof endpoint !== "string") {
    return NextResponse.json({ error: "Invalid subscription." }, { status: 400 });
  }

  // deleteMany (not delete) so an endpoint that's already gone, or belongs to someone else,
  // is a silent no-op rather than a 404/403 the client has to special-case.
  await prisma.pushSubscription.deleteMany({ where: { endpoint, userId: session.user.id } });

  return NextResponse.json({ ok: true });
}
