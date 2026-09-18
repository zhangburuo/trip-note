// Trip Note Service Worker - Offline Cache & Fast Launch
const CACHE_NAME = 'trip-note-cache-v39.2';
const PRECACHE_ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/main.css?v=39.2',
  './css/components.css?v=39.2',
  './css/animations.css?v=39.2',
  './js/data.js?v=39.2',
  './js/maps.js?v=39.2',
  './js/weather.js?v=39.2',
  './js/app.js?v=39.2'
];

self.addEventListener('message', event => {
  if (event.data && event.data.action === 'skipWaiting') {
    self.skipWaiting();
  }
});

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(PRECACHE_ASSETS).catch(err => {
        console.warn('Pre-cache partial fail:', err);
      });
    })
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      );
    }).then(() => self.clients.claim())
  );
});

// Network First with Cache Fallback for dynamic / Stale-While-Revalidate for local assets
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // If page navigation (HTML), try Network-First so user always gets the latest version when connected
  const isNavigation = event.request.mode === 'navigate' ||
    url.pathname.endsWith('index.html') ||
    url.pathname.endsWith('/') ||
    url.pathname.endsWith('/trip-note');

  if (isNavigation) {
    event.respondWith(
      fetch(event.request).then(networkResponse => {
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseClone));
        }
        return networkResponse;
      }).catch(() => caches.match(event.request))
    );
    return;
  }

  // If local static asset, try Stale-While-Revalidate
  if (url.origin === location.origin) {
    event.respondWith(
      caches.match(event.request).then(cachedResponse => {
        const fetchPromise = fetch(event.request).then(networkResponse => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseClone);
            });
          }
          return networkResponse;
        }).catch(() => cachedResponse);

        return cachedResponse || fetchPromise;
      })
    );
    return;
  }

  // For external resources (Google Fonts, Open-Meteo), try network first, fallback to cache
  event.respondWith(
    fetch(event.request).then(response => {
      return response;
    }).catch(() => {
      return caches.match(event.request);
    })
  );
});
