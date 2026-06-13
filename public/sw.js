/* Service Worker — Sardinia NE
   App shell cache-first (versionat). /api/* = network-only (nu se cache-uiește;
   offline-ul e gestionat de localStorage în app.js). */

const CACHE_VERSION = "sardinia-ne-v1";
const SHELL = [
  "/",
  "/index.html",
  "/app.js",
  "/styles.css",
  "/manifest.webmanifest",
  "/icon.svg"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(SHELL))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // API: network-only, fără cache. Lăsăm eroarea să cadă în app (try/catch).
  if (url.pathname.startsWith("/api/")) return;

  // Doar GET-uri din aceeași origine intră în logica de cache.
  if (req.method !== "GET" || url.origin !== self.location.origin) return;

  // Navigări → servește app shell-ul din cache (offline-first), fallback rețea.
  if (req.mode === "navigate") {
    event.respondWith(
      caches.match("/index.html").then((cached) => cached || fetch(req))
    );
    return;
  }

  // Restul (asset-uri shell) → cache-first, cu completare cache la miss.
  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req).then((res) => {
        if (res && res.ok && res.type === "basic") {
          const copy = res.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(req, copy));
        }
        return res;
      });
    })
  );
});
