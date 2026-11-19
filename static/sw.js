const CACHE_NAME = "hues-and-cues-v11";

const PRECACHE_URLS = [
  "/",
  "/static/manifest.json?v=11",
  "/static/css/style.css?v=11",
  "/static/js/sound_fx.js?v=11",
  "/static/js/board_renderer.js?v=11",
  "/static/js/offline_engine.js?v=11",
  "/static/js/room_client.js?v=11",
  "/static/js/app.js?v=11",
  "/api/board"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_URLS).catch((err) => {
        console.warn("Pre-cache partial failure:", err);
      });
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  // Pass WebSockets through
  if (event.request.url.includes("/ws/")) {
    return;
  }

  // Network-First: always attempt network first so updates load immediately
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && event.request.method === "GET") {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
        }
        return networkResponse;
      })
      .catch(() => {
        // Fallback to cache if network fails (offline)
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) return cachedResponse;
          if (event.request.destination === "document") return caches.match("/");
        });
      })
  );
});
