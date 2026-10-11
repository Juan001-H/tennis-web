const V = 'tenischorii-v3';   // súbelo (v3, v4…) cada vez que cambies archivos
const LOCAL = ['./', './index.html', './manifest.json', './icon-180.png', './icon-512.png'];
const CDN = ['https://cdn.tailwindcss.com'];
self.addEventListener('install', e => e.waitUntil((async () => {
  const c = await caches.open(V);
  await c.addAll(LOCAL);
  await Promise.all(CDN.map(u => fetch(u, { mode: 'no-cors' }).then(r => c.put(u, r)).catch(() => {})));
  self.skipWaiting();
})()));
self.addEventListener('activate', e => e.waitUntil(
  caches.keys().then(k => Promise.all(k.filter(x => x !== V).map(x => caches.delete(x)))).then(() => self.clients.claim())));
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then(hit => {
    const net = fetch(e.request).then(r => {
      if (r && (r.ok || r.type === 'opaque')) { const cp = r.clone(); caches.open(V).then(c => c.put(e.request, cp)); }
      return r;
    }).catch(() => hit || caches.match('./index.html'));
    return hit || net;   // responde de caché al instante y se actualiza en segundo plano
  }));
});
