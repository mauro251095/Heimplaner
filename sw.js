// ═══════════════════════════════════════════════
// HEIMPLANER – SERVICE WORKER
// Offline-fähig, cached alle App-Dateien
// ═══════════════════════════════════════════════
const CACHE = 'heimplaner-v3';
const ASSETS = [
  './index.html',
  './heimplaner-data.js',
  './heimplaner-app.js',
  './heimplaner-login.js',
  './heimplaner-sync.js',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];
 
// Install: cache assets
self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then(cache =>
      Promise.allSettled(ASSETS.map(url => cache.add(url).catch(() => {})))
    )
  );
});
 
// Activate: remove ALL old caches immediately
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});
 
// Fetch: network-first voor HTML, cache-first voor rest
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
 
  // Altijd network voor API
  if (url.hostname === 'api.anthropic.com' || url.pathname.startsWith('/.netlify/')) {
    e.respondWith(fetch(e.request));
    return;
  }
 
  // Network-first voor navigatie (HTML)
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request)
        .then(response => {
          const copy = response.clone();
          caches.open(CACHE).then(cache => cache.put(e.request, copy));
          return response;
        })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }
 
  // Cache-first voor JS/CSS/images
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(response => {
        if (!response || response.status !== 200) return response;
        const copy = response.clone();
        caches.open(CACHE).then(cache => cache.put(e.request, copy));
        return response;
      });
    })
  );
});
