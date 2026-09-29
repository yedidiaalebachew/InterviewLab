const CACHE_NAME = "interviewlab-shell-v2";
const APP_SHELL = ["/", "/dashboard", "/login", "/privacy", "/manifest.webmanifest"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).catch(() => undefined),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));
      await self.clients.claim();
      const windows = await self.clients.matchAll({ type: "window" });
      await Promise.all(windows.map((client) => ("navigate" in client ? client.navigate(client.url) : undefined)));
    })(),
  );
});

// Network-first for navigations. Never intercept Next assets or API calls:
// answering a stylesheet with the cached HTML shell renders the app unstyled.
self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (
    url.pathname.startsWith("/_next/") ||
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/auth/")
  ) {
    return;
  }

  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy)).catch(() => undefined);
        }
        return response;
      })
      .catch(async () => {
        if (request.mode === "navigate") {
          return (await caches.match(request)) || (await caches.match("/")) || Response.error();
        }
        return (await caches.match(request)) || Response.error();
      }),
  );
});
