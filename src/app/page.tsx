import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { HABIT_KEYS, HABIT_LABELS, PLAN_MODES, PLAN_INFO } from "@/lib/habits";
import { SITE_DESCRIPTION } from "@/lib/site";
import { ThemeToggle } from "@/components/ThemeToggle";

export const metadata: Metadata = {
  description: SITE_DESCRIPTION,
  alternates: { canonical: "/" },
};

export default async function Home() {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-16 px-4 py-10">
      <nav className="flex items-center justify-between">
        <span className="font-black text-xl tracking-tight text-ink">THE LOCK-IN</span>
        <div className="flex items-center gap-4 text-sm">
          <Link href="/login" className="text-muted underline underline-offset-2">
            Sign in
          </Link>
          <Link href="/signup" className="rounded-full bg-accent px-4 py-2 font-bold text-accent-ink">
            Create account
          </Link>
          <ThemeToggle />
        </div>
      </nav>

      <section className="relative flex flex-col gap-5 overflow-hidden rounded-[2.5rem] border border-line bg-surface p-8 shadow-soft">
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-sage/20" />

        <p className="relative font-bold text-[10px] uppercase tracking-[0.16em] text-sage">Daily reset tracker</p>
        <h1 className="relative max-w-xl font-black text-5xl leading-[1.02] tracking-tight text-ink text-balance">
          Lock in on the things that matter to you.
        </h1>
        <p className="relative max-w-md text-[15px] leading-relaxed text-muted">
          Pick a plan, check off five habits a day, and build a real streak instead of relying on good intentions.
        </p>
        <div className="relative flex items-center gap-3">
          <Link href="/signup" className="rounded-full bg-accent px-5 py-3 text-sm font-bold text-accent-ink">
            Create account
          </Link>
          <Link href="/login" className="rounded-full border border-line px-5 py-3 text-sm font-bold text-ink">
            Sign in
          </Link>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <ol className="flex flex-col gap-3">
          {[
            { title: "Pick your plan", body: "Choose a recommended preset, or set your own minutes for each habit." },
            { title: "Check off today", body: "Five habits, weekday-aware. Hit the minimum and the day still counts." },
            { title: "Watch the streak", body: "See your progress across 14/30/90 days and keep your streak alive." },
          ].map((step, i) => (
            <li key={step.title} className="flex gap-4 rounded-[1.5rem] border border-line bg-surface p-4 shadow-soft">
              <span className="text-lg font-black tabular-nums text-accent">{i + 1}</span>
              <span>
                <span className="block text-sm font-bold text-ink">{step.title}</span>
                <span className="block text-sm text-muted">{step.body}</span>
              </span>
            </li>
          ))}
        </ol>
        <div className="flex flex-wrap gap-2">
          {HABIT_KEYS.map((key) => (
            <span
              key={key}
              className="rounded-full border border-line px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-wide text-muted"
            >
              {HABIT_LABELS[key]}
            </span>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {PLAN_MODES.map((mode) => (
            <div key={mode} className="rounded-[1.5rem] border border-line bg-surface p-4 shadow-soft">
              <p className="text-sm font-bold text-ink">{PLAN_INFO[mode].title}</p>
              <p className="mt-1 text-sm text-muted">{PLAN_INFO[mode].description}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="flex items-center justify-between border-t border-line pt-6 text-sm text-muted">
        <p>Built and maintained by ayush.</p>
        <Link href="/login" className="underline underline-offset-2">
          Sign in
        </Link>
      </footer>
    </main>
  );
}
