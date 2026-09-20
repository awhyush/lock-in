import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { parseStoredPlan } from "@/lib/habits";
import { PlanForm } from "@/components/PlanForm";

export const metadata: Metadata = {
  title: "Your plan",
  robots: { index: false, follow: false },
};

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) redirect("/login");
  if (!user.onboarded) redirect("/onboarding");

  const { mode } = parseStoredPlan(user.intensity, user.customTargets);
  const goals = await prisma.goal.findMany({ where: { userId: user.id }, orderBy: { sortOrder: "asc" } });

  return (
    <PlanForm
      name={user.name}
      mode="settings"
      initialPlanMode={mode}
      initialGoals={goals.map((g) => ({ id: g.id, label: g.label }))}
    />
  );
}
