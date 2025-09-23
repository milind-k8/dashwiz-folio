const CACHE_VERSION = 'pisa-wise-v2';
const STATIC_CACHE_NAME = `static-${CACHE_VERSION}`;
const PRECACHE_URLS = [
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== STATIC_CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const request = event.request;

  const acceptsHTML = (request.headers.get('accept') || '').includes('text/html');
  const isNavigation = request.mode === 'navigate' || acceptsHTML;

  // Always prefer network for HTML/navigation to avoid stale index.html
  if (isNavigation) {
    event.respondWith(
      fetch(request).catch(() => caches.match('/index.html'))
    );
    return;
  }

  // For same-origin requests, try cache, then network, and update cache
  const requestUrl = new URL(request.url);
  if (requestUrl.origin === self.location.origin) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) {
          // Update cache in background
          fetch(request).then((response) => {
            const responseClone = response.clone();
            caches.open(STATIC_CACHE_NAME).then((cache) => cache.put(request, responseClone));
          }).catch(() => {});
          return cached;
        }
        return fetch(request).then((response) => {
          const responseClone = response.clone();
          caches.open(STATIC_CACHE_NAME).then((cache) => cache.put(request, responseClone));
          return response;
        });
      })
    );
  }
});