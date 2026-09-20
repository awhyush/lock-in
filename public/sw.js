// Minimal no-op service worker. No offline caching — this exists purely so the browser's
// installability check (which on some Chromium versions wants an active service worker)
// is satisfied. Nothing here intercepts or caches anything.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));
self.addEventListener("fetch", () => {});
