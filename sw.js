// Wersja cache musi zgadzać się z V w index.html
const C='kanban-1.12.0';
const VER=C.replace('kanban-','');
// Pliki niezbędne: bez nich aktualizacja się nie uda (stara wersja zostaje).
const NEED=['./','index.html'];
// Pliki pomocnicze: brak któregoś (np. 404 na GitHubie) nie blokuje aktualizacji.
const OPT=['manifest.json','lang/pl.js','lang/en.js','icon-180.png','icon-192.png','icon-512.png','icon-maskable-512.png'];
// GitHub Pages podaje max-age=600, więc zwykłe pobranie mogłoby zwrócić 10-minutową, starszą kopię z pamięci przeglądarki.
const fresh=u=>new Request(u,{cache:'reload'});
self.addEventListener('install',e=>e.waitUntil((async()=>{
 const c=await caches.open(C);
 try{
  await Promise.all(NEED.map(u=>c.add(fresh(u))));
  // Kontrola spójności: pobrany index.html musi mieć ten sam numer wersji co ten plik sw.js. Inaczej instalacja się nie udaje i zostaje poprzednia wersja (próba powtórzy się przy następnym uruchomieniu).
  const t=await (await c.match('index.html')).text();
  if(!t.includes("const V='"+VER+"'"))throw new Error('index.html ma inną wersję niż sw.js');
 }catch(err){await caches.delete(C);throw err}
 await Promise.allSettled(OPT.map(u=>c.add(fresh(u))));
})()));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C).map(x=>caches.delete(x)))).then(()=>self.clients.claim())));
self.addEventListener('message',e=>{if(e.data==='skip')self.skipWaiting()});
self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;e.respondWith(caches.match(e.request,{ignoreSearch:true}).then(r=>r||fetch(e.request)))});
