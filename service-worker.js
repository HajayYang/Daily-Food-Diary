import { PUBLIC_ASSETS } from './offline-assets.js';

// Bump for every public application update; a complete cache installs atomically.
const CACHE='daily-bites.shell.20261030.1';
const scope=self.registration.scope;
const allowed=new Set(PUBLIC_ASSETS.map(path=>new URL(path,scope).href));
self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll([...allowed].map(url=>new Request(url,{cache:'reload'})))));
});
self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    for(const name of await caches.keys())if(name.startsWith('daily-bites.shell.')&&name!==CACHE)await caches.delete(name);
    await self.clients.claim();
  })());
});
self.addEventListener('message',event=>{if(event.data?.type==='SKIP_WAITING')self.skipWaiting();});
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  const url=new URL(event.request.url);
  if(url.origin!==self.location.origin||!url.href.startsWith(scope))return;
  const clean=new URL(url);clean.search='';clean.hash='';
  const isHome=clean.href===scope||clean.href===new URL('index.html',scope).href;
  if(!isHome&&!allowed.has(clean.href))return; // Never cache APIs, photos or cloud responses.
  const asset=isHome?new URL('index.html',scope).href:clean.href;
  event.respondWith(caches.open(CACHE).then(async cache=>(await cache.match(asset))??fetch(event.request)));
});
self.addEventListener('notificationclick',event=>{
  event.notification.close();event.waitUntil((async()=>{const tabs=await self.clients.matchAll({type:'window',includeUncontrolled:true});const existing=tabs.find(client=>client.url.startsWith(scope));if(existing)await existing.focus();else await self.clients.openWindow(scope);})());
});
