const FILES=__FILES__;
const PREFIX='ai-wisdom-app|'+encodeURIComponent(self.registration.scope)+'|';
const NAME=PREFIX+'__VERSION__';
self.addEventListener('install',event=>{
 event.waitUntil(caches.open(NAME).then(cache=>cache.addAll(FILES.map(file=>new URL(file,self.registration.scope).href))).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',event=>{
 event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith(PREFIX)&&key!==NAME).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',event=>{
 const url=new URL(event.request.url);
 if(event.request.method!=='GET'||url.origin!==self.location.origin)return;
 const navigation=event.request.mode==='navigate'&&url.pathname.startsWith(new URL(self.registration.scope).pathname);
 const known=FILES.some(file=>new URL(file,self.registration.scope).pathname===url.pathname);
 if(!known&&!navigation)return;
 event.respondWith(caches.open(NAME).then(async cache=>{
  // Only our precached, same-origin build files reach this branch. Preview
  // servers may emit Vary: Origin, while module requests add an Origin header.
  const stored=known?await cache.match(url.href,{ignoreVary:true}):await cache.match(event.request);
  if(stored)return stored;
  try{return await fetch(event.request);}
  catch{return navigation?(await cache.match(new URL('index.html',self.registration.scope).href,{ignoreVary:true}))??Response.error():Response.error();}
 }));
});
