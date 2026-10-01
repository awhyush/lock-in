"use client";

import { useEffect, useState } from "react";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

type Status = "unsupported" | "ios-not-installed" | "checking" | "denied" | "off" | "on" | "working";

/** iOS/iPadOS Safari doesn't expose PushManager at all in a regular browser tab — the Push
 * API only exists once the site has been added to the Home Screen and is running standalone.
 * Distinguishing this from "genuinely unsupported browser" lets us show the user something
 * actionable (install it) instead of the toggle just silently not being there, which looks
 * identical to a missing/broken feature. */
function isIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia?.("(display-mode: standalone)").matches || (window.navigator as { standalone?: boolean }).standalone === true;
}

function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const base64Safe = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64Safe);
  const bytes = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
  return bytes;
}

function BellIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M6 9.5a6 6 0 1 1 12 0c0 4.2 1.5 5.8 1.5 5.8H4.5S6 13.7 6 9.5Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M9.5 18.5a2.5 2.5 0 0 0 5 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function NotificationToggle() {
  const [status, setStatus] = useState<Status>("checking");

  useEffect(() => {
    if (!VAPID_PUBLIC_KEY || !("serviceWorker" in navigator) || !("PushManager" in window)) {
      setStatus(isIOS() && !isStandalone() ? "ios-not-installed" : "unsupported");
      return;
    }
    if (Notification.permission === "denied") {
      setStatus("denied");
      return;
    }
    navigator.serviceWorker.ready
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => setStatus(sub ? "on" : "off"))
      .catch(() => setStatus("off"));
  }, []);

  async function enable() {
    setStatus("working");
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus(permission === "denied" ? "denied" : "off");
        return;
      }
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY!),
      });
      const json = subscription.toJSON();
      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint: json.endpoint, keys: json.keys }),
      });
      setStatus("on");
    } catch {
      setStatus("off");
    }
  }

  async function disable() {
    setStatus("working");
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await fetch("/api/push/unsubscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        });
        await subscription.unsubscribe();
      }
      setStatus("off");
    } catch {
      setStatus("on");
    }
  }

  if (status === "unsupported") return null;

  if (status === "ios-not-installed") {
    return (
      <div className="flex items-start gap-3 rounded-card bg-surface-2 p-3 shadow-clay-inset">
        <BellIcon className="h-5 w-5 flex-none text-muted" />
        <span className="text-xs text-muted">
          To get reminders, add this app to your Home Screen first: tap the Share icon in Safari, then{" "}
          <b className="text-ink">Add to Home Screen</b> — then open it from there.
        </span>
      </div>
    );
  }

  if (status === "denied") {
    return (
      <div className="flex items-center justify-between rounded-card bg-surface-2 p-3 shadow-clay-inset">
        <span className="text-sm font-bold text-muted">Reminders blocked in browser settings</span>
        <BellIcon className="h-5 w-5 text-muted" />
      </div>
    );
  }

  const on = status === "on";
  return (
    <button
      type="button"
      onClick={on ? disable : enable}
      disabled={status === "checking" || status === "working"}
      className="flex items-center justify-between rounded-card bg-surface p-3 text-left shadow-clay disabled:opacity-60"
    >
      <span className="text-sm font-bold text-ink">{on ? "Reminders on" : "Enable reminders"}</span>
      <BellIcon className={`h-5 w-5 ${on ? "text-peach-ink" : "text-muted"}`} />
    </button>
  );
}
