// ═══════════════════════════════════════════════
// HEIMPLANER – SERVICE WORKER
// Offline-fähig, cached alle App-Dateien
// ═══════════════════════════════════════════════
// Service Worker deaktiviert
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.map(k => caches.delete(k))))
    .then(() => self.clients.claim())
  );
});
self.addEventListener('fetch', e => e.respondWith(fetch(e.request)));
