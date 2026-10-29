// Кэширует только файлы приложения для офлайн-режима. Текст пользователя сюда не попадает.
const V='bp-v1.0',A=['./','index.html','assets/style.css','assets/tokens.css','privacy.html','assets/analyzer.js','assets/app.js','assets/icon.svg','manifest.webmanifest'];
self.addEventListener('install',e=>e.waitUntil(caches.open(V).then(c=>c.addAll(A)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==V).map(x=>caches.delete(x)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{if(e.request.method==='GET')e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request).then(x=>{if(x.ok&&new URL(e.request.url).origin===location.origin){const c=x.clone();caches.open(V).then(k=>k.put(e.request,c))}return x})))});
