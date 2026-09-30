// No offline caching here — install/activate/fetch just satisfy the browser's installability
// check (some Chromium versions want an active service worker). push/notificationclick below
// are the real content: they're what let a subscribed browser actually show and handle the
// daily streak-reminder notification even while no tab is open.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));
self.addEventListener("fetch", () => {});

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    // ignore — falls through to the defaults below
  }
  event.waitUntil(
    self.registration.showNotification(data.title || "The Lock-In", {
      body: data.body || "You haven't logged today yet.",
      icon: "/icon",
      badge: "/icon",
      data: { url: data.url || "/dashboard" },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/dashboard";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes(url) && "focus" in client) return client.focus();
      }
      return self.clients.openWindow(url);
    }),
  );
});
