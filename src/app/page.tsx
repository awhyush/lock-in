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
        <span className="font-display text-2xl font-extrabold tracking-wide">THE LOCK-IN</span>
        <div className="flex items-center gap-4 text-sm">
          <Link href="/login" className="text-muted underline underline-offset-2">
            Sign in
          </Link>
          <Link href="/signup" className="rounded-lg bg-accent px-3.5 py-1.5 font-semibold text-accent-ink">
            Create account
          </Link>
          <ThemeToggle />
        </div>
      </nav>

      <section className="flex flex-col gap-5">
        <p className="font-mono text-[11px] tracking-[0.14em] uppercase text-muted">Daily reset tracker</p>
        <h1 className="max-w-xl font-display text-5xl font-extrabold leading-[0.95] tracking-wide text-balance">
          Lock in on the gym, the job search, and the study grind.
        </h1>
        <p className="max-w-md text-[15px] leading-relaxed text-muted">
          Pick a plan, then check off five habits a day. Tell it which nights you&apos;ve got sport and those
          nights only ask for movement, Sunday is just recovery and planning. A streak and a history view
          show whether you&apos;re actually doing it, not just meaning to.
        </p>
        <div className="flex items-center gap-3">
          <Link
            href="/signup"
            className="rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-accent-ink"
          >
            Create account
          </Link>
          <Link href="/login" className="rounded-lg border border-line px-4 py-2.5 text-sm font-semibold">
            Sign in
          </Link>
        </div>
        <div className="flex flex-wrap gap-2 pt-1">
          {HABIT_KEYS.map((key) => (
            <span
              key={key}
              className="rounded-full border border-line px-3 py-1 font-mono text-[11px] uppercase tracking-wide text-muted"
            >
              {HABIT_LABELS[key]}
            </span>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <p className="font-mono text-[11px] tracking-[0.1em] uppercase text-muted">How it works</p>
        <ol className="flex flex-col gap-3">
          {[
            { title: "Pick your plan", body: "A recommended preset, or set your own minutes per habit." },
            { title: "Check off today", body: "Five habits, weekday-aware. Hit the minimum and the day still counts." },
            { title: "Watch the streak", body: "A 14/30/90-day view per habit, plus a running streak count." },
          ].map((step, i) => (
            <li key={step.title} className="flex gap-4 rounded-xl border border-line bg-surface p-4">
              <span className="font-mono text-lg font-semibold text-accent tabular-nums">{i + 1}</span>
              <span>
                <span className="block text-sm font-semibold">{step.title}</span>
                <span className="block text-sm text-muted">{step.body}</span>
              </span>
            </li>
          ))}
        </ol>
      </section>

      <section className="flex flex-col gap-4">
        <p className="font-mono text-[11px] tracking-[0.1em] uppercase text-muted">Plans</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {PLAN_MODES.map((mode) => (
            <div key={mode} className="rounded-xl border border-line bg-surface p-4">
              <p className="text-sm font-semibold">{PLAN_INFO[mode].title}</p>
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
