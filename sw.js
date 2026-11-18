// Wersja cache musi zgadzać się z V w index.html
const C='kanban-1.15.6';
const VER=C.replace('kanban-','');
const DIAG='kanban-diag';
// Pliki niezbędne: bez nich aktualizacja się nie uda (stara wersja zostaje).
const NEED=['./','index.html'];
// Pliki pomocnicze: brak któregoś (np. 404 na GitHubie) nie blokuje aktualizacji.
const OPT=['manifest.json','themes.js','lang/pl.js','lang/en.js','icon-180.png','icon-192.png','icon-512.png','icon-maskable-512.png'];
// GitHub Pages podaje max-age=600, więc zwykłe pobranie mogłoby zwrócić 10-minutową, starszą kopię z pamięci przeglądarki.
const fresh=u=>new Request(u,{cache:'reload'});
// Dziennik zdarzeń service workera (bez treści zadań): osobny cache, który aplikacja odczytuje w Diagnostyce.
async function dlog(c,d,l){try{const k=await caches.open(DIAG),r=await k.match('__diag.json');let a=[];try{a=r?await r.json():[]}catch(e){}a.push({t:Date.now(),l:l||'i',c,d:String(d||'').slice(0,120)});await k.put('__diag.json',new Response(JSON.stringify(a.slice(-60))))}catch(e){}}
self.addEventListener('install',e=>e.waitUntil((async()=>{
 await dlog('install-start',VER);
 const c=await caches.open(C);
 try{
  await Promise.all(NEED.map(u=>c.add(fresh(u))));
  // Kontrola spójności: pobrany index.html musi mieć ten sam numer wersji co ten plik sw.js. Inaczej instalacja się nie udaje i zostaje poprzednia wersja (próba powtórzy się przy następnym uruchomieniu).
  const t=await (await c.match('index.html')).text();
  if(!t.includes("const V='"+VER+"'"))throw new Error('index.html ma inną wersję niż sw.js');
 }catch(err){await caches.delete(C);await dlog('install-fail',err.message,'e');throw err}
 await Promise.allSettled(OPT.map(u=>c.add(fresh(u))));
 await dlog('install-ok',VER);
})()));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C&&x!==DIAG).map(x=>caches.delete(x)))).then(()=>dlog('activate',VER)).then(()=>self.clients.claim())));
self.addEventListener('message',e=>{if(e.data==='skip'){dlog('skip-waiting',VER);self.skipWaiting()}});
// Żądania z parametrem ?net idą zawsze do sieci (Diagnostyka porównuje wersję na serwerze z zainstalowaną).
self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;if(new URL(e.request.url).searchParams.has('net'))return;e.respondWith(caches.match(e.request,{ignoreSearch:true}).then(r=>r||fetch(e.request)))});
