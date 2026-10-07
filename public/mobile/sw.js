/* TrackGPS Mobile — service worker minimal (scope /mobile/).
 *
 * Tujuan: memenuhi syarat PWA installable + cache aset statis saja.
 *
 * PENTING: SW ini HANYA menangani aset statis (/_next/static, /icons,
 * /manifest.webmanifest). Navigasi, HTML, RSC, dan API dibiarkan lewat
 * jaringan apa adanya — mencegah HTML ter-cache lalu dilayani untuk request
 * modul JS (penyebab error "non-JavaScript MIME type").
 */

const CACHE = "trackgps-mobile-v3";
const PRECACHE = ["/icons/icon-192.png", "/icons/icon-512.png", "/manifest.webmanifest"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

function isStaticAsset(pathname) {
  return (
    pathname.startsWith("/_next/static/") ||
    pathname.startsWith("/icons/") ||
    pathname === "/manifest.webmanifest"
  );
}

/** Hanya cache aset non-HTML — mencegah HTML tersimpan untuk path JS/CSS. */
function isCacheable(res) {
  const ct = (res.headers.get("content-type") || "").toLowerCase();
  return (
    res.status === 200 &&
    res.type === "basic" &&
    !ct.includes("text/html") &&
    !ct.includes("application/json")
  );
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Selain aset statis: serahkan ke jaringan (tanpa cache).
  if (!isStaticAsset(url.pathname)) return;

  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req).then((res) => {
        if (isCacheable(res)) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
        }
        return res;
      });
    }),
  );
});
