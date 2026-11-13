// Wersja cache musi zgadzać się z V w index.html
const C='kanban-1.8.1';
// Pliki niezbędne: bez nich aktualizacja się nie uda (stara wersja zostaje).
const NEED=['./','index.html'];
// Pliki pomocnicze: brak któregoś (np. 404 na GitHubie) nie blokuje aktualizacji.
const OPT=['manifest.json','lang/pl.js','lang/en.js','icon-180.png','icon-192.png','icon-512.png','icon-maskable-512.png'];
self.addEventListener('install',e=>e.waitUntil(caches.open(C).then(c=>Promise.all(NEED.map(u=>c.add(u))).then(()=>Promise.allSettled(OPT.map(u=>c.add(u)))))));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C).map(x=>caches.delete(x)))).then(()=>self.clients.claim())));
self.addEventListener('message',e=>{if(e.data==='skip')self.skipWaiting()});
self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;e.respondWith(caches.match(e.request,{ignoreSearch:true}).then(r=>r||fetch(e.request)))});
