const CACHE_NAME = "sdscpa-printing-lab-v5";
const APP_FILES = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./profiles.js",
  "./icon.svg",
  "./manifest.webmanifest",
  "./THIRD_PARTY_NOTICES.md",
  "./licenses/KIRI-MOTO-MIT.txt",
  "./licenses/BAMBU-STUDIO-AGPL-3.0.txt",
  "./vendor/kiri/kiri-engine.js",
  "./vendor/kiri/kiri-worker.js",
  "./vendor/kiri/kiri-pool.js",
  "./vendor/wasm/manifold.wasm",
  "./vendor/profiles/h2s-start.json",
  "./vendor/profiles/h2s-end.json",
  "./vendor/profiles/p1s.json",
];

async function cacheApplication() {
  const cache = await caches.open(CACHE_NAME);
  for (const file of APP_FILES) {
    const response = await fetch(file, { cache: "no-cache" });
    if (!response.ok) {
      throw new Error(`Could not cache ${file}. HTTP ${response.status}.`);
    }
    await cache.put(file, response);
  }
}

async function removeOldCaches() {
  const keys = await caches.keys();
  await Promise.all(keys
    .filter((key) => key.startsWith("sdscpa-printing-lab-") && key !== CACHE_NAME)
    .map((key) => caches.delete(key)));
}

self.addEventListener("install", (event) => {
  event.waitUntil(cacheApplication().then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(removeOldCaches().then(() => self.clients.claim()));
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  event.respondWith(fetch(event.request)
    .then(async (response) => {
      if (response.ok) {
        const cache = await caches.open(CACHE_NAME);
        await cache.put(event.request, response.clone());
      }
      return response;
    })
    .catch(async (error) => {
      const cached = await caches.match(event.request);
      if (cached) return cached;
      throw error;
    }));
});
