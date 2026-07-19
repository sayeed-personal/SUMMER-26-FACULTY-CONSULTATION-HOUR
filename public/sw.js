const CACHE_NAME = 'brac-planner-v4';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/schedule.json',
  '/icon.svg'
];

// On installation, pre-cache core layout assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Pre-caching static assets');
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('[Service Worker] Some static assets could not be pre-cached, continuing...', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// Clean up old caches upon activation
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[Service Worker] Deleting outdated cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Intercept fetch requests
self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Skip browser extensions and non-http protocols
  if (!url.protocol.startsWith('http')) return;

  // Skip Vite local development server and HMR requests
  if (
    url.pathname.includes('vite') || 
    url.pathname.includes('hmr') || 
    url.pathname.includes('node_modules') ||
    url.port === '3001' ||
    url.search.includes('t=')
  ) {
    return;
  }

  // Caching Strategy: Stale-While-Revalidate for app assets, Network-First fallback for pages
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        // Cache successful responses
        if (
          networkResponse && 
          (networkResponse.status === 200 || networkResponse.status === 0)
        ) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch((err) => {
        console.log('[Service Worker] Fetch failed; returning cached resource if available:', url.pathname);
        // Fallback to schedule.json if it is requested but network is down
        if (url.pathname.includes('schedule.json')) {
          return caches.match('/schedule.json');
        }
        return cachedResponse;
      });

      // If it's the root path or index.html, try the network first to guarantee latest content, fallback to cached
      if (url.pathname === '/' || url.pathname === '/index.html') {
        return fetch(event.request).catch(() => cachedResponse);
      }

      // For all other resources (JS, CSS, images, JSON), return cached immediately if possible, fetch/update in background
      return cachedResponse || fetchPromise;
    })
  );
});
