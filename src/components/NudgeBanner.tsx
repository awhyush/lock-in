"use client";

import { useState } from "react";

export type NudgeNotice = { id: string; fromName: string; circleName: string };

export function NudgeBanner({ nudges }: { nudges: NudgeNotice[] }) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const visible = nudges.filter((n) => !dismissed.has(n.id));

  if (visible.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      {visible.map((n) => (
        <div
          key={n.id}
          className="flex items-center justify-between gap-3 rounded-[1.5rem] border border-accent/30 bg-accent/10 px-4 py-3 text-sm text-ink"
        >
          <span>
            <b>{n.fromName}</b> nudged you in <b>{n.circleName}</b>. Don&apos;t lose your streak.
          </span>
          <button
            type="button"
            onClick={() => setDismissed((d) => new Set(d).add(n.id))}
            aria-label="Dismiss"
            className="flex-none text-muted"
          >
            {"✕"}
          </button>
        </div>
      ))}
    </div>
  );
}
