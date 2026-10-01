import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { SITE_DESCRIPTION } from "@/lib/site";
import { BRUTALIST_FONT_VARS } from "@/lib/brutalist-fonts";
import { NoiseOverlay } from "@/components/NoiseOverlay";

export const metadata: Metadata = {
  description: SITE_DESCRIPTION,
  alternates: { canonical: "/" },
};

const MONO = "font-[family-name:var(--font-jetbrains-mono)]";
const DISPLAY = "font-[family-name:var(--font-inter-tight)]";
const BODY = "font-[family-name:var(--font-inter)]";

const HERO_WORDS = ["LOCK", "IN", "EVERY", "DAY"];

const SYSTEM_CARDS = [
  {
    tag: "SYSTEM_01",
    title: "Streaks",
    body: "Pick a plan, check off today's habits, and watch a real streak build across 14/30/90 days.",
  },
  {
    tag: "SYSTEM_02",
    title: "Circles",
    body: "Share progress with a small group. See every member's grid side by side, nudge who's about to slip.",
  },
  {
    tag: "SYSTEM_03",
    title: "Reminders",
    body: "Opt into push notifications. One reminder, before the day's out, if today isn't done yet.",
  },
];

export default async function Home() {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  return (
    <div className={`${BRUTALIST_FONT_VARS} relative min-h-screen bg-black text-white`}>
      <NoiseOverlay />

      <nav className="sticky top-0 z-40 flex h-[72px] items-center justify-between border-b-[0.5px] border-white/15 bg-black/80 px-5 backdrop-blur sm:px-8">
        <div className="flex items-center gap-2.5">
          <span className={`${DISPLAY} text-sm font-black uppercase tracking-[-0.03em] sm:text-base`}>
            The Lock-In
          </span>
          <span className="h-1.5 w-1.5 flex-none rounded-full bg-white" />
          <span className={`${MONO} hidden text-[10px] uppercase tracking-[0.3em] text-white/40 sm:inline`}>
            V.01
          </span>
        </div>
        <div className="flex items-center gap-4 sm:gap-6">
          <Link
            href="/login"
            className={`${MONO} whitespace-nowrap text-[10px] uppercase tracking-[0.25em] text-white/70 transition-colors duration-300 hover:text-white`}
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            className={`${MONO} whitespace-nowrap rounded-full bg-white px-4 py-2 text-[10px] font-medium uppercase tracking-[0.3em] text-black transition-colors duration-300 hover:bg-[#6366f1] hover:text-white`}
          >
            Get access
          </Link>
        </div>
      </nav>

      <section className="grid grid-cols-1 border-b-[0.5px] border-white/15 sm:grid-cols-2">
        {HERO_WORDS.map((word, i) => (
          <div
            key={word}
            className={`flex h-[34vh] items-end overflow-hidden border-white/15 px-4 pb-2 sm:h-[40vh] sm:px-8 sm:pb-4 ${
              i < 3 ? "border-b-[0.5px]" : ""
            } ${i < 2 ? "sm:border-b-[0.5px]" : "sm:border-b-0"} ${i % 2 === 0 ? "sm:border-r-[0.5px]" : ""}`}
          >
            <span
              className={`${DISPLAY} whitespace-nowrap font-black uppercase leading-[0.8] tracking-[-0.05em] text-[clamp(3rem,15vw,11rem)]`}
            >
              {word}
            </span>
          </div>
        ))}
      </section>

      <section className="grid grid-cols-1 border-b-[0.5px] border-white/15 sm:grid-cols-4">
        <div className="flex flex-col justify-center gap-1 border-white/15 px-5 py-6 sm:border-r-[0.5px] sm:px-6">
          <p className={`${MONO} text-[9px] uppercase tracking-[0.3em] text-white/40`}>A_daily_reset_tracker</p>
          <p className={`${BODY} text-sm font-light text-white/70`}>
            Daily habits. Real streaks. No excuses, just a real count.
          </p>
        </div>
        <div className="border-t-[0.5px] border-white/15 sm:border-t-0 sm:border-r-[0.5px]">
          <Link
            href="/signup"
            className={`${MONO} flex h-full min-h-24 w-full items-center justify-center bg-white text-center text-[11px] font-medium uppercase tracking-[0.3em] text-black transition-colors duration-300 hover:bg-[#6366f1] hover:text-white sm:min-h-0`}
          >
            Create account
          </Link>
        </div>
        <div className="flex flex-col items-center justify-center border-t-[0.5px] border-white/15 px-5 py-6 text-center sm:border-t-0 sm:border-r-[0.5px] sm:px-6">
          <span className={`${MONO} text-[13px] leading-[1.5] tracking-[0.15em] text-white sm:text-[14px]`}>
            ONE<span className="text-white/20">_</span>DAY<span className="text-white/20">_</span>OR
            <br />
            DAY<span className="text-white/20">_</span>1
          </span>
        </div>
        <div className="flex flex-col justify-center gap-1.5 border-t-[0.5px] border-white/15 px-5 py-6 sm:border-t-0 sm:px-6">
          {["Free_to_start", "Daily_streaks"].map((label) => (
            <span key={label} className={`${MONO} text-[9px] uppercase tracking-[0.25em] text-white/50`}>
              {label}
            </span>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-1 border-b-[0.5px] border-white/15 sm:grid-cols-3">
        {SYSTEM_CARDS.map((card, i) => (
          <div
            key={card.tag}
            className={`group flex h-[280px] flex-col justify-between border-white/15 p-6 transition-colors duration-300 hover:bg-white/[0.03] ${
              i < 2 ? "border-b-[0.5px] sm:border-b-0" : ""
            } ${i < SYSTEM_CARDS.length - 1 ? "sm:border-r-[0.5px]" : ""}`}
          >
            <p className={`${MONO} text-[9px] uppercase tracking-[0.3em] text-white/40`}>{card.tag}</p>
            <div>
              <h3 className={`${DISPLAY} text-2xl font-black uppercase tracking-[-0.03em]`}>{card.title}</h3>
              <p className={`${BODY} mt-2 text-sm font-light text-white/40`}>{card.body}</p>
            </div>
          </div>
        ))}
      </section>

      <footer className="flex items-center justify-between px-5 py-8 sm:px-8">
        <p className={`${MONO} text-[9px] uppercase tracking-[0.25em] text-white/30`}>Built_by_ayush</p>
        <Link
          href="/login"
          className={`${MONO} text-[9px] uppercase tracking-[0.25em] text-white/50 underline underline-offset-4 transition-colors duration-300 hover:text-white`}
        >
          Sign in
        </Link>
      </footer>
    </div>
  );
}
