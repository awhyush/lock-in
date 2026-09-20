import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { PLAN_MODES, type PlanMode } from "@/lib/habits";
import { MAX_GOALS, MAX_GOAL_LABEL_LENGTH } from "@/lib/goals";

type GoalInput = { id: string | null; label: string };

function cleanGoalInput(input: unknown): GoalInput[] | null {
  if (!Array.isArray(input)) return null;
  const cleaned = input
    .map((g): GoalInput | null => {
      if (typeof g !== "object" || g === null) return null;
      const rec = g as Record<string, unknown>;
      const id = typeof rec.id === "string" ? rec.id : null;
      const label = typeof rec.label === "string" ? rec.label.trim().slice(0, MAX_GOAL_LABEL_LENGTH) : "";
      return label ? { id, label } : null;
    })
    .filter((g): g is GoalInput => g !== null)
    .slice(0, MAX_GOALS);
  return cleaned.length > 0 ? cleaned : null;
}

/** Replaces a user's Goal set with exactly what was submitted: updates labels for goals that
 * still exist, creates new ones (id: null), deletes any of the user's existing goals that
 * weren't resubmitted (cascades their entries). */
async function reconcileGoals(userId: string, goals: GoalInput[]) {
  const existing = await prisma.goal.findMany({ where: { userId }, select: { id: true } });
  const existingIds = new Set(existing.map((g) => g.id));
  const keptIds = new Set(goals.filter((g) => g.id && existingIds.has(g.id)).map((g) => g.id as string));
  const toDelete = [...existingIds].filter((id) => !keptIds.has(id));

  await prisma.$transaction([
    ...(toDelete.length ? [prisma.goal.deleteMany({ where: { id: { in: toDelete } } })] : []),
    ...goals.map((g, i) =>
      g.id && existingIds.has(g.id)
        ? prisma.goal.update({ where: { id: g.id }, data: { label: g.label, sortOrder: i } })
        : prisma.goal.create({ data: { userId, label: g.label, sortOrder: i } }),
    ),
  ]);
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

  if (mode === "custom") {
    const goals = cleanGoalInput(body?.goals);
    if (!goals) {
      return NextResponse.json({ error: "Add at least one goal." }, { status: 400 });
    }
    await reconcileGoals(session.user.id, goals);
  }

  await prisma.user.update({ where: { id: session.user.id }, data: { intensity: mode, onboarded: true } });

  return NextResponse.json({ ok: true });
}
