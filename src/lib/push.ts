import webpush from "web-push";
import { prisma } from "@/lib/prisma";
import { SITE_URL } from "@/lib/site";

const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

// web-push requires the subject to be an https: or mailto: URL — SITE_URL is plain http in
// local dev, so fall back to a placeholder mailto: there rather than crash on startup.
const vapidSubject = SITE_URL.startsWith("https://") ? SITE_URL : "mailto:web-push@localhost";

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
}

export type PushSubscriptionRow = { id: string; endpoint: string; p256dh: string; auth: string };

/** Sends the same reminder to every subscription a user has (one per device/browser). A
 * subscription the push service reports as dead (404/410 — the standard "this endpoint no
 * longer exists" signal) is deleted immediately, so stale rows never pile up and don't need
 * a separate cleanup job. Failures for any other reason are swallowed per-subscription so
 * one bad device doesn't stop the rest from being notified. */
export async function sendStreakReminder(subscriptions: PushSubscriptionRow[]): Promise<void> {
  if (!vapidPublicKey || !vapidPrivateKey) return;

  const payload = JSON.stringify({
    title: "Keep your streak alive",
    body: "You haven't logged today yet.",
    url: "/dashboard",
  });

  await Promise.all(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload,
        );
      } catch (err) {
        const statusCode = (err as { statusCode?: number }).statusCode;
        if (statusCode === 404 || statusCode === 410) {
          await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
        }
      }
    }),
  );
}
