// Service Worker for Lemon Seasons Feed App
// In development (localhost / 127.0.0.1), unregister immediately and bypass all caching
const isLocalhost = Boolean(
  self.location.hostname === 'localhost' ||
  self.location.hostname === '127.0.0.1' ||
  self.location.hostname.endsWith('.local')
);

if (isLocalhost) {
  self.addEventListener('install', () => self.skipWaiting());
  self.addEventListener('activate', (event) => {
    event.waitUntil(
      caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k))))
        .then(() => self.registration.unregister())
        .then(() => self.clients.claim())
    );
  });
} else {
  const CACHE_NAME = 'lemon-seasons-v2';
  const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/manifest.json'
  ];

  self.addEventListener('install', (event) => {
    event.waitUntil(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.addAll(ASSETS_TO_CACHE);
      }).then(() => self.skipWaiting())
    );
  });

  self.addEventListener('activate', (event) => {
    event.waitUntil(
      caches.keys().then((keys) => {
        return Promise.all(
          keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
        );
      }).then(() => self.clients.claim())
    );
  });

  self.addEventListener('fetch', (event) => {
    // Only cache GET requests and non-API calls, never intercept Vite internals
    const url = event.request.url;
    if (
      event.request.method !== 'GET' ||
      url.includes('/@vite/') ||
      url.includes('/@fs/') ||
      url.includes('/node_modules/') ||
      url.includes('/api/') ||
      url.includes('/notes') ||
      url.includes('/feeds')
    ) {
      return;
    }

    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(event.request).then((networkResponse) => {
          if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
            return networkResponse;
          }
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
          return networkResponse;
        }).catch(() => {
          // Fallback to cached index.html for navigation requests
          if (event.request.mode === 'navigate') {
            return caches.match('/index.html');
          }
        });
      })
    );
  });
}
