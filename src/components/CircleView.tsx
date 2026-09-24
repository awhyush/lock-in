"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { HISTORY_RANGE_OPTIONS, dateKey } from "@/lib/habits";
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
    for (let i = HISTORY_RANGE_OPTIONS[0] - 1; i >= 0; i--) {
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

        <VisibilityEditor circleId={circle.id} allKeys={circle.viewerAllKeys} visibleKeys={circle.viewerVisibleKeys} />

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
              <MemberRow
                key={m.userId}
                circleId={circle.id}
                member={m}
                days={days}
                todayKey={circle.todayKey}
                isSelf={m.userId === viewerId}
              />
            ))}
          </div>
        </section>
      </main>
      <AppNav />
    </>
  );
}

function MemberRow({
  circleId,
  member,
  days,
  todayKey,
  isSelf,
}: {
  circleId: string;
  member: CircleMemberView;
  days: { key: string; label: string }[];
  todayKey: string;
  isSelf: boolean;
}) {
  const [nudged, setNudged] = useState(false);
  const [nudging, setNudging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function nudge() {
    setNudging(true);
    setError(null);
    const res = await fetch(`/api/circles/${circleId}/nudge`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ toUserId: member.userId }),
    });
    setNudging(false);
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setError(body?.error ?? "Couldn't send that.");
      return;
    }
    setNudged(true);
  }

  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <span className="text-sm font-bold text-ink">
          {member.name}
          {isSelf && <span className="ml-1.5 text-xs font-medium text-muted">(you)</span>}
        </span>
        <span className="flex items-center gap-2 text-xs font-bold text-muted">
          <span className="text-accent">{member.streak}d streak</span>
          {member.weekPercent != null && <span>{member.weekPercent}% this week</span>}
          {member.canNudge && !nudged && (
            <button
              type="button"
              onClick={nudge}
              disabled={nudging}
              className="rounded-full border border-accent px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-accent disabled:opacity-60"
            >
              {nudging ? "..." : "Nudge"}
            </button>
          )}
          {nudged && <span className="rounded-full border border-line px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide">Nudged</span>}
        </span>
      </div>
      {error && <p className="mb-2 text-xs text-warn">{error}</p>}
      {member.rows.length > 0 ? (
        <HabitGrid rows={member.rows} days={days} todayKey={todayKey} compact />
      ) : (
        <p className="text-xs text-muted">Nothing shared here.</p>
      )}
    </div>
  );
}

function VisibilityEditor({
  circleId,
  allKeys,
  visibleKeys,
}: {
  circleId: string;
  allKeys: { key: string; label: string }[];
  visibleKeys: string[] | null;
}) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(visibleKeys ?? allKeys.map((k) => k.key)),
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  function toggleKey(key: string) {
    setSaved(false);
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  async function save() {
    setSaving(true);
    const showsEverything = selected.size === allKeys.length;
    await fetch(`/api/circles/${circleId}/visibility`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ keys: showsEverything ? null : [...selected] }),
    });
    setSaving(false);
    setSaved(true);
    router.refresh();
  }

  if (allKeys.length === 0) return null;

  return (
    <section className="rounded-[1.5rem] border border-line bg-surface p-4 shadow-soft">
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="flex w-full items-center justify-between gap-3 text-left"
      >
        <span className="text-sm font-bold text-ink">What you share here</span>
        <span className="text-xs font-bold text-muted">{expanded ? "Hide" : "Edit"}</span>
      </button>

      {expanded && (
        <div className="mt-3 flex flex-col gap-3">
          <p className="text-xs text-muted">
            Choose which of your habits show up in this circle. Everyone still sees your streak and grid, just
            only for what you pick here.
          </p>
          <div className="flex flex-wrap gap-2">
            {allKeys.map((k) => {
              const active = selected.has(k.key);
              return (
                <button
                  key={k.key}
                  type="button"
                  onClick={() => toggleKey(k.key)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-bold ${
                    active ? "border-accent bg-accent text-accent-ink" : "border-line text-muted"
                  }`}
                >
                  {k.label}
                </button>
              );
            })}
          </div>
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="self-start rounded-full bg-accent px-4 py-2 text-xs font-bold text-accent-ink disabled:opacity-60"
          >
            {saving ? "Saving..." : saved ? "Saved" : "Save"}
          </button>
        </div>
      )}
    </section>
  );
}
