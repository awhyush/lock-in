"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { dateKey } from "@/lib/habits";
import { HabitGrid } from "@/components/HabitGrid";
import { AppNav } from "@/components/AppNav";
import type { CircleDetail, CircleMemberView } from "@/lib/circles";

type SortMode = "streak" | "week";

export function CircleView({ circle, viewerId }: { circle: CircleDetail; viewerId: string }) {
  const router = useRouter();
  const [sortMode, setSortMode] = useState<SortMode>("streak");
  const [copied, setCopied] = useState(false);
  const [leaving, setLeaving] = useState(false);

  const days = useMemo(() => {
    const base = new Date(`${circle.todayKey}T00:00:00`);
    const arr: { key: string; label: string }[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(base);
      d.setDate(d.getDate() - i);
      arr.push({ key: dateKey(d), label: d.toLocaleDateString("en-US", { weekday: "narrow" }) });
    }
    return arr;
  }, [circle.todayKey]);

  const sortedMembers = useMemo(() => {
    const copy = [...circle.members];
    copy.sort((a, b) => {
      if (sortMode === "streak") return b.streak - a.streak;
      return (b.weekPercent ?? -1) - (a.weekPercent ?? -1);
    });
    return copy;
  }, [circle.members, sortMode]);

  const notDoneToday = useMemo(() => circle.members.filter((m) => !m.doneToday), [circle.members]);

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(circle.inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard API unavailable, the code is still shown on screen to copy by hand
    }
  }

  async function leave() {
    setLeaving(true);
    await fetch(`/api/circles/${circle.id}/leave`, { method: "POST" });
    router.push("/circles");
    router.refresh();
  }

  return (
    <>
      <main className="mx-auto flex max-w-xl flex-col gap-5 px-4 py-8 pb-32">
        <header className="flex items-start justify-between gap-3">
          <div>
            <p className="font-bold text-[10px] uppercase tracking-[0.16em] text-sage">Circle</p>
            <h1 className="font-black text-[32px] leading-[1.05] tracking-tight text-ink">{circle.name}</h1>
          </div>
          <button
            type="button"
            onClick={leave}
            disabled={leaving}
            className="flex-none rounded-full border border-line px-3.5 py-1.5 text-xs font-bold text-muted disabled:opacity-60"
          >
            Leave
          </button>
        </header>

        <section className="flex items-center justify-between gap-3 rounded-[1.5rem] border border-line bg-surface p-4 shadow-soft">
          <div>
            <p className="font-bold text-[10px] uppercase tracking-[0.14em] text-sage">Invite code</p>
            <p className="text-sm font-bold text-ink">{circle.inviteCode}</p>
          </div>
          <button
            type="button"
            onClick={copyCode}
            className="flex-none rounded-full border border-line px-3.5 py-1.5 text-xs font-bold text-ink"
          >
            {copied ? "Copied" : "Copy"}
          </button>
        </section>

        {notDoneToday.length > 0 && (
          <div className="rounded-[1.5rem] bg-sage/20 px-4 py-3 text-sm text-ink">
            Still to go today:{" "}
            {notDoneToday.map((m) => (m.userId === viewerId ? "you" : m.name.split(" ")[0])).join(", ")}
          </div>
        )}

        <section className="rounded-[2.5rem] border border-line bg-surface p-5 shadow-soft">
          <div className="mb-4 flex items-center justify-between gap-3 px-0.5">
            <p className="font-bold text-[10px] uppercase tracking-[0.16em] text-sage">Members</p>
            <div className="flex items-center gap-1">
              {(["streak", "week"] as SortMode[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setSortMode(m)}
                  className={`rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${
                    sortMode === m ? "border-accent text-accent" : "border-line text-muted"
                  }`}
                >
                  {m === "streak" ? "Streak" : "This week"}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-5">
            {sortedMembers.map((m) => (
              <MemberRow key={m.userId} member={m} days={days} todayKey={circle.todayKey} isSelf={m.userId === viewerId} />
            ))}
          </div>
        </section>
      </main>
      <AppNav />
    </>
  );
}

function MemberRow({
  member,
  days,
  todayKey,
  isSelf,
}: {
  member: CircleMemberView;
  days: { key: string; label: string }[];
  todayKey: string;
  isSelf: boolean;
}) {
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between">
        <span className="text-sm font-bold text-ink">
          {member.name}
          {isSelf && <span className="ml-1.5 text-xs font-medium text-muted">(you)</span>}
        </span>
        <span className="flex items-center gap-3 text-xs font-bold text-muted">
          <span className="text-accent">{member.streak}d streak</span>
          {member.weekPercent != null && <span>{member.weekPercent}% this week</span>}
        </span>
      </div>
      <HabitGrid rows={member.rows} days={days} todayKey={todayKey} compact />
    </div>
  );
}
