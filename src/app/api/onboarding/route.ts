import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { INTENSITIES } from "@/lib/habits";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const intensity = body?.intensity;
  if (typeof intensity !== "string" || !INTENSITIES.includes(intensity as never)) {
    return NextResponse.json({ error: "Invalid intensity." }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { intensity, onboarded: true },
  });

  return NextResponse.json({ ok: true });
}
