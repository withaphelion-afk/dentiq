// Dentiq service worker: caches the app shell for instant loads.
// Patient data (/api) is never cached; it always comes from the server.
const CACHE = 'dentiq-shell-v1'
const MAX_ENTRIES = 80

self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (e) => e.waitUntil(
  caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()),
))

async function put(req, res) {
  const cache = await caches.open(CACHE)
  await cache.put(req, res)
  const keys = await cache.keys()
  for (const k of keys.slice(0, Math.max(keys.length - MAX_ENTRIES, 0))) await cache.delete(k) // drop oldest assets from past deploys
}

self.addEventListener('fetch', (e) => {
  const { request } = e
  const url = new URL(request.url)
  if (request.method !== 'GET' || url.origin !== self.location.origin || url.pathname.startsWith('/api')) return

  // Pages: always try the network so a new deploy shows up; fall back to the cached shell offline
  if (request.mode === 'navigate') {
    e.respondWith(fetch(request).then((res) => { if (res.ok) put('/', res.clone()); return res }).catch(() => caches.match('/')))
    return
  }

  // Hashed build assets, icons, fonts: cache-first
  if (/^\/(assets|icons|fonts)\/|^\/favicon\.svg$/.test(url.pathname)) {
    e.respondWith(caches.match(request).then((hit) => hit || fetch(request).then((res) => { if (res.ok) put(request, res.clone()); return res })))
  }
})
