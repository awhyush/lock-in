import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { CircleForms } from "@/components/CircleForms";

export const metadata: Metadata = {
  title: "Circles",
  robots: { index: false, follow: false },
};

export default async function CirclesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) redirect("/login");
  if (!user.onboarded) redirect("/onboarding");

  const memberships = await prisma.circleMember.findMany({
    where: { userId: user.id },
    include: { circle: { include: { _count: { select: { members: true } } } } },
    orderBy: { joinedAt: "desc" },
  });

  const circles = memberships.map((m) => ({
    id: m.circle.id,
    name: m.circle.name,
    memberCount: m.circle._count.members,
  }));

  return (
    <main className="mx-auto flex max-w-xl flex-col gap-5 px-4 py-8">
      <header className="flex items-center justify-between">
        <div>
          <p className="font-mono text-[11px] tracking-[0.14em] uppercase text-muted">Lock in together</p>
          <h1 className="font-display text-4xl font-extrabold leading-[0.9] tracking-wide">CIRCLES</h1>
        </div>
        <Link href="/dashboard" className="font-mono text-[11px] uppercase tracking-wide text-muted underline underline-offset-2">
          Dashboard
        </Link>
      </header>

      {circles.length > 0 && (
        <section className="rounded-2xl border border-line bg-surface p-4 shadow-sm">
          <p className="mb-3 px-0.5 font-mono text-[11px] tracking-[0.1em] uppercase text-muted">Your circles</p>
          <div className="flex flex-col gap-2">
            {circles.map((c) => (
              <Link
                key={c.id}
                href={`/circles/${c.id}`}
                className="flex items-center justify-between rounded-lg border border-line px-3 py-2.5 text-sm"
              >
                <span className="font-semibold">{c.name}</span>
                <span className="text-muted">
                  {c.memberCount} {c.memberCount === 1 ? "member" : "members"}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <CircleForms />
    </main>
  );
}
