const CACHE='kaloriku-github-pages-v2.12.3';
const BASE=new URL('./',self.location.href);
const SHELL=['','styles.css?v=2.12.3','db.js?v=2.12.3','nutrition-tools.js?v=2.12.3','v24.js?v=2.12.3','v27.js?v=2.12.3','v28.js?v=2.12.3','v29.js?v=2.12.3','v210.js?v=2.12.3','v212.js?v=2.12.3','app.js?v=2.12.3','photo.js?v=2.12.3','ai-photo.js?v=2.12.3','v14.js?v=2.12.3','v15.js?v=2.12.3','v16.js?v=2.12.3','v17.js?v=2.12.3','v20.js?v=2.12.3','data/foods-extra.json','data/foods-daily.json','data/foods-regional.json','data/foods-expanded.json','data/foods-tkpi-2017.json','data/foods-tkpi-2020.json','manifest.webmanifest','data/foods.json','icons/icon-192.png','icons/icon-512.png'].map(path=>new URL(path,BASE).toString());
const DATA_PREFIX=new URL('data/',BASE).pathname;
const HOME=new URL('',BASE).toString();
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(SHELL.map(url=>new Request(url,{cache:'reload'})))))});
self.addEventListener('message',event=>{if(event.data?.type==='SKIP_WAITING')self.skipWaiting();});
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
