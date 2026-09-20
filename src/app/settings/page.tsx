import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { parseSportDays, parseStoredPlan } from "@/lib/habits";
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

  const { mode, custom } = parseStoredPlan(user.intensity, user.customTargets);
  const sportDays = parseSportDays(user.sportDays);

  return (
    <PlanForm
      name={user.name}
      mode="settings"
      initialPlanMode={mode}
      initialCustomTargets={custom}
      initialSportDays={sportDays}
    />
  );
}
