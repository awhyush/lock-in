import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { PLAN_MODES, clampCustomTargets, type PlanMode } from "@/lib/habits";

function parseSportDaysInput(input: unknown): number[] | null {
  if (input === undefined) return [];
  if (!Array.isArray(input)) return null;
  if (input.some((n) => typeof n !== "number" || !Number.isInteger(n) || n < 0 || n > 6)) return null;
  return Array.from(new Set(input as number[])).sort((a, b) => a - b);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const mode = body?.mode;
  if (typeof mode !== "string" || !PLAN_MODES.includes(mode as PlanMode)) {
    return NextResponse.json({ error: "Invalid plan." }, { status: 400 });
  }

  const sportDays = parseSportDaysInput(body?.sportDays);
  if (sportDays === null) {
    return NextResponse.json({ error: "Invalid sport days." }, { status: 400 });
  }

  const data: { intensity: string; onboarded: boolean; customTargets?: string; sportDays: string } = {
    intensity: mode,
    onboarded: true,
    sportDays: JSON.stringify(sportDays),
  };

  if (mode === "custom") {
    const custom = clampCustomTargets(body?.customTargets ?? {});
    if (!custom) {
      return NextResponse.json({ error: "Invalid custom targets." }, { status: 400 });
    }
    data.customTargets = JSON.stringify(custom);
  }

  await prisma.user.update({ where: { id: session.user.id }, data });

  return NextResponse.json({ ok: true });
}
