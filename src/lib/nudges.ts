export const NUDGE_WINDOW_HOURS = 2;

/** True once fewer than NUDGE_WINDOW_HOURS remain before the day rolls over (local server
 * time, same clock every other date computation in this app uses). Nudging is deliberately
 * only allowed this close to the deadline — it's a "you're about to lose it" alert, not a
 * general-purpose poke. */
export function isNudgeWindowOpen(now: Date): boolean {
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  const hoursLeft = (midnight.getTime() - now.getTime()) / (1000 * 60 * 60);
  return hoursLeft < NUDGE_WINDOW_HOURS;
}
