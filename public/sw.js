/* Service Worker — Sardinia NE (robust offline)
   - App shell: cache-first (instant + merge pe semnal prost), refresh în fundal.
   - Asset-uri: stale-while-revalidate.
   - /api/*: network-only (offline-ul e gestionat de localStorage în app.js).
   - Instalare tolerantă: dacă o resursă pică, restul tot se cache-uiesc. */

const CACHE = "sardinia-ne-v4";
// NU includem "/" — pe Cloudflare Pages face 308 → "/", iar un
// răspuns redirecționat nu poate fi pus în cache (ar fi eșuat instalarea).
const SHELL = [
  "/",
  "/app.js",
  "/styles.css",
  "/manifest.webmanifest",
  "/icon.svg"
];

const OFFLINE_HTML =
  '<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
  '<title>Sardinia NE</title>' +
  '<body style="font-family:system-ui;background:#FBF7F0;color:#1F2933;margin:0;display:grid;place-items:center;height:100vh;text-align:center;padding:24px">' +
  '<div><div style="font-size:42px">🏖️</div><h2 style="color:#0E7C86;margin:.4em 0">Offline o clipă</h2>' +
  '<p style="color:#5B6770">Nu e semnal acum. Trage de pagină să reîncerci — bifele tale sunt salvate local.</p>' +
  '<button onclick="location.reload()" style="margin-top:8px;border:none;background:#0E7C86;color:#fff;font-weight:700;padding:12px 18px;border-radius:12px;font-size:1rem">Reîncearcă</button></div></body>';

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    // cache fiecare resursă individual — o eroare nu anulează tot
    await Promise.allSettled(SHELL.map((u) => cache.add(new Request(u, { cache: "reload" }))));
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

async function putInCache(req, res) {
  try { const c = await caches.open(CACHE); await c.put(req, res); } catch { /* ignore */ }
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  let url;
  try { url = new URL(req.url); } catch { return; }
  if (url.origin !== self.location.origin) return;

  // API: network-only, fără cache (app.js are fallback pe localStorage)
  if (url.pathname.startsWith("/api/")) return;

  // Navigări → shell cache-first (offline-proof), refresh în fundal, fallback offline
  if (req.mode === "navigate") {
    event.respondWith((async () => {
      const cached = await caches.match("/");
      if (cached) {
        event.waitUntil((async () => {
          try { const fresh = await fetch(req); if (fresh && fresh.ok) await putInCache("/", fresh.clone()); } catch { /* offline */ }
        })());
        return cached;
      }
      try {
        const res = await fetch(req);
        if (res && res.ok) putInCache("/", res.clone());
        return res;
      } catch {
        return new Response(OFFLINE_HTML, { headers: { "Content-Type": "text/html; charset=utf-8" } });
      }
    })());
    return;
  }

  // Asset-uri → stale-while-revalidate
  event.respondWith((async () => {
    const cached = await caches.match(req);
    const network = fetch(req).then((res) => {
      if (res && res.ok && res.type === "basic") putInCache(req, res.clone());
      return res;
    }).catch(() => null);
    return cached || (await network) || new Response("", { status: 504 });
  })());
});
