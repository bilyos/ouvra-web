/*
 * Service worker d'Ouvra : l'app reste utilisable avec une connexion faible ou coupée.
 *
 * - Fichiers de Next (/_next/static) : cache d'abord, ils ne changent jamais (noms hashés).
 * - Pages : réseau d'abord, sinon la dernière version vue, sinon la page « hors connexion ».
 * - Images : servies depuis le cache puis rafraîchies en arrière-plan (60 au plus).
 * - API, lecture seule (réservations, profil) : réseau d'abord, sinon la dernière réponse.
 *   Rien n'est gardé pour les autres appels, et tout est effacé à la déconnexion.
 */
const VERSION = 'v1';
const STATIC = `ouvra-static-${VERSION}`;
const PAGES = `ouvra-pages-${VERSION}`;
const IMAGES = `ouvra-images-${VERSION}`;
const API = `ouvra-api-${VERSION}`;
const OFFLINE_URL = '/offline';
const MAX_IMAGES = 60;

// Lectures d'API utiles hors connexion
const API_READS = [/\/api\/bookings\/mine$/, /\/api\/bookings\/received$/, /\/api\/bookings\/[0-9a-f-]{36}$/, /\/api\/me$/, /\/api\/categories$/];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(PAGES).then((c) => c.add(new Request(OFFLINE_URL, { cache: 'reload' }))));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('ouvra-') && !k.endsWith(VERSION)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', (event) => {
  // Déconnexion : on ne laisse aucune donnée personnelle sur l'appareil
  if (event.data && event.data.type === 'logout') {
    event.waitUntil(Promise.all([caches.delete(API), caches.delete(PAGES)]));
  }
});

async function trimCache(name, max) {
  const cache = await caches.open(name);
  const keys = await cache.keys();
  await Promise.all(keys.slice(0, Math.max(0, keys.length - max)).map((k) => cache.delete(k)));
}

async function networkFirst(request, cacheName, fallbackUrl) {
  const cache = await caches.open(cacheName);
  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch {
    const cached = await cache.match(request, { ignoreVary: true });
    if (cached) return cached;
    if (fallbackUrl) {
      const offline = await caches.match(fallbackUrl);
      if (offline) return offline;
    }
    return new Response(JSON.stringify({ message: 'Hors connexion' }), { status: 503, headers: { 'Content-Type': 'application/json' } });
  }
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);

  if (url.origin === self.location.origin && url.pathname.startsWith('/_next/static/')) {
    event.respondWith(caches.open(STATIC).then(async (cache) => (await cache.match(request)) || fetch(request).then((r) => (r.ok && cache.put(request, r.clone()), r))));
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request, PAGES, OFFLINE_URL));
    return;
  }

  if (request.destination === 'image') {
    event.respondWith(
      caches.open(IMAGES).then(async (cache) => {
        const cached = await cache.match(request);
        const fresh = fetch(request)
          .then((r) => {
            if (r.ok || r.type === 'opaque') cache.put(request, r.clone()).then(() => trimCache(IMAGES, MAX_IMAGES));
            return r;
          })
          .catch(() => cached);
        return cached || fresh;
      })
    );
    return;
  }

  if (API_READS.some((re) => re.test(url.pathname))) {
    event.respondWith(networkFirst(request, API));
  }
});
