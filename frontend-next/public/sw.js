// Minimal service worker for installability + basic offline resilience.
// - App shell + static assets: cache-first
// - Navigations: network-first, fall back to cached shell when offline
// - Cloudinary images: cache-first
// API POSTs are never cached; the POS keeps its own logic for those.

const CACHE = "adepa-v1";
const SHELL = ["/", "/menu"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Cloudinary images — cache-first.
  if (url.hostname === "res.cloudinary.com") {
    event.respondWith(
      caches.open(CACHE).then(async (c) => {
        const hit = await c.match(request);
        if (hit) return hit;
        const res = await fetch(request);
        c.put(request, res.clone());
        return res;
      }).catch(() => fetch(request)),
    );
    return;
  }

  // Page navigations — network-first, fall back to cache/offline.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((res) => {
          caches.open(CACHE).then((c) => c.put(request, res.clone()));
          return res;
        })
        .catch(async () => (await caches.match(request)) || (await caches.match("/")) || Response.error()),
    );
    return;
  }

  // Static assets (_next/static, fonts, svg) — cache-first.
  if (url.pathname.startsWith("/_next/static") || /\.(?:js|css|woff2?|svg|png|webp)$/.test(url.pathname)) {
    event.respondWith(
      caches.open(CACHE).then(async (c) => {
        const hit = await c.match(request);
        if (hit) return hit;
        const res = await fetch(request);
        c.put(request, res.clone());
        return res;
      }).catch(() => fetch(request)),
    );
  }
});
