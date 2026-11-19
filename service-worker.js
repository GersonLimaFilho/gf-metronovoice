const CACHE='gf-metronovoice-oficial-v6';
const APP=['/','/index.html','/manifest.json','/assets/gf-metronovoice-logo.png','/assets/icon-192.png','/assets/icon-512.png','/assets/apple-touch-icon.png','/assets/favicon-32.png','/assets/favicon-16.png',...['1','2','3','4','i','e','a'].map(k=>'/assets/vozes/'+k+'.wav')];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(APP)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(Promise.all([caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))),self.clients.claim()]))});
self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;const url=new URL(e.request.url);if(url.origin!==self.location.origin)return;
 if(e.request.mode==='navigate'||url.pathname==='/index.html'){e.respondWith(fetch(e.request).then(r=>{if(r.ok){const copy=r.clone();caches.open(CACHE).then(c=>c.put('/index.html',copy))}return r}).catch(()=>caches.match('/index.html')));return}
 e.respondWith(caches.match(e.request,{ignoreSearch:true}).then(cached=>cached||fetch(e.request).then(r=>{if(r.ok){const copy=r.clone();caches.open(CACHE).then(c=>c.put(url.pathname,copy))}return r})));
});
