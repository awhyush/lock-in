"use client";

import type { RefObject } from "react";

export type HabitGridRow = { key: string; label: string; history: Record<string, boolean> };
export type GridDay = { key: string; label: string };

/** The sticky-first-column, fixed-width day grid shared by the personal dashboard
 * (Tracker/GoalTracker) and a circle member's read-only view. One row per habit/goal,
 * one column per day, `history[day.key] === true` paints the cell green. */
export function HabitGrid({
  rows,
  days,
  todayKey,
  compact = false,
  scrollRef,
}: {
  rows: HabitGridRow[];
  days: GridDay[];
  todayKey?: string;
  compact?: boolean;
  scrollRef?: RefObject<HTMLDivElement | null>;
}) {
  const cellPx = compact ? 16 : 20;
  const cellClass = compact ? "h-4 w-4 rounded-[5px]" : "h-5 w-5 rounded-[6px]";
  const gapYClass = compact ? "gap-y-1" : "gap-y-2";
  const dayLabelClass = compact ? "text-[8px]" : "text-[9px]";
  const rowLabelClass = compact ? "text-[10px]" : "text-xs";

  return (
    <div ref={scrollRef} className="overflow-x-auto rounded-card bg-surface-2 p-3 shadow-clay-inset">
      <div
        className={`grid w-max gap-x-1 ${gapYClass}`}
        style={{ gridTemplateColumns: `92px repeat(${days.length}, ${cellPx}px)` }}
      >
        <div className="sticky left-0 z-10 bg-surface-2" />
        {days.map((d) => (
          <div key={d.key} className={`text-center font-mono ${dayLabelClass} text-muted`}>
            {d.label}
          </div>
        ))}
        {rows.map((row) => (
          <RowCells
            key={row.key}
            row={row}
            days={days}
            todayKey={todayKey}
            cellClass={cellClass}
            rowLabelClass={rowLabelClass}
          />
        ))}
      </div>
    </div>
  );
}

function RowCells({
  row,
  days,
  todayKey,
  cellClass,
  rowLabelClass,
}: {
  row: HabitGridRow;
  days: GridDay[];
  todayKey?: string;
  cellClass: string;
  rowLabelClass: string;
}) {
  return (
    <>
      <div className={`sticky left-0 z-10 self-center truncate bg-surface-2 pr-2 ${rowLabelClass} text-muted`}>
        {row.label}
      </div>
      {days.map((d) => {
        const done = row.history[d.key] === true;
        const isToday = d.key === todayKey;
        return (
          <div
            key={d.key}
            className={`${cellClass} ${done ? "bg-sage" : ""} ${
              isToday ? "ring-2 ring-inset ring-sage-ink/60" : ""
            }`}
          />
        );
      })}
    </>
  );
}
