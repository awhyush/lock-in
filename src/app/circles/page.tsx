import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { CircleForms } from "@/components/CircleForms";
import { AppNav } from "@/components/AppNav";

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
    <>
      <main className="mx-auto flex max-w-xl flex-col gap-5 px-4 py-8 pb-32">
        <header>
          <p className="font-bold text-[10px] uppercase tracking-[0.16em] text-sage">Lock in together</p>
          <h1 className="font-black text-[32px] leading-[1.05] tracking-tight text-ink">Circles</h1>
        </header>

        {circles.length > 0 && (
          <section className="rounded-[2.5rem] border border-line bg-surface p-5 shadow-soft">
            <p className="mb-3 px-0.5 font-bold text-[10px] uppercase tracking-[0.16em] text-sage">Your circles</p>
            <div className="flex flex-col gap-2">
              {circles.map((c) => (
                <Link
                  key={c.id}
                  href={`/circles/${c.id}`}
                  className="flex items-center justify-between rounded-[1.5rem] border border-line px-4 py-3 text-sm"
                >
                  <span className="font-bold text-ink">{c.name}</span>
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
      <AppNav />
    </>
  );
}
