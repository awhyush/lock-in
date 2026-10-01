/** The Badging API only supports a plain number (or clearing it) — there's no way to recolor
 * it or show a custom glyph like a checkmark, the OS renders it the same way every time.
 * Sets a red count badge on the installed app's icon for today's incomplete items; clears it
 * entirely once nothing's left. Chromium desktop/Android + iOS Safari 16.4+ (installed to
 * Home Screen only, same constraint as push notifications) support this; everything else
 * silently no-ops. */
export function updateAppBadge(incompleteCount: number): void {
  if (typeof navigator === "undefined" || !("setAppBadge" in navigator)) return;
  try {
    if (incompleteCount > 0) {
      navigator.setAppBadge(incompleteCount).catch(() => {});
    } else {
      navigator.clearAppBadge?.().catch(() => {});
    }
  } catch {
    // ignore — badge is a nice-to-have, never worth surfacing an error for
  }
}
