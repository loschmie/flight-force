const CACHE_NAME = 'flightforce-cache-v1';
const urlsToCache = [
  '/',
  '/check',
  '/manifest.json',
  '/icon-192x192.png',
  '/icon-512x512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  // Stale-While-Revalidate strategy for API calls could go here.
  // For now, we simply try to fetch from cache, and if it fails (offline), return cached shell.
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Return cached version if found
        if (response) {
          return response;
        }
        
        // Otherwise, fetch from network
        return fetch(event.request).catch(() => {
          // If network fetch fails (offline), fallback to home
          if (event.request.mode === 'navigate') {
            return caches.match('/');
          }
        });
      })
  );
});
