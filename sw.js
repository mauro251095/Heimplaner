// Service Worker der App. heimplaner-pwa.js registriert './sw.js' relativ zur
// Seite - diese Datei muss deshalb neben index.html liegen.
//
// Kein Caching, bewusst: reine Netz-Durchreiche, damit ein Deploy sofort
// sichtbar ist und kein Gerät auf einer alten Fassung sitzen bleibt.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});
self.addEventListener('fetch', e => e.respondWith(fetch(e.request)));

self.addEventListener('push', e => {
  let data = { title: 'Heimplaner', body: '' };
  try { data = { ...data, ...e.data.json() }; } catch (err) {}
  e.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body || '',
      icon: 'icon-192.png',
      badge: 'icon-192.png',
      tag: data.tag,
      renotify: true
    })
  );
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
      for (const c of clients) { if ('focus' in c) return c.focus(); }
      if (self.clients.openWindow) return self.clients.openWindow('./');
    })
  );
});
