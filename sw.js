// Versioned static-only cache. Never store learner state or third-party responses.
const VERSION='7c3c1d978c49';
const CACHE='yantu-gh-learning-camp-cache-'+VERSION;
const CORE=["app.js", "bootcamp.css", "bootcamp.js", "course.json", "icon-192.png", "icon-512.png", "index.html", "manifest.webmanifest", "share.css", "share.js", "sources.json", "style.css"];
const ALLOW=["app.js", "bootcamp.css", "bootcamp.js", "course.json", "experiments.zip", "experiments/README_\u5148\u8bfb\u6211.txt", "experiments/labs/bootcamp.py", "experiments/labs/bridges/c33.py", "experiments/labs/bridges/c34.py", "experiments/labs/bridges/c35.py", "experiments/labs/bridges/c36.py", "experiments/labs/examples/b1.py", "experiments/labs/examples/b2.py", "experiments/labs/examples/b3.py", "experiments/labs/examples/b4.py", "experiments/labs/examples/b5.py", "experiments/labs/examples/b6.py", "experiments/labs/examples/b7.py", "experiments/labs/examples/b8.py", "experiments/labs/examples/w1d1.py", "experiments/labs/examples/w1d2.py", "experiments/labs/examples/w1d3.py", "experiments/labs/examples/w1d4.py", "experiments/labs/examples/w1d5.py", "experiments/labs/examples/w1d6.py", "experiments/labs/examples/w1d7.py", "experiments/labs/examples/w2d1.py", "experiments/labs/examples/w3d2.py", "experiments/labs/examples/w4d4.py", "experiments/labs/examples/w5d2.py", "experiments/labs/examples/w6d5.py", "experiments/labs/examples/w7d3.py", "experiments/labs/examples/w8d3.py", "experiments/labs/lab.py", "experiments/labs/\u4e8c\u7ef4\u6269\u6563_\u6ce8\u91ca\u7248.py", "icon-192.png", "icon-512.png", "index.html", "manifest.webmanifest", "share.css", "share.js", "sources.json", "style.css", "release.json"];
const root=new URL('./',self.location.href);
const urlFor=name=>new URL(name,root).href;
self.addEventListener('install',event=>event.waitUntil((async()=>{
 const cache=await caches.open(CACHE);
 await cache.addAll(CORE.map(urlFor));
 // No automatic skipWaiting: existing learners explicitly choose when to update.
})()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{
 for(const name of await caches.keys())if(name.startsWith('yantu-gh-learning-camp-cache-')&&name!==CACHE)await caches.delete(name);
 await self.clients.claim();
})()));
self.addEventListener('message',event=>{
 if(event.data?.type==='ACTIVATE_UPDATE')self.skipWaiting();
});
self.addEventListener('fetch',event=>{
 const request=event.request,url=new URL(request.url);
 if(request.method!=='GET'||url.origin!==root.origin||!url.pathname.startsWith(root.pathname))return;
 const name=request.mode==='navigate'?'index.html':decodeURIComponent(url.pathname.slice(root.pathname.length));
 if(!ALLOW.includes(name))return;
 event.respondWith((async()=>{
  const cache=await caches.open(CACHE),key=urlFor(name),cached=await cache.match(key);
  if(cached)return cached;
  const response=await fetch(request);
  if(response.ok&&response.type==='basic')await cache.put(key,response.clone());
  return response;
 })());
});
