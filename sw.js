const CACHE='kaloriku-github-pages-v2.4.0';
const BASE=new URL('./',self.location.href);
const SHELL=['','styles.css?v=2.4.0','db.js?v=2.4.0','nutrition-tools.js?v=2.4.0','v24.js?v=2.4.0','app.js?v=2.4.0','photo.js?v=2.4.0','ai-photo.js?v=2.4.0','v14.js?v=2.4.0','v15.js?v=2.4.0','v16.js?v=2.4.0','v17.js?v=2.4.0','v20.js?v=2.4.0','data/foods-extra.json','data/foods-daily.json','data/foods-regional.json','data/foods-expanded.json','data/foods-tkpi-2017.json','data/foods-tkpi-2020.json','manifest.webmanifest','data/foods.json','icons/icon-192.png','icons/icon-512.png'].map(path=>new URL(path,BASE).toString());
const DATA_PREFIX=new URL('data/',BASE).pathname;
const HOME=new URL('',BASE).toString();
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(SHELL)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('kaloriku-github-pages-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',event=>{
 if(event.request.method!=='GET')return;
 const url=new URL(event.request.url);
 if(url.origin!==self.location.origin)return;
 if(event.request.mode==='navigate'){
  event.respondWith(fetch(event.request).then(response=>{
   if(response.ok){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(event.request,copy)).catch(()=>{});}
   return response;
  }).catch(()=>caches.match(event.request).then(r=>r||caches.match(HOME))));
  return;
 }
 if(url.pathname.startsWith(DATA_PREFIX)){
  event.respondWith(fetch(event.request).then(response=>{
   if(response.ok){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(event.request,copy)).catch(()=>{});}
   return response;
  }).catch(()=>caches.match(event.request)));
  return;
 }
 event.respondWith(caches.match(event.request).then(cached=>cached||fetch(event.request).then(response=>{
  if(response.ok){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(event.request,copy)).catch(()=>{});}
  return response;
 })));
});
