// CoalMine / SurakshaMine — push notification service worker.
// Registered by the employee enrolment page at /alerts/subscribe.
// This runs even when the site tab is closed, which is what lets
// an incident alert reach an employee's phone as a real
// notification instead of only appearing inside the app.

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch (err) {
    payload = { title: "SurakshaMine Alert", body: event.data ? event.data.text() : "" };
  }

  const title = payload.title || "SurakshaMine Safety Alert";
  const severity = payload.severity || "medium";

  const options = {
    body: payload.body || "A new incident alert has been issued for your mine.",
    icon: "/favicon.ico",
    badge: "/favicon.ico",
    tag: payload.tag || "suraksha-alert",
    // Critical/high severity alerts stay on screen until the
    // employee dismisses them instead of auto-hiding.
    requireInteraction: severity === "critical" || severity === "high",
    vibrate: severity === "critical" ? [200, 100, 200, 100, 200] : [150],
    data: {
      url: payload.url || "/",
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || "/";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === targetUrl && "focus" in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
