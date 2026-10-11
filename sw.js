const V = 'tenischorii-v4';   // súbelo (v5, v6…) cada vez que cambies archivos
const LOCAL = ['/', '/manifest.json', '/icon-180.png', '/icon-512.png'];
const CDN = ['https://cdn.tailwindcss.com'];

self.addEventListener('install', e => e.waitUntil((async () => {
  const c = await caches.open(V);
  await Promise.all(LOCAL.map(u => c.add(u).catch(() => {})));   // un archivo que falle no rompe la instalación
  await Promise.all(CDN.map(u => fetch(u, { mode: 'no-cors' }).then(r => c.put(u, r)).catch(() => {})));
  self.skipWaiting();
})()));

self.addEventListener('activate', e => e.waitUntil(
  caches.keys().then(k => Promise.all(k.filter(x => x !== V).map(x => caches.delete(x)))).then(() => self.clients.claim())));

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  if (req.mode === 'navigate') {   // abrir la app: internet primero; si falla o da error, se usa la copia guardada
    e.respondWith(fetch(req).then(r => {
      if (r.ok) { const cp = r.clone(); caches.open(V).then(c => c.put('/', cp)); return r; }
      return caches.match('/').then(h => h || r);
    }).catch(() => caches.match('/')));
    return;
  }
  e.respondWith(caches.match(req).then(hit => {   // resto de archivos: copia guardada al instante y se actualiza de fondo
    const net = fetch(req).then(r => {
      if (r && (r.ok || r.type === 'opaque')) { const cp = r.clone(); caches.open(V).then(c => c.put(req, cp)); }
      return r;
    }).catch(() => hit);
    return hit || net;
  }));
});
