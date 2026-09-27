import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { HABIT_KEYS, PLAN_MODES, type HabitKey, type PlanMode, type RestDays } from "@/lib/habits";
import {
  GOAL_COUNTER_BOUNDS,
  GOAL_DURATION_BOUNDS,
  GOAL_TYPES,
  MAX_GOALS,
  MAX_GOAL_LABEL_LENGTH,
  type GoalType,
} from "@/lib/goals";

type GoalInput = { id: string | null; label: string; type: GoalType; target: number | null };

function cleanTarget(raw: unknown, bounds: { min: number; max: number }): number {
  const n = Number(raw);
  if (!Number.isFinite(n)) return bounds.min;
  return Math.min(bounds.max, Math.max(bounds.min, Math.round(n)));
}

function cleanGoalInput(input: unknown): GoalInput[] | null {
  if (!Array.isArray(input)) return null;
  const cleaned = input
    .map((g): GoalInput | null => {
      if (typeof g !== "object" || g === null) return null;
      const rec = g as Record<string, unknown>;
      const id = typeof rec.id === "string" ? rec.id : null;
      const label = typeof rec.label === "string" ? rec.label.trim().slice(0, MAX_GOAL_LABEL_LENGTH) : "";
      if (!label) return null;

      const type: GoalType = GOAL_TYPES.includes(rec.type as GoalType) ? (rec.type as GoalType) : "checkbox";
      const target =
        type === "duration"
          ? cleanTarget(rec.target, GOAL_DURATION_BOUNDS)
          : type === "counter"
            ? cleanTarget(rec.target, GOAL_COUNTER_BOUNDS)
            : null;

      return { id, label, type, target };
    })
    .filter((g): g is GoalInput => g !== null)
    .slice(0, MAX_GOALS);
  return cleaned.length > 0 ? cleaned : null;
}

/** Keeps only known HabitKeys and in-range weekday ints — same defensive-parse shape as
 * cleanGoalInput above and parseRestDays in lib/habits.ts. Garbage in just becomes "no
 * exception for that key" rather than a rejection, since an exception is inert unless it
 * happens to match a day DAY_RULES actually requires that habit on. */
function cleanRestDays(input: unknown): RestDays | null {
  if (typeof input !== "object" || input === null) return null;
  const rec = input as Record<string, unknown>;
  const result: RestDays = {};
  for (const key of HABIT_KEYS) {
    const days = rec[key];
    if (!Array.isArray(days)) continue;
    const valid = [...new Set(days.filter((d): d is number => Number.isInteger(d) && d >= 0 && d <= 6))].sort();
    if (valid.length) result[key as HabitKey] = valid;
  }
  return Object.keys(result).length ? result : null;
}

/** Replaces a user's Goal set with exactly what was submitted: updates goals that still
 * exist, creates new ones (id: null), deletes any of the user's existing goals that weren't
 * resubmitted (cascades their entries). */
async function reconcileGoals(userId: string, goals: GoalInput[]) {
  const existing = await prisma.goal.findMany({ where: { userId }, select: { id: true } });
  const existingIds = new Set(existing.map((g) => g.id));
  const keptIds = new Set(goals.filter((g) => g.id && existingIds.has(g.id)).map((g) => g.id as string));
  const toDelete = [...existingIds].filter((id) => !keptIds.has(id));

  await prisma.$transaction([
    ...(toDelete.length ? [prisma.goal.deleteMany({ where: { id: { in: toDelete } } })] : []),
    ...goals.map((g, i) =>
      g.id && existingIds.has(g.id)
        ? prisma.goal.update({
            where: { id: g.id },
            data: { label: g.label, type: g.type, target: g.target, sortOrder: i },
          })
        : prisma.goal.create({
            data: { userId, label: g.label, type: g.type, target: g.target, sortOrder: i },
          }),
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

  const restDays = mode !== "custom" ? cleanRestDays(body?.restDays) : null;

  await prisma.user.update({
    where: { id: session.user.id },
    data: { intensity: mode, onboarded: true, restDays: restDays ? JSON.stringify(restDays) : null },
  });

  return NextResponse.json({ ok: true });
}
