"use client";

import { useEffect, useState } from "react";

const DISMISSED_KEY = "lockin-install-dismissed";
const MOBILE_QUERY = "(max-width: 767px)";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }

    // "Install" only makes sense as an app-like, home-screen thing — pointless clutter on
    // desktop, where the browser (or Chrome/Edge's own omnibox install icon) already covers it.
    if (!window.matchMedia(MOBILE_QUERY).matches) return;

    let dismissed = false;
    try {
      dismissed = localStorage.getItem(DISMISSED_KEY) === "1";
    } catch {
      // private browsing or blocked storage — just don't remember the dismissal
    }
    if (dismissed) return;

    function onBeforeInstallPrompt(e: Event) {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setVisible(true);
    }

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
  }, []);

  function dismiss() {
    setVisible(false);
    try {
      localStorage.setItem(DISMISSED_KEY, "1");
    } catch {
      // ignore — the banner just won't be remembered across visits
    }
  }

  async function install() {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    setVisible(false);
    try {
      localStorage.setItem(DISMISSED_KEY, "1");
    } catch {
      // ignore
    }
  }

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-30 flex justify-center px-4 pb-[calc(env(safe-area-inset-bottom,0px)+104px)]">
      <div className="flex w-full max-w-sm items-center gap-3 rounded-[1.5rem] border border-line bg-surface px-4 py-3 shadow-soft">
        <span className="flex-1 text-sm text-ink">Install The Lock-In for quicker access.</span>
        <button
          type="button"
          onClick={install}
          className="flex-none rounded-full bg-accent px-3.5 py-1.5 text-xs font-bold text-accent-ink"
        >
          Install
        </button>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss"
          className="flex-none text-muted"
        >
          {"✕"}
        </button>
      </div>
    </div>
  );
}
