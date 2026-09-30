// This worker only exists to remove an older worker that cached the app shell
// and served it in place of stylesheets. It does not intercept requests.
self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));
      await self.registration.unregister();
      const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      await Promise.all(
        windows.map((client) => ("navigate" in client ? client.navigate(client.url) : undefined)),
      );
    })(),
  );
});
