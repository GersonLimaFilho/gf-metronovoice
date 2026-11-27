/* GF MetronoVoice - Beta 16 offline/updates.
   Static assets and seven official WAV files must already exist on the Vercel site.
   Never ship older voices from this ZIP: app fetches deployed official recordings. */
const PREFIX='gf-metronovoice-';
const CACHE = PREFIX + 'offline-beta42-20261127';
const ASSETS=[
 '/', '/index.html', '/manifest.json',
 '/assets/gf-metronovoice-logo.png',
 '/assets/apple-touch-icon.png', '/assets/favicon-16.png', '/assets/favicon-32.png',
 '/assets/icon-192.png','/assets/icon-512.png',
 '/assets/vozes/1.wav','/assets/vozes/2.wav','/assets/vozes/3.wav',
 '/assets/vozes/4.wav','/assets/vozes/i.wav','/assets/vozes/e.wav','/assets/vozes/a.wav'
];
// Cache other assets with version-agnostic path keys; audio requests may have query versions.
async function downloadAll(){
 const stage=PREFIX+'stage-'+Date.now();
 const cache=await caches.open(stage);
 try{
   for(const path of ASSETS){
      const r=await fetch(path+'?gf-fresh='+Date.now(),{cache:'no-store'});
      if(!r.ok||r.type==='opaque')throw Error(path+' (HTTP '+r.status+')');
      await cache.put(path,r);
   }
   const dest=await caches.open(CACHE);
   // Do not overwrite active files unless ALL resources have downloaded successfully.
   for(const path of ASSETS){const r=await cache.match(path);await dest.put(path,r)}
   await caches.delete(stage);
   return true;
 }catch(e){await caches.delete(stage);throw e}
}
self.addEventListener('install',event=>{
  // Only activate after full, successful download. Old active SW remains if download fails.
  event.waitUntil(downloadAll().then(()=>self.skipWaiting()));
});
self.addEventListener('activate',event=>{
 event.waitUntil((async()=>{
   // Preserve only the new complete offline cache for this app.
   const keys=await caches.keys();
   await Promise.all(keys.filter(k=>k.startsWith(PREFIX)&&k!==CACHE).map(k=>caches.delete(k)));
   await self.clients.claim();
 })());
});
self.addEventListener('fetch',event=>{
 const request=event.request;
 if(request.method!=='GET')return;
 const url=new URL(request.url);
 if(url.origin!==self.location.origin)return;
 // Updates explicitly bypass the offline cache.
 if(url.searchParams.has('gf-check')||url.searchParams.has('gf-fresh')){
   event.respondWith(fetch(request,{cache:'no-store'}));return;
 }
 event.respondWith((async()=>{
   const c=await caches.open(CACHE);
   const canonical=url.pathname==='/'?'/index.html':url.pathname;
   const saved=await c.match(canonical);
   // Cache-first: known complete offline package is always reliable, online/offline.
   if(saved)return saved;
   try{
     const response=await fetch(request,{cache:'no-store'});
     if(response.ok&&request.mode!=='navigate')await c.put(canonical,response.clone());
     return response;
   }catch(e){
     if(request.mode==='navigate')return (await c.match('/index.html'))||Response.error();
     return Response.error();
   }
 })());
});
self.addEventListener('message',event=>{
 const port=event.ports&&event.ports[0];
 if(!port)return;
 event.waitUntil((async()=>{
   try{
     const msg=event.data||{};
     if(msg.type==='OFFLINE_STATUS'){
       const c=await caches.open(CACHE);
       const missing=[];
       for(const path of ASSETS){if(!await c.match(path))missing.push(path)}
       port.postMessage({ok:true,ready:missing.length===0,missing});return;
     }
     if(msg.type==='PREPARE_OFFLINE'||msg.type==='APPLY_UPDATE'){
       await downloadAll();port.postMessage({ok:true,ready:true});return;
     }
     port.postMessage({ok:false,error:'Mensagem desconhecida.'});
   }catch(e){port.postMessage({ok:false,error:String(e.message||e)})}
 })());
});
