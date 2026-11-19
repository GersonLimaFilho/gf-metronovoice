/* GF MetronoVoice: cache de versão renovável, com prioridade para rede. */
const CACHE = 'gf-metronovoice-v14-20261119';
const CORE = ['/', '/index.html', '/manifest.json'];
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(CORE)));
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key.startsWith('gf-metronovoice-') && key !== CACHE).map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', event => {
  const request = event.request;
  if(request.method !== 'GET') return;
  const url = new URL(request.url);
  if(url.origin !== self.location.origin) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    try {
      // Sempre consultar a rede primeiro: alterações no HTML e WAV não ficam presas no cache antigo.
      const response = await fetch(request, {cache:'no-store'});
      if(response.ok) await cache.put(request,response.clone());
      return response;
    } catch (err) {
      const cached = await cache.match(request);
      if(cached) return cached;
      if(request.mode === 'navigate') {
        const fallback = await cache.match('/index.html');
        if(fallback) return fallback;
      }
      return Response.error();
    }
  })());
});
