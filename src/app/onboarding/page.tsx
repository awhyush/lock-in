import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { PlanForm } from "@/components/PlanForm";

export const metadata: Metadata = {
  title: "Set up your plan",
  robots: { index: false, follow: false },
};

export default async function OnboardingPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) redirect("/login");
  if (user.onboarded) redirect("/dashboard");

  return <PlanForm name={user.name} mode="onboarding" initialPlanMode="standard" initialCustomTargets={null} />;
}
