const VER = '1.21.0';
const IS_TEST = /\/test(\/|$)/.test(self.registration.scope);
const C = (IS_TEST ? 'kanban-test-' : 'kanban-') + VER;
const DIAG = IS_TEST ? 'kanban-diag-test' : 'kanban-diag';
const NEED = ['./', 'index.html'];
const OPT = [
  'manifest.json', 'themes.js', 'lang/pl.js', 'lang/en.js',
  'icon-180.png', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png',
  'doodle/manifest.json', 'doodle/engine.js', 'doodle/teksty/pl.js', 'doodle/teksty/en.js'
];
const fresh = u => new Request(u, { cache: 'reload' });
const cacheRx = IS_TEST ? /^kanban-test-\d/ : /^kanban-\d/;

async function dlog(c, d, l) {
  try {
    const k = await caches.open(DIAG);
    const r = await k.match('__diag.json');
    let a = [];
    try { a = r ? await r.json() : []; } catch (e) {}
    a.push({ t: Date.now(), l: l || 'i', c, d: String(d || '').slice(0, 120) });
    await k.put('__diag.json', new Response(JSON.stringify(a.slice(-60))));
  } catch (e) {}
}

self.addEventListener('install', e => e.waitUntil((async () => {
  await dlog('install-start', VER);
  const c = await caches.open(C);
  try {
    await Promise.all(NEED.map(u => c.add(fresh(u))));
    const t = await (await c.match('index.html')).text();
    if (!t.includes("const V='" + VER + "'")) throw new Error('index.html ma inną wersję niż sw.js');
  } catch (err) {
    await caches.delete(C);
    await dlog('install-fail', err.message, 'e');
    throw err;
  }
  await Promise.allSettled(OPT.map(u => c.add(fresh(u))));
  try { // moduły doodle wymienione w manifeście (nowe pliki trafiają do cache bez zmian w tym pliku)
    const mr = await c.match('doodle/manifest.json');
    if (mr) {
      const m = await mr.json();
      const fl = [].concat(m.tla || [], m.postacie || [], m.pogoda || []).map(x => 'doodle/' + x.file);
      await Promise.allSettled(fl.map(u => c.add(fresh(u))));
    }
  } catch (e) {}
  await dlog('install-ok', VER);
})()));

self.addEventListener('activate', e => e.waitUntil(
  caches.keys()
    .then(k => Promise.all(k.filter(x => cacheRx.test(x) && x !== C).map(x => caches.delete(x))))
    .then(() => dlog('activate', VER))
    .then(() => self.clients.claim())
));

self.addEventListener('message', e => {
  if (e.data === 'skip') {
    dlog('skip-waiting', VER);
    self.skipWaiting();
  }
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  if (new URL(e.request.url).searchParams.has('net')) return;
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then(r => r || fetch(e.request)));
});
