// Test dymny Tudusia: uruchamia index.html (produkcję i /test/) w jsdom i sprawdza kluczowe zachowania.
// Uruchomienie:  cd tools && npm install && node smoke.mjs
import pkg from 'jsdom';
const { JSDOM, ResourceLoader, VirtualConsole } = pkg;
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ORIGIN = 'https://example.test';
const BASE = '/tudus/';

class Loader extends ResourceLoader {
  fetch(url) {
    const u = new URL(url);
    if (!u.pathname.startsWith(BASE)) return Promise.resolve(Buffer.from(''));
    const rel = decodeURIComponent(u.pathname.slice(BASE.length)) || 'index.html';
    const f = path.join(ROOT, rel.endsWith('/') ? rel + 'index.html' : rel);
    try { return Promise.resolve(fs.readFileSync(f)); } catch { return Promise.reject(new Error('404 ' + rel)); }
  }
}

const sleep = ms => new Promise(r => setTimeout(r, ms));
const today = () => { const d = new Date(), p = n => String(n).padStart(2, '0'); return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()); };

export async function boot(sub, { ls = {}, failSet = [], failFetch = false } = {}) {
  const errors = [];
  const vc = new VirtualConsole();
  vc.on('jsdomError', e => errors.push(String(e.message || e)));
  const file = path.join(ROOT, sub, 'index.html');
  const html = fs.readFileSync(file, 'utf8');
  const dom = new JSDOM(html, {
    url: ORIGIN + BASE + (sub ? sub + '/' : ''),
    runScripts: 'dangerously', resources: new Loader(), pretendToBeVisual: true, virtualConsole: vc,
    beforeParse(w) {
      for (const [k, v] of Object.entries(ls)) w.localStorage.setItem(k, typeof v === 'string' ? v : JSON.stringify(v));
      if (failSet.length) {
        const orig = w.Storage.prototype.setItem;
        w.Storage.prototype.setItem = function (k, v) {
          if (failSet.includes(k)) { const e = new Error('quota'); e.name = 'QuotaExceededError'; throw e; }
          return orig.call(this, k, v);
        };
      }
      w.matchMedia = w.matchMedia || (() => ({ matches: false, addEventListener() {}, removeEventListener() {} }));
      w.scrollTo = () => {};
      w.fetch = u => {
        if (failFetch) return Promise.reject(new Error('offline'));
        const url = new URL(u, w.location.href), f = path.join(ROOT, decodeURIComponent(url.pathname.slice(BASE.length)));
        try { const txt = fs.readFileSync(f, 'utf8'); return Promise.resolve({ ok: true, json: () => Promise.resolve(JSON.parse(txt)), text: () => Promise.resolve(txt) }); }
        catch { return Promise.resolve({ ok: false }); }
      };
      w.URL.createObjectURL = () => 'blob:test'; w.URL.revokeObjectURL = () => {};
      const D = w.HTMLDialogElement.prototype;
      D.showModal = function () { this.setAttribute('open', ''); };
      D.close = function () { if (!this.hasAttribute('open')) return; this.removeAttribute('open'); this.dispatchEvent(new w.Event('close')); };
      w.addEventListener('error', e => errors.push('window.error: ' + (e.message || e.error)));
    },
  });
  await new Promise(r => dom.window.addEventListener('load', r));
  await sleep(1500);
  return { w: dom.window, d: dom.window.document, errors, ev: s => dom.window.eval(s) };
}

export const mkTask = (o) => ({ id: 't' + Math.random().toString(36).slice(2, 7), area: 'a1', t: 'Zad', d: '', time: '', rep: { k: 'none', days: [] }, imp: false, cnt: 1, exp: false, st: 'prog', date: today(), ...o });
export const mkState = (tasks, extra = {}) => ({ schema: 2, tasks, log: [], last: today(), reasons: [], areas: [{ id: 'a1', name: 'Prywatna', color: '#2a9d8f' }, { id: 'a2', name: 'Zawodowa', color: '#3976be' }], area: 'a1', dd: { on: false }, ...extra });

let pass = 0, fail = 0;
const ok = (c, name, info = '') => { c ? pass++ : fail++; console.log((c ? '  ok   ' : '  FAIL ') + name + (c || !info ? '' : '  → ' + info)); };
const click = (w, sel) => { const e = w.document.querySelector(sel); if (!e) throw new Error('brak elementu ' + sel); e.click(); };
const segText = d => [...d.querySelectorAll('.seg button')].map(b => b.textContent.trim());
const badges = d => [...d.querySelectorAll('#ab .ar')].map(b => b.textContent.trim());

const prodState = mkState([
  mkTask({ t: 'A', ord: 0 }), mkTask({ t: 'B', time: '09:00', ord: 1 }),
  mkTask({ t: 'C', ord: 2 }), mkTask({ t: 'D', time: '10:00', ord: 3 }),
  mkTask({ t: 'Inna lista', area: 'a2', ord: 0 }),
  mkTask({ t: 'Backlog 1', st: 'todo', po: 0 }), mkTask({ t: 'Backlog 2', st: 'todo', po: 1 }), mkTask({ t: 'Pomysł', st: 'idea', po: 0 }),
]);

console.log('\n[1] Produkcja startuje');
try {
  const a = await boot('', { ls: { 'kanban-lang': 'pl', 'kanban-v1': prodState } });
  ok(a.errors.length === 0, 'brak błędów skryptu', a.errors.join(' | '));
  ok(!!a.d.querySelector('.tabs'), 'interfejs się wyrenderował');
} catch (e) { ok(false, 'sekcja przerwana wyjątkiem', String(e.message).split('\n')[0]); }

console.log('\n[2] Test startuje i nie odpala awaryjnego ekranu');
try {
  const a = await boot('test', { ls: { 'kanban-lang': 'pl', 'kanban-v1': prodState } });
  ok(a.errors.length === 0, 'brak błędów skryptu', a.errors.join(' | '));
  ok(a.w.__APP_ALIVE === true, 'aplikacja zgłosiła, że żyje');
  ok(!a.d.getElementById('__test_rescue'), 'brak ekranu awaryjnego');
} catch (e) { ok(false, 'sekcja przerwana wyjątkiem', String(e.message).split('\n')[0]); }

console.log('\n[3] Kopia danych produkcyjnych przy pierwszym wejściu na /test/');
try {
  const a = await boot('test', { ls: { 'kanban-lang': 'pl', 'kanban-v1': prodState } });
  const t = a.w.localStorage.getItem('kanban-v1-test');
  ok(!!t, 'powstała baza testowa');
  ok(!!t && JSON.parse(t).tasks.length === prodState.tasks.length, 'baza testowa ma wszystkie zadania z produkcji');
  ok(!!a.w.localStorage.getItem('kanban-v1-test-meta'), 'zapisano datę kopii');
  ok(a.w.localStorage.getItem('kanban-v1') === JSON.stringify(prodState), 'produkcja nietknięta');
} catch (e) { ok(false, 'sekcja przerwana wyjątkiem', String(e.message).split('\n')[0]); }

console.log('\n[4] Istniejące dane testowe nie są nadpisywane przy ponownym wejściu');
try {
  const own = mkState([mkTask({ t: 'Tylko w teście' })]);
  const a = await boot('test', { ls: { 'kanban-lang': 'pl', 'kanban-v1': prodState, 'kanban-v1-test': own } });
  ok(JSON.parse(a.w.localStorage.getItem('kanban-v1-test')).tasks[0].t === 'Tylko w teście', 'dane testowe zostały');
} catch (e) { ok(false, 'sekcja przerwana wyjątkiem', String(e.message).split('\n')[0]); }

console.log('\n[5] Brak miejsca przy kopiowaniu: test nie udaje, że ma dane');
try {
  const a = await boot('test', { ls: { 'kanban-lang': 'pl', 'kanban-v1': prodState }, failSet: ['kanban-v1-test'] });
  ok(a.errors.length === 0, 'brak błędów skryptu', a.errors.join(' | '));
  const dlg = a.d.getElementById('dlg');
  ok(dlg && dlg.hasAttribute('open') && /skopiować|miejsca/i.test(dlg.textContent), 'użytkownik widzi komunikat o nieudanej kopii', dlg && dlg.textContent.slice(0, 80));
} catch (e) { ok(false, 'sekcja przerwana wyjątkiem', String(e.message).split('\n')[0]); }

console.log('\n[6] Odświeżenie kopii z produkcji (Ustawienia testu)');
try {
  const own = mkState([mkTask({ t: 'Stare testowe' })]);
  const a = await boot('test', { ls: { 'kanban-lang': 'pl', 'kanban-v1': prodState, 'kanban-v1-test': own } });
  let reloaded = false; a.ev('reloadApp=()=>{window.__reloaded=true}');
  a.ev("tab='set';render()");
  const btn = a.d.querySelector('[data-a=refreshtest]');
  ok(!!btn, 'jest przycisk odświeżenia kopii');
  if (btn) {
    btn.click();                                   // pytanie o potwierdzenie
    ok(JSON.parse(a.w.localStorage.getItem('kanban-v1-test')).tasks[0].t === 'Stare testowe', 'bez potwierdzenia nic się nie zmienia');
    a.d.querySelector('#dlg [data-o="0"]').click();
    ok(JSON.parse(a.w.localStorage.getItem('kanban-v1-test')).tasks.length === prodState.tasks.length, 'po potwierdzeniu baza testowa = produkcja');
    ok(a.w.__reloaded === true, 'aplikacja się przeładowała');
  }
} catch (e) { ok(false, 'sekcja przerwana wyjątkiem', String(e.message).split('\n')[0]); }

console.log('\n[7] Liczniki w „Dzisiaj”');
try {
  const a = await boot('test', { ls: { 'kanban-lang': 'pl', 'kanban-v1': prodState } });
  a.ev("tab='prog';render()");
  let s = segText(a.d);
  ok(/Wszystkie zadania\s*4/.test(s[0]), '„Wszystkie zadania” pokazuje 4', s[0]);
  ok(/Z godziną\s*2/.test(s[1]), '„Z godziną” pokazuje 2', s[1]);
  click(a.w, '[data-id=time]'); s = segText(a.d);
  ok(/Wszystkie zadania\s*4/.test(s[0]) && /Z godziną\s*2/.test(s[1]), 'liczniki nie zmieniają się po przełączeniu filtra', s.join(' | '));
  ok(badges(a.d)[0].endsWith('4'), 'badge listy na górze liczy wszystkie otwarte (4), nie tylko z godziną', badges(a.d).join(' | '));
  const none = mkState([mkTask({ t: 'A', ord: 0 }), mkTask({ t: 'B', ord: 1 })]);
  const b = await boot('test', { ls: { 'kanban-lang': 'pl', 'kanban-v1': none } });
  const s2 = segText(b.d);
  ok(/Z godziną\s*0/.test(s2[1]), 'bez zadań z godziną licznik pokazuje 0', s2[1]);
  const emp = await boot('test', { ls: { 'kanban-lang': 'pl', 'kanban-v1': mkState([]) } });
  const s3 = segText(emp.d);
  ok(/Wszystkie zadania\s*0/.test(s3[0]) && /Z godziną\s*0/.test(s3[1]), 'pusty dzień: oba liczniki 0', s3.join(' | '));
} catch (e) { ok(false, 'sekcja przerwana wyjątkiem', String(e.message).split('\n')[0]); }

console.log('\n[8] Liczniki w „Do zrobienia” (kontrola, że nadal działają)');
try {
  const a = await boot('test', { ls: { 'kanban-lang': 'pl', 'kanban-v1': prodState } });
  a.ev("tab='todo';render()");
  const s = segText(a.d);
  ok(/Zadania\s*2/.test(s[0]) && /Pomysły\s*1/.test(s[1]), 'Zadania 2, Pomysły 1', s.join(' | '));
} catch (e) { ok(false, 'sekcja przerwana wyjątkiem', String(e.message).split('\n')[0]); }

console.log('\n[9] Kolejność zadań nie psuje się przy filtrze „Z godziną”');
try {
  const a = await boot('test', { ls: { 'kanban-lang': 'pl', 'kanban-v1': prodState } });
  a.ev("tab='prog';pfilter='time';render()");
  const order = () => JSON.parse(a.ev("JSON.stringify(S.tasks.filter(x=>x.st==='prog'&&x.area==='a1').sort((p,q)=>p.ord-q.ord).map(x=>x.t+':'+x.ord))"));
  ok(order().join() === 'A:0,B:1,C:2,D:3', 'stan wyjściowy', order().join());
  const dId = a.ev("S.tasks.find(x=>x.t==='D').id");
  a.ev(`A.top(S.tasks.find(x=>x.id==='${dId}'))`);
  const o = order();
  ok(o.map(x => x.split(':')[0]).join('') === 'ADBC', 'D przeszło przed B, reszta bez zmian (ADBC)', o.join());
  ok(new Set(o.map(x => x.split(':')[1])).size === 4, 'wartości kolejności są unikalne', o.join());
  a.ev(`A.dn(S.tasks.find(x=>x.t==='D'))`);
  const o2 = order();
  ok(o2.map(x => x.split(':')[0]).join('') === 'ABDC', '▼ przesuwa D za następne widoczne zadanie z godziną (ABDC)', o2.join());
} catch (e) { ok(false, 'sekcja przerwana wyjątkiem', String(e.message).split('\n')[0]); }

console.log('\n[10] Interfejs angielski: liczniki i teksty po angielsku');
try {
  const a = await boot('test', { ls: { 'kanban-lang': 'en', 'kanban-v1': prodState } });
  const s = segText(a.d);
  ok(/All tasks\s*4/.test(s[0]) && /With time\s*2/.test(s[1]), 'All tasks 4 | With time 2', s.join(' | '));
} catch (e) { ok(false, 'sekcja przerwana wyjątkiem', String(e.message).split('\n')[0]); }

console.log('\n[11] Produkcja po promocji: start, liczniki i przejście do testu z Ustawień');
try {
  if (!fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8').includes('gotest')) {
    console.log('  --   pominięto: katalog główny nie ma jeszcze launchera testu (to wersja sprzed promocji)');
  } else {
    const a = await boot('', { ls: { 'kanban-lang': 'pl', 'kanban-v1': prodState } });
    ok(a.errors.length === 0, 'produkcja startuje bez błędów', a.errors.join(' | '));
    ok(a.w.__IS_TEST === false && a.d.getElementById('test-badge').style.display === 'none', 'produkcja nie jest w trybie testowym (plakietka TEST ukryta)');
    const s = segText(a.d);
    ok(/Wszystkie zadania\s*4/.test(s[0]) && /Z godziną\s*2/.test(s[1]), 'liczniki w „Dzisiaj” działają w produkcji', s.join(' | '));
    a.ev("tab='set';render()");
    const g = a.d.querySelector('[data-a=gotest]');
    ok(!!g, 'w Ustawieniach jest przycisk przejścia na test');
    if (g) {
      // pierwsze wejście: tworzy kopię; nawigację (niezaimplementowaną w jsdom) pomijamy
      const before = a.w.localStorage.getItem('kanban-v1');
      g.click();
      ok(a.w.localStorage.getItem('kanban-v1-test') === before, 'kopia w bazie testowej jest identyczna z bieżącą produkcją');
      ok(a.w.localStorage.getItem('kanban-v1') === before, 'produkcja nietknięta przez kopiowanie');
    }
    const own = mkState([mkTask({ t: 'Moje testowe' })]);
    const b = await boot('', { ls: { 'kanban-lang': 'pl', 'kanban-v1': prodState, 'kanban-v1-test': own } });
    b.ev("tab='set';render()");
    b.d.querySelector('[data-a=gotest]').click();
    const dlg = b.d.getElementById('dlg');
    ok(dlg.hasAttribute('open') && dlg.querySelectorAll('[data-o]').length === 3, 'przy istniejących danych testowych pyta: nowa kopia / kontynuuj / anuluj');
    b.d.querySelector('#dlg [data-o="1"]').click();
    ok(JSON.parse(b.w.localStorage.getItem('kanban-v1-test')).tasks[0].t === 'Moje testowe', '„Kontynuuj” nie rusza danych testowych');
    b.ev("tab='set';render()"); b.d.querySelector('[data-a=gotest]').click(); b.d.querySelector('#dlg [data-o="0"]').click();
    ok(JSON.parse(b.w.localStorage.getItem('kanban-v1-test')).tasks.length === prodState.tasks.length, '„Nowa kopia” zastępuje dane testowe produkcyjnymi');
  }
} catch (e) { ok(false, 'sekcja przerwana wyjątkiem', String(e.message).split('\n')[0]); }

// ---------- agregacja ----------
const addD = n => { const d = new Date(); d.setDate(d.getDate() + n); return today.call(null, d); };
function oldState(extra = {}) {
  const tasks = [], log = [], id = (() => { let i = 0; return () => 'x' + (++i); })();
  for (let d = -200; d <= 0; d++) {
    const date = (() => { const x = new Date(); x.setDate(x.getDate() + d); const p = n => String(n).padStart(2, '0'); return x.getFullYear() + '-' + p(x.getMonth() + 1) + '-' + p(x.getDate()); })();
    for (let k = 0; k < 2; k++) { const t = mkTask({ id: id(), t: 'Jedn ' + k, st: 'done', date }); tasks.push(t); log.push({ id: id(), tid: t.id, area: 'a1', tpl: null, title: t.t, date, res: 'done', c: 2 }); }
    const r = mkTask({ id: id(), t: 'Cykl', tpl: 'tp', st: 'closed', date }); tasks.push(r);
    if (d % 3 === 0) log.push({ id: id(), tid: r.id, area: 'a1', tpl: 'tp', title: d % 2 ? 'Bieganie' : 'Czytanie', date, res: 'fail', k: d % 2 ? 'p' : 'f', c: d % 2 ? 0 : -1, reason: d % 9 === 0 ? null : (d % 2 ? 'r1' : 'r2'), dec: 'todo' });
    else log.push({ id: id(), tid: r.id, area: 'a1', tpl: 'tp', title: 'Cykl', date, res: 'done', c: 2 });
  }
  tasks.push(mkTask({ id: 'p1', t: 'Otwarte', st: 'prog', ord: 0 }), mkTask({ id: 'td1', t: 'Backlog', st: 'todo', po: 0 }));
  return mkState(tasks, { log, reasons: [{ id: 'r1', name: 'Brak czasu' }, { id: 'r2', name: 'Zapomniałem' }], ...extra });
}
const mainText = a => a.d.getElementById('main').textContent;
const snapStat = (a, per, open = null) => { a.ev(`tab='stat';per=${per};smore=null;open=${open ? "'" + open + "'" : 'null'};render()`); return mainText(a); };
const snapDone = a => { a.ev("tab='done';render()"); return mainText(a).split('Bez przyczyny: nieudane')[0]; };
const snapAll = a => ({ p4: snapStat(a, 4), p13: snapStat(a, 13), p52: snapStat(a, 52), r1: snapStat(a, 52, 'r1'), r2: snapStat(a, 52, 'r2'), un: snapStat(a, 52, '_'), done: snapDone(a) });
const lsLen = a => a.w.localStorage.getItem('kanban-v1-test').length;
const pick = (w, sel) => w.document.querySelector(sel);

console.log('\n[12] Porządkowanie z Ustawień: pierwszy raz, z kopią; statystyki bez zmian');
try {
  const a = await boot('test', { ls: { 'kanban-lang': 'pl', 'kanban-v1': oldState() } });
  ok(a.ev('S.schema===3&&S.keep===0&&typeof S.wk==="object"'), 'migracja: schemat 3, keep=0, wk={}');
  const nLog0 = a.ev('S.log.length'), nTask0 = a.ev('S.tasks.length'), sz0 = lsLen(a), before = snapAll(a), pend0 = a.ev('pend().filter(l=>l.date>=aMon(today(),AGG_PEND)).length'), pendAll = a.ev('pend().length');
  ok(pendAll > pend0 && pend0 > 0, `dane testowe mają porażki bez przyczyny: ${pendAll} razem, ${pend0} młodszych niż 8 tygodni`);
  ok(before.p13.includes('Brak czasu') && before.r1.includes('ostatnio'), 'statystyki przed porządkowaniem mają dane (przyczyny, daty)');
  a.ev("tab='set';render()");
  ok(/Przy 3 tygodniach szczegółów zamieniłbym \d+ wpisów/.test(mainText(a)), 'przed włączeniem Ustawienia podpowiadają, ile wpisów dałoby się zagregować');
  const sel = a.d.getElementById('keepsel'); ok(!!sel && sel.value === '0', 'jest wybór „Szczegóły z ostatnich” (domyślnie: bez porządkowania)');
  sel.value = '3'; sel.dispatchEvent(new a.w.Event('change', { bubbles: true }));
  const dlg = a.d.getElementById('dlg');
  ok(dlg.hasAttribute('open') && /Uporządkować dane\?/.test(dlg.textContent), 'wybór okna otwiera podgląd z potwierdzeniem');
  ok(/Zwolnisz ok\. \d+ KB/.test(dlg.textContent), 'podgląd podaje, ile zwolni', dlg.textContent.slice(0, 160));
  ok(!!a.d.getElementById('kb1') && !a.d.getElementById('kb0'), 'pierwszy raz: dostępne tylko „Zapisz kopię i uporządkuj”');
  ok(a.ev('S.keep') === 0 && a.ev('S.log.length') === nLog0, 'do czasu potwierdzenia nic się nie zmienia');
  a.d.getElementById('kb1').click();
  ok(a.ev('!!S.lastBackup'), 'przed porządkowaniem zapisano kopię zapasową');
  ok(a.ev('S.keep') === 3 && a.ev('!!S.cmp'), 'włączono keep=3 i zapisano podsumowanie');
  ok(a.ev('S.log.length') < nLog0 / 3 && a.ev('S.tasks.length') < nTask0 / 3, `log i zadania wyraźnie mniejsze (${nLog0}→${a.ev('S.log.length')}, ${nTask0}→${a.ev('S.tasks.length')})`);
  ok(lsLen(a) < sz0 / 3, `localStorage mniejszy (${Math.round(sz0 / 1024)} → ${Math.round(lsLen(a) / 1024)} KB)`);
  const after = snapAll(a);
  ok(a.ev("pend().length==="+pend0), `lista „Bez przyczyny”: zostają tylko porażki młodsze niż 8 tygodni (${pend0})`, String(a.ev('pend().length')));
  for (const k of Object.keys(before)) ok(before[k] === after[k], `widok „${k}” identyczny przed i po`, k);
  ok(a.ev("S.tasks.some(t=>t.id==='p1')&&S.tasks.some(t=>t.id==='td1')"), 'otwarte zadania i backlog nietknięte');
  a.ev("tab='set';render()");
  ok(/Ostatnie porządkowanie/.test(mainText(a)) && /tygodnie w statystykach \d+/.test(mainText(a)), 'Ustawienia pokazują podsumowanie ostatniego porządkowania i liczniki');
  const pr = JSON.parse(a.w.localStorage.getItem('kanban-v1-test'));
  ok(pr.keep === 3 && pr.wk && Object.keys(pr.wk).length > 0, 'zmiana zapisana w bazie testowej');
  ok(JSON.parse(a.w.localStorage.getItem('kanban-v1')).log.length === nLog0, 'baza produkcyjna nietknięta (porządkowanie tylko w teście)');
} catch (e) { ok(false, 'sekcja przerwana wyjątkiem', String(e.stack || e.message).split('\n').slice(0, 3).join(' / ')); }

console.log('\n[13] Domyślnie nic się nie porządkuje (opt-in)');
try {
  const a = await boot('test', { ls: { 'kanban-lang': 'pl', 'kanban-v1': oldState({ last: '2000-01-01' }) } });
  ok(a.ev('S.keep') === 0 && a.ev('S.log.length') > 500 && Object.keys(a.ev('S.wk')).length === 0, 'start nowego dnia bez keep: dziennik i zadania bez zmian');
} catch (e) { ok(false, 'sekcja przerwana wyjątkiem', String(e.message).split('\n')[0]); }

console.log('\n[14] Automat dzienny po włączeniu: bez pytań, bez zmian w statystykach');
try {
  const base = await boot('test', { ls: { 'kanban-lang': 'pl', 'kanban-v1': oldState({ last: '2000-01-01' }) } });
  const ref = snapAll(base);
  const a = await boot('test', { ls: { 'kanban-lang': 'pl', 'kanban-v1': oldState({ last: '2000-01-01', keep: 3, cmp: { at: 1, ent: 0, tasks: 0, saved: 0 } }) } });
  ok(a.ev('S.log.length') < 200 && a.ev('S.cmp.ent') > 0, 'nowy dzień przy keep=3: zagregowano automatycznie', 'log=' + a.ev('S.log.length'));
  ok(!a.d.getElementById('dlg').hasAttribute('open'), 'automat nie otwiera żadnych okien');
  const s = snapAll(a); for (const k of Object.keys(ref)) ok(ref[k] === s[k], `widok „${k}” po automacie identyczny z danymi bez porządkowania`, k);
  const again = await boot('test', { ls: { 'kanban-lang': 'pl', 'kanban-v1': JSON.stringify(JSON.parse(a.w.localStorage.getItem('kanban-v1-test'))) } });
  ok(again.ev('S.log.length') === a.ev('S.log.length'), 'ponowny start tego samego dnia nic nie zmienia');
} catch (e) { ok(false, 'sekcja przerwana wyjątkiem', String(e.stack || e.message).split('\n').slice(0, 3).join(' / ')); }

console.log('\n[15] Anulowanie i kolejne zmiany okna');
try {
  const a = await boot('test', { ls: { 'kanban-lang': 'pl', 'kanban-v1': oldState() } });
  a.ev("tab='set';render()");
  let sel = a.d.getElementById('keepsel'); sel.value = '2'; sel.dispatchEvent(new a.w.Event('change', { bubbles: true }));
  a.d.getElementById('kx').click();
  ok(a.ev('S.keep') === 0 && a.ev('S.log.length') > 500, 'anulowanie: nic się nie zmienia');
  ok(a.d.getElementById('keepsel').value === '0', 'po anulowaniu wybór wraca do poprzedniej wartości');
  // włącz, potem zmień okno: drugi raz jest już opcja bez kopii
  sel = a.d.getElementById('keepsel'); sel.value = '4'; sel.dispatchEvent(new a.w.Event('change', { bubbles: true })); a.d.getElementById('kb1').click();
  const n4 = a.ev('S.log.length');
  sel = a.d.getElementById('keepsel'); sel.value = '2'; sel.dispatchEvent(new a.w.Event('change', { bubbles: true }));
  ok(!!a.d.getElementById('kb0') && !!a.d.getElementById('kb1'), 'przy kolejnej zmianie jest też „Uporządkuj bez kopii”');
  a.d.getElementById('kb0').click();
  ok(a.ev('S.keep') === 2 && a.ev('S.log.length') < n4, `zmniejszenie okna do 2 tygodni zagregowało więcej (${n4}→${a.ev('S.log.length')})`);
  sel = a.d.getElementById('keepsel'); sel.value = '0'; sel.dispatchEvent(new a.w.Event('change', { bubbles: true }));
  ok(a.ev('S.keep') === 0 && Object.keys(a.ev('S.wk')).length > 0, 'wyłączenie porządkowania zostawia już zagregowane statystyki');
} catch (e) { ok(false, 'sekcja przerwana wyjątkiem', String(e.stack || e.message).split('\n').slice(0, 3).join(' / ')); }

console.log('\n[16] Usunięcie przyczyny po porządkowaniu: sumy bez zmian');
try {
  const a = await boot('test', { ls: { 'kanban-lang': 'pl', 'kanban-v1': oldState({ keep: 0 }) } });
  a.ev("tab='set';render()"); const sel = a.d.getElementById('keepsel'); sel.value = '3'; sel.dispatchEvent(new a.w.Event('change', { bubbles: true })); a.d.getElementById('kb1').click();
  const tot = () => +(/Porażki i odłożenia: (\d+)/.exec(snapStat(a, 52)) || [0, -1])[1];
  const t0 = tot(), r1 = a.ev("rs().find(q=>q.id==='r1').n");
  ok(t0 > 0 && r1 > 0, `po porządkowaniu licznik użyć przyczyny uwzględnia agregaty (r1=${r1})`);
  a.ev("A.rd(null,{dataset:{id:'r1'}})");
  ok(/Użyta: \d+/.test(a.d.getElementById('dlg').textContent), 'pytanie o usunięcie podaje liczbę użyć razem z agregatami');
  a.d.querySelector('#dlg [data-o="0"]').click();
  ok(tot() === t0, 'po usunięciu przyczyny suma porażek bez zmian', `${t0} → ${tot()}`);
  ok(a.ev("!aggReasonCounts(S).r1") && !snapStat(a, 52).includes('Brak czasu'), 'przyczyny nie ma już w statystykach, a jej wpisy są w „Bez wybranej przyczyny”');
  ok(a.ev('checkData(false).filter(x=>x.c.startsWith("wk-")).length') === 0, 'kontrola spójności nie widzi problemów w agregatach');
} catch (e) { ok(false, 'sekcja przerwana wyjątkiem', String(e.stack || e.message).split('\n').slice(0, 3).join(' / ')); }

// ---------- pauza ----------
const D = n => { const d = new Date(); d.setDate(d.getDate() + n); const p = x => String(x).padStart(2, '0'); return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()); };
const PZ = (from, to, areas = null, id = 'p1') => ({ id, from: D(from), to: D(to), areas });
const tpl = (id, area = 'a1', extra = {}) => mkTask({ id, area, t: 'Cykl ' + id, st: 'todo', rep: { k: 'daily', days: [] }, date: undefined, ...extra });
function rollState(pauses) {
  return mkState([
    tpl('tpl1'), tpl('tpl2', 'a2'),
    mkTask({ id: 'dated1', t: 'Z datą wczoraj', st: 'todo', at: D(-1), date: undefined }),
    mkTask({ id: 'dated2', t: 'Z datą dziś', st: 'todo', at: D(0), date: undefined }),
    mkTask({ id: 'exo', t: 'Wygasa jednorazowe', st: 'prog', exp: true, date: D(-1), ord: 0 }),
    mkTask({ id: 'exi', t: 'Wygasa z cyklu', st: 'prog', exp: true, tpl: 'tpl1', date: D(-1), ord: 1 }),
  ], { last: D(-1), coins: 10, pauses });
}
const S_ = (a, e) => a.ev(e);

console.log('\n[17] Bez pauzy (kontrola punktu odniesienia): wygasanie karze, cykliczne i zadania z datą wchodzą');
try {
  const a = await boot('test', { ls: { 'kanban-lang': 'pl', 'kanban-v1': rollState([]) } });
  ok(S_(a, "S.log.filter(l=>l.tid==='exo'&&l.res==='fail').length") === 1 && S_(a, "S.log.filter(l=>l.tid==='exi'&&l.res==='fail').length") === 1, 'wygasłe zadania zostały zapisane jako porażki');
  ok(S_(a, 'S.coins') < 10, 'monety zostały odjęte', String(S_(a, 'S.coins')));
  ok(S_(a, "S.tasks.some(t=>t.tpl==='tpl1'&&t.st==='prog'&&t.date===today())") && S_(a, "S.tasks.some(t=>t.tpl==='tpl2'&&t.st==='prog')"), 'zadania cykliczne dodały się do Dzisiaj (obie listy)');
  ok(S_(a, "S.tasks.find(t=>t.id==='dated1').st") === 'prog' && S_(a, "S.tasks.find(t=>t.id==='dated2').st") === 'prog', 'zadania z datą weszły do Dzisiaj');
  ok(S_(a, "!S.tasks.find(t=>t.id==='dated1').late"), 'bez pauzy brak oznaczenia „po terminie” (zachowanie jak dotąd)');
} catch (e) { ok(false, 'sekcja przerwana wyjątkiem', String(e.stack || e.message).split('\n').slice(0, 3).join(' / ')); }

console.log('\n[18] W pauzie (wszystkie listy): nic nie wchodzi, nic nie karze');
try {
  const a = await boot('test', { ls: { 'kanban-lang': 'pl', 'kanban-v1': rollState([PZ(-3, 3)]) } });
  ok(S_(a, "S.tasks.filter(t=>t.tpl==='tpl1'&&t.date===today()).length") === 0 && S_(a, "S.tasks.filter(t=>t.tpl==='tpl2'&&t.st==='prog').length") === 0, 'zadania cykliczne nie dodały się');
  ok(S_(a, "S.tasks.find(t=>t.id==='dated1').st") === 'todo' && S_(a, "S.tasks.find(t=>t.id==='dated2').st") === 'todo', 'zadania z datą zostały w „Do zrobienia”');
  ok(S_(a, 'S.log.length') === 0 && S_(a, 'S.coins') === 10, 'żadnych porażek ani utraty monet');
  ok(S_(a, "S.tasks.find(t=>t.id==='exo').st") === 'prog' && S_(a, "S.tasks.find(t=>t.id==='exo').date") === D(0), 'wygasające zadanie jednorazowe przeniesione na dziś');
  ok(S_(a, "S.tasks.find(t=>t.id==='exi').st") === 'closed', 'dzienna kopia zadania cyklicznego zniknęła bez kary');
  a.ev("tab='prog';render()");
  ok(/Pauza do/.test(mainText(a)) && !!a.d.querySelector('[data-a=pzend]'), 'na ekranie „Dzisiaj” jest baner pauzy z przyciskiem „Zakończ teraz”');
  ok(!S_(a, "document.getElementById('dlg').hasAttribute('open')"), 'brak okna „Tracisz monety” po starcie');
} catch (e) { ok(false, 'sekcja przerwana wyjątkiem', String(e.stack || e.message).split('\n').slice(0, 3).join(' / ')); }

console.log('\n[19] Po zakończeniu pauzy: zadania z datą z pauzy wpadają do Dzisiaj jako „po terminie”');
try {
  const st = rollState([PZ(-4, -1)]); st.tasks.push(mkTask({ id: 'old', t: 'Sprzed pauzy', st: 'todo', at: D(-6), date: undefined }), mkTask({ id: 'dated0', t: 'Z datą w pauzie', st: 'todo', at: D(-2), date: undefined }));
  st.last = D(-1);
  const a = await boot('test', { ls: { 'kanban-lang': 'pl', 'kanban-v1': st } });
  ok(S_(a, "S.tasks.find(t=>t.id==='dated1').st") === 'prog' && S_(a, "S.tasks.find(t=>t.id==='dated0').st") === 'prog', 'oba zadania z datą z okresu pauzy są w Dzisiaj');
  ok(S_(a, "S.tasks.find(t=>t.id==='dated1').late") === D(-1) && S_(a, "S.tasks.find(t=>t.id==='dated0').late") === D(-2), 'mają zapisaną pierwotną datę (late)');
  ok(S_(a, "!S.tasks.find(t=>t.id==='old').late") && S_(a, "S.tasks.find(t=>t.id==='old').st") === 'prog', 'zadanie z datą sprzed pauzy wchodzi normalnie, bez oznaczenia');
  ok(S_(a, "S.tasks.find(t=>t.id==='dated2').st") === 'prog' && S_(a, "!S.tasks.find(t=>t.id==='dated2').late"), 'zadanie z datą na dziś wchodzi normalnie');
  ok(S_(a, "S.tasks.some(t=>t.tpl==='tpl1'&&t.st==='prog'&&t.date===today())"), 'zadania cykliczne znów się dodają');
  a.ev("tab='prog';render()");
  const tags = [...a.d.querySelectorAll('#main .tm.late')].map(x => x.textContent);
  ok(tags.length === 2 && tags.every(x => /po terminie/.test(x)), 'w Dzisiaj widać dwa znaczniki „po terminie”', tags.join(' | '));
  const order = a.ev("prog().map(x=>x.id).join()");
  ok(/^(dated0|dated1),(dated0|dated1)/.test(order), 'zadania po terminie są na górze listy', order);
  ok(!/Pauza do/.test(mainText(a)), 'baner pauzy zniknął po jej końcu');
} catch (e) { ok(false, 'sekcja przerwana wyjątkiem', String(e.stack || e.message).split('\n').slice(0, 3).join(' / ')); }

console.log('\n[20] „Zakończ teraz” w trakcie pauzy: wszystko wraca jeszcze dziś');
try {
  const st = rollState([PZ(-3, 5)]); st.last = D(0);
  const a = await boot('test', { ls: { 'kanban-lang': 'pl', 'kanban-v1': st } });
  ok(S_(a, "S.tasks.find(t=>t.id==='dated1').st") === 'todo', 'przed zakończeniem: zadanie z datą wstrzymane');
  a.ev("A.pzend(null,{dataset:{id:'p1'}})");
  ok(/Zakończyć pauzę teraz/.test(a.d.getElementById('dlg').textContent), 'jest pytanie o potwierdzenie');
  ok(S_(a, "S.tasks.find(t=>t.id==='dated1').st") === 'todo', 'bez potwierdzenia nic się nie zmienia');
  a.d.querySelector('#dlg [data-o="0"]').click();
  ok(S_(a, "S.tasks.find(t=>t.id==='dated1').st") === 'prog' && S_(a, "S.tasks.find(t=>t.id==='dated1').late") === D(-1), 'zadanie z datą z pauzy weszło od razu, jako „po terminie”');
  ok(S_(a, "S.tasks.some(t=>t.tpl==='tpl1'&&t.st==='prog'&&t.date===today())"), 'zadanie cykliczne dodało się jeszcze dziś');
  ok(S_(a, "S.pauses[0].to") === D(-1), 'pauza kończy się wczoraj (dziś już nie obowiązuje)');
  a.ev("A.pzend(null,{dataset:{id:'p1'}})"); // już zakończona: nic nie psuje
  ok(!a.errors.some(e => /pzend|TypeError/.test(e)), 'ponowne zakończenie nie rzuca błędu');
} catch (e) { ok(false, 'sekcja przerwana wyjątkiem', String(e.stack || e.message).split('\n').slice(0, 3).join(' / ')); }

console.log('\n[21] Pauza tylko dla jednej listy');
try {
  const a = await boot('test', { ls: { 'kanban-lang': 'pl', 'kanban-v1': rollState([PZ(-1, 4, ['a2'])]) } });
  ok(S_(a, "S.tasks.some(t=>t.tpl==='tpl1'&&t.st==='prog'&&t.date===today())"), 'lista a1 (bez pauzy): cykliczne dodane');
  ok(S_(a, "S.tasks.filter(t=>t.tpl==='tpl2'&&t.st==='prog').length") === 0, 'lista a2 (w pauzie): cykliczne wstrzymane');
  a.ev("tab='prog';render()"); ok(!/Pauza do/.test(mainText(a)), 'na liście a1 nie ma banera');
  a.ev("S.area='a2';tab='prog';render()"); ok(/Pauza do/.test(mainText(a)), 'na liście a2 jest baner');
} catch (e) { ok(false, 'sekcja przerwana wyjątkiem', String(e.stack || e.message).split('\n').slice(0, 3).join(' / ')); }

console.log('\n[22] Planowanie pauzy z Ustawień i przegląd zadań z datą');
try {
  const mk = () => mkState([
    mkTask({ id: 'k1', t: 'Zmień mi datę', st: 'todo', at: D(2), date: undefined }), mkTask({ id: 'k2', t: 'Zarchiwizuj mnie', st: 'todo', at: D(3), date: undefined }),
    mkTask({ id: 'k3', t: 'Usuń mi datę', st: 'todo', at: D(4), date: undefined }), mkTask({ id: 'k4', t: 'Zostaw mnie', st: 'todo', at: D(5), date: undefined }),
    mkTask({ id: 'k5', t: 'Po pauzie', st: 'todo', at: D(12), date: undefined }), mkTask({ id: 'k6', t: 'Inna lista', area: 'a2', st: 'todo', at: D(3), date: undefined }),
  ]);
  const a = await boot('test', { ls: { 'kanban-lang': 'pl', 'kanban-v1': mk() } });
  a.ev("tab='set';render()");
  ok(/Pauza/.test(mainText(a)) && !!a.d.querySelector('[data-a=pznew]'), 'w Ustawieniach jest sekcja Pauza');
  a.d.querySelector('[data-a=pznew]').click();
  const dlg = a.d.getElementById('dlg');
  ok(dlg.hasAttribute('open') && !!a.d.getElementById('pzf') && a.d.querySelectorAll('.pza').length === 2, 'formularz: daty i lista checkboxów dla obu list');
  // walidacja
  a.d.getElementById('pzt').value = D(-1); a.d.getElementById('pzg').click();
  ok(/nie może być wcześniejsza/.test(a.d.getElementById('pze').textContent) && S_(a, 'S.pauses.length') === 0, 'data końca przed początkiem: komunikat i brak zapisu');
  a.d.getElementById('pzt').value = D(6); a.d.querySelectorAll('.pza').forEach(c => { c.checked = false; }); a.d.getElementById('pzg').click();
  ok(/co najmniej jedną listę/.test(a.d.getElementById('pze').textContent) && S_(a, 'S.pauses.length') === 0, 'brak wybranej listy: komunikat i brak zapisu');
  a.d.querySelectorAll('.pza').forEach(c => { c.checked = true; }); a.d.getElementById('pzg').click();
  ok(S_(a, 'S.pauses.length') === 1 && S_(a, 'S.pauses[0].areas') === null && S_(a, 'S.pauses[0].to') === D(6), 'pauza zapisana (wszystkie listy => areas=null)');
  ok(/Zadania z datą w czasie pauzy \(5\)/.test(a.d.getElementById('dlg').textContent), 'przegląd pokazuje 5 zadań z datą w okresie (k1–k4 i k6; k5 poza zakresem)', a.d.getElementById('dlg').textContent.slice(0, 90));
  const ids = ['k1', 'k2', 'k3', 'k4', 'k6'];
  const rows = [...a.d.querySelectorAll('#dlg select')];
  ok(rows.length === 5 && rows.every(s => s.value === 'keep'), 'domyślnie każde zadanie: „Zostaw”');
  const setSel = (i, v) => { rows[i].value = v; rows[i].dispatchEvent(new a.w.Event('change', { bubbles: true })); };
  setSel(0, 'date'); ok(a.d.getElementById('hd0').style.display !== 'none', 'wybór „Zmień datę” pokazuje pole daty');
  a.d.getElementById('hd0').value = D(9); setSel(1, 'arch'); setSel(2, 'none');
  a.d.getElementById('hg').click();
  const g = id => a.ev(`(()=>{const t=S.tasks.find(x=>x.id==='${id}');return JSON.stringify({st:t.st,at:t.at||null})})()`);
  ok(g('k1') === JSON.stringify({ st: 'todo', at: D(9) }), 'zmiana daty: nowa data zapisana');
  ok(JSON.parse(g('k2')).st === 'arch', 'anulowanie: zadanie w archiwum');
  ok(g('k3') === JSON.stringify({ st: 'todo', at: null }), 'usunięcie daty: zostaje w „Do zrobienia” bez terminu');
  ok(g('k4') === JSON.stringify({ st: 'todo', at: D(5) }) && g('k5') === JSON.stringify({ st: 'todo', at: D(12) }) && JSON.parse(g('k6')).at === D(3), 'zostaw / poza zakresem / inna lista: bez zmian (k6 też „zostaw”)');
  // pauza już trwa (od dziś): zmiana zakresu pokazuje tylko nowo objęte zadania
  a.ev("tab='set';render()");
  a.d.querySelector('[data-a=pzedit]').click();
  ok(a.d.getElementById('pzf').disabled, 'rozpoczęta pauza: pole „Od” zablokowane');
  a.d.getElementById('pzt').value = D(13); a.d.getElementById('pzg').click();
  const ext = a.d.getElementById('dlg').textContent;
  ok(/Zadania z datą w czasie pauzy \(2\)/.test(ext) && /Po pauzie/.test(ext) && /Zmień mi datę/.test(ext) && !/Zostaw mnie/.test(ext), 'wydłużenie pauzy: przegląd tylko nowo objętych (k5 i przesunięte na D+9 k1), bez wcześniej przejrzanych', ext.slice(0, 120));
  a.d.getElementById('hg').click();
  // pauza tylko dla jednej listy
  const b = await boot('test', { ls: { 'kanban-lang': 'pl', 'kanban-v1': mk() } });
  b.ev("tab='set';render()"); b.d.querySelector('[data-a=pznew]').click();
  b.d.getElementById('pzt').value = D(6); b.d.querySelectorAll('.pza')[1].checked = false; b.d.getElementById('pzg').click();
  ok(JSON.stringify(b.ev('S.pauses[0].areas')) === '["a1"]', 'odznaczenie listy: pauza tylko dla pierwszej');
  ok(/Zadania z datą w czasie pauzy \(4\)/.test(b.d.getElementById('dlg').textContent), 'przegląd obejmuje tylko zadania z wybranej listy (k1–k4)');
  b.d.getElementById('hg').click();
} catch (e) { ok(false, 'sekcja przerwana wyjątkiem', String(e.stack || e.message).split('\n').slice(0, 3).join(' / ')); }

console.log('\n[23] Zaplanowana pauza w przyszłości, usuwanie, porządki w danych');
try {
  const a = await boot('test', { ls: { 'kanban-lang': 'pl', 'kanban-v1': rollState([PZ(5, 9)]) } });
  ok(S_(a, "S.tasks.some(t=>t.tpl==='tpl1'&&t.st==='prog')"), 'pauza w przyszłości nic dziś nie wstrzymuje');
  a.ev("tab='set';render()");
  ok(!!a.d.querySelector('[data-a=pzdel]') && !a.d.querySelector('[data-a=pzend]'), 'przyszła pauza ma „Usuń”, a nie „Zakończ teraz”');
  a.d.querySelector('[data-a=pzdel]').click(); ok(S_(a, 'S.pauses.length') === 0, 'usunięcie przyszłej pauzy działa');
  a.ev("S.pauses=[{id:'bad',from:'x',to:'y',areas:null},{id:'ok',from:'2026-01-01',to:'2026-01-05',areas:['a1','zz']},{id:'emp',from:'2026-01-01',to:'2026-01-05',areas:['zz']}]");
  ok(a.ev("checkData(false).some(x=>x.c==='pauses'&&x.n===3)"), 'kontrola spójności wykrywa 3 uszkodzone pauzy');
  a.ev('checkData(true)');
  ok(a.ev('S.pauses.length') === 1 && JSON.stringify(a.ev('S.pauses[0].areas')) === '["a1"]', 'naprawa usuwa uszkodzone i czyści nieistniejące listy');
  a.ev("S.pauses=[{id:'pa',from:'2026-01-01',to:'2026-01-05',areas:['a2']},{id:'pb',from:'2026-02-01',to:'2026-02-05',areas:null}]");
  a.ev("S.areas.push({id:'a3',name:'Trzecia',color:'#000'});S.pauses[0].areas=['a2','a3']");
  a.ev("A.adel(null,{dataset:{id:'a3'}})"); a.d.getElementById('ad').click();
  ok(JSON.stringify(a.ev("S.pauses.find(p=>p.id==='pa').areas")) === '["a2"]' && a.ev("S.pauses.some(p=>p.id==='pb'&&p.areas===null)"), 'usunięcie listy czyści ją z pauz, a pauza „wszystkie” zostaje');
  const old = await boot('test', { ls: { 'kanban-lang': 'pl', 'kanban-v1': { ...mkState([]), schema: 2 } } });
  ok(Array.isArray(old.ev('S.pauses')) && old.ev('S.pauses.length') === 0, 'migracja: starszy zapis dostaje pustą listę pauz');
} catch (e) { ok(false, 'sekcja przerwana wyjątkiem', String(e.stack || e.message).split('\n').slice(0, 3).join(' / ')); }

console.log('\n[24] „Zrobione”: tydzień z pauzą jest oznaczony, a porównanie wyłączone');
try {
  const log = [];
  for (let d = -20; d <= 0; d++) log.push({ id: 'l' + d, tid: 'x' + d, area: 'a1', tpl: null, title: 'Z' + d, date: D(d), res: 'done', c: 2 });
  const base = await boot('test', { ls: { 'kanban-lang': 'pl', 'kanban-v1': mkState([], { log }) } });
  base.ev("tab='done';render()");
  ok(!/stroke-dasharray/.test(base.d.getElementById('main').innerHTML) && /względem tych samych dni/.test(mainText(base)), 'bez pauzy: zwykłe słupki i porównanie z zeszłym tygodniem');
  const a = await boot('test', { ls: { 'kanban-lang': 'pl', 'kanban-v1': mkState([], { log, pauses: [PZ(-9, -8)] }) } });
  a.ev("tab='done';render()");
  const html = a.d.getElementById('main').innerHTML;
  ok((html.match(/stroke-dasharray/g) || []).length >= 1, 'tydzień z pauzą ma przerywany słupek');
  ok(/Przerywany słupek/.test(mainText(a)), 'jest legenda do przerywanego słupka');
  const w = a.ev("(()=>{const w=[];for(let o=7;o>=0;o--)w.push(cnt(o,o===0));return JSON.stringify(w)})()"), w0 = base.ev("(()=>{const w=[];for(let o=7;o>=0;o--)w.push(cnt(o,o===0));return JSON.stringify(w)})()");
  ok(w === w0, 'same liczby zrobionych nie zmieniają się przez pauzę (znaczek, a nie korekta)', w + ' vs ' + w0);
  const cur = new Date(); const thisWeekPause = await boot('test', { ls: { 'kanban-lang': 'pl', 'kanban-v1': mkState([], { log, pauses: [PZ(0, 0)] }) } });
  thisWeekPause.ev("tab='done';render()");
  ok(/Tydzień z pauzą: bez porównania/.test(mainText(thisWeekPause)) && !/względem tych samych dni/.test(mainText(thisWeekPause)), 'pauza w bieżącym tygodniu: porównanie z poprzednim znika');
} catch (e) { ok(false, 'sekcja przerwana wyjątkiem', String(e.stack || e.message).split('\n').slice(0, 3).join(' / ')); }

// ---------- doodle dnia ----------
const ddState = (extra = {}) => oldState({ created: D(-200), dd: { on: true }, ...extra });
const ddMan = JSON.parse(fs.readFileSync(path.join(ROOT, 'test/doodle/manifest.json'), 'utf8'));
const dlgOf = a => a.d.getElementById('dlg');
const ddCard = a => dlgOf(a).querySelector('.ddw');

console.log('\n[25] Doodle: po starcie pokazuje się raz dziennie, scena i tekst, znika sam');
try {
  const a = await boot('test', { ls: { 'kanban-lang': 'pl', 'kanban-v1': ddState() } });
  await sleep(800);
  ok(dlgOf(a).hasAttribute('open') && !!ddCard(a), 'po starcie otwiera się karta doodle');
  ok(!!ddCard(a) && !!ddCard(a).querySelector('svg.dd-svg') && ddCard(a).querySelectorAll('svg polygon').length > 300, 'jest scena SVG (wiele wielokątów)');
  const txt = ddCard(a) ? ddCard(a).querySelector('.ddt').textContent : '';
  ok(txt.length > 20 && !/[{}]/.test(txt), 'jest zdanie motywujące bez nierozwiniętych placeholderów', txt);
  ok(!!ddCard(a) && ddCard(a).querySelector('.ddn').textContent.length > 2, 'pod sceną jest nazwa postaci', ddCard(a) && ddCard(a).querySelector('.ddn').textContent);
  ok(a.ev('S.dd.shown') === D(0) && a.ev('S.dd.sd') === D(0), 'zapisano, że dzisiejszy doodle był pokazany');
  const sc = a.ev('S.dd.scene'); ok(sc && ddMan.tla.some(x => x.id === sc.tlo) && ddMan.postacie.some(x => x.id === sc.hero), 'zapisana scena odwołuje się do modułów z manifestu', JSON.stringify(sc));
  ok(a.ev('S.dd.recent.length') === 1 && a.ev('S.dd.seen[S.dd.scene.hero]') === 1, 'zapisano historię (ostatnie postacie) i oznaczono jako widziane');
  ok(a.errors.length === 0, 'brak błędów skryptu', a.errors.join(' | '));
  await sleep(7200);
  ok(!dlgOf(a).hasAttribute('open'), 'karta zamyka się sama po kilku sekundach');
  const b = await boot('test', { ls: { 'kanban-lang': 'pl', 'kanban-v1': ddState({ dd: { on: true, shown: D(0) } }) } });
  await sleep(800); ok(!dlgOf(b).hasAttribute('open'), 'tego samego dnia drugi raz się nie pokazuje');
  const c = await boot('test', { ls: { 'kanban-lang': 'pl', 'kanban-v1': ddState({ dd: { on: true, shown: D(-1) } }) } });
  await sleep(800); ok(dlgOf(c).hasAttribute('open') && !!ddCard(c), 'następnego dnia pokazuje się znowu');
  dlgOf(c).click(); ok(!dlgOf(c).hasAttribute('open'), 'stuknięcie w kartę zamyka ją od razu');
} catch (e) { ok(false, 'sekcja przerwana wyjątkiem', String(e.stack || e.message).split('\n').slice(0, 3).join(' / ')); }

console.log('\n[26] Doodle: powtórka w Ustawieniach i przełącznik');
try {
  const a = await boot('test', { ls: { 'kanban-lang': 'pl', 'kanban-v1': ddState({ dd: { on: false } }) } });
  await sleep(600); ok(!dlgOf(a).hasAttribute('open'), 'przy wyłączonym doodle nic nie wyskakuje');
  a.ev("tab='set';render()");
  ok(/Doodle dnia/.test(mainText(a)) && !!a.d.querySelector('[data-a=ddreplay]') && !a.d.getElementById('ddon').checked, 'w Ustawieniach jest sekcja Doodle dnia z wyłączonym przełącznikiem');
  a.d.querySelector('[data-a=ddreplay]').click(); await sleep(700);
  ok(dlgOf(a).hasAttribute('open') && !!ddCard(a), 'przycisk pokazuje doodle mimo wyłączenia automatu');
  const s1 = ddCard(a).innerHTML; ok(a.ev('S.dd.shown') === undefined, 'powtórka nie oznacza dnia jako „pokazanego”');
  dlgOf(a).click(); a.ev("tab='set';render()"); a.d.querySelector('[data-a=ddreplay]').click(); await sleep(500);
  ok(ddCard(a).innerHTML === s1, 'druga powtórka: identyczna scena i tekst jak pierwsza');
  dlgOf(a).click();
  const cb = a.d.getElementById('ddon'); cb.checked = true; cb.dispatchEvent(new a.w.Event('change', { bubbles: true }));
  ok(a.ev('S.dd.on') === true, 'przełącznik „Pokazuj raz dziennie” zapisuje ustawienie');
} catch (e) { ok(false, 'sekcja przerwana wyjątkiem', String(e.stack || e.message).split('\n').slice(0, 3).join(' / ')); }

console.log('\n[27] Doodle po oknie „Tracisz monety”, nie przed nim');
try {
  const st = ddState({ last: D(-1), coins: 10 }); st.tasks.push(mkTask({ id: 'e1', t: 'Wygasa', st: 'prog', exp: true, date: D(-1), ord: 0 }));
  const a = await boot('test', { ls: { 'kanban-lang': 'pl', 'kanban-v1': st } });
  await sleep(500);
  ok(dlgOf(a).hasAttribute('open') && !!a.d.getElementById('ok2') && !ddCard(a), 'najpierw okno z wygasłymi zadaniami, bez doodle');
  a.d.getElementById('ok2').click(); await sleep(1100);
  ok(dlgOf(a).hasAttribute('open') && !!ddCard(a), 'po zamknięciu okna pojawia się doodle');
} catch (e) { ok(false, 'sekcja przerwana wyjątkiem', String(e.stack || e.message).split('\n').slice(0, 3).join(' / ')); }

console.log('\n[28] Doodle bez dostępu do plików (offline bez cache): bez błędów i bez zaznaczania dnia');
try {
  const a = await boot('test', { ls: { 'kanban-lang': 'pl', 'kanban-v1': ddState() }, failFetch: true });
  await sleep(800);
  ok(a.errors.length === 0, 'brak błędów skryptu', a.errors.join(' | '));
  ok(!dlgOf(a).hasAttribute('open') && a.ev('S.dd.shown') === undefined, 'nic nie wyskakuje, a dzień nie jest oznaczony (spróbuje ponownie przy następnym otwarciu)');
  ok(a.ev('!!document.getElementById("main").textContent'), 'aplikacja działa normalnie');
  a.ev("tab='set';render()"); a.d.querySelector('[data-a=ddreplay]').click(); await sleep(500);
  ok(/Nie udało się wczytać doodle/.test(a.d.body.textContent), 'powtórka w Ustawieniach informuje, że nie udało się wczytać');
} catch (e) { ok(false, 'sekcja przerwana wyjątkiem', String(e.stack || e.message).split('\n').slice(0, 3).join(' / ')); }

console.log('\n[29] Doodle w pauzie i po angielsku');
try {
  const a = await boot('test', { ls: { 'kanban-lang': 'pl', 'kanban-v1': ddState({ pauses: [PZ(-2, 3)] }) } });
  await sleep(800);
  const tx = ddCard(a) ? ddCard(a).querySelector('.ddt').textContent : '';
  ok(/pauz|Odpoczyn|Czas wolny/i.test(tx) && !/[{}]/.test(tx), 'w pauzie komunikat jest o odpoczynku, bez porównań', tx);
  const e = await boot('test', { ls: { 'kanban-lang': 'en', 'kanban-v1': ddState() } });
  await sleep(800);
  const te = ddCard(e) ? ddCard(e).querySelector('.ddt').textContent : '';
  ok(te.length > 20 && !/[ąćęłńóśźż]/i.test(te) && !/Wczoraj|zadań|zadania|tydzień/i.test(te), 'po angielsku komunikat jest po angielsku', te);
  const nm = ddCard(e) ? ddCard(e).querySelector('.ddn').textContent : '';
  ok(/^(Miner|Blacksmith|Archaeologist|Angler|Reading Owl|Treasure Dwarf|Clerk with a Stamp|Postman|Builder|Sweeping Snowman)$/.test(nm), 'nazwa postaci po angielsku', nm);
  dlgOf(e).click(); e.ev("tab='set';render()");
  ok(/Doodle of the day/.test(mainText(e)) && /Show once a day/.test(mainText(e)), 'sekcja w Ustawieniach po angielsku');
} catch (e) { ok(false, 'sekcja przerwana wyjątkiem', String(e.stack || e.message).split('\n').slice(0, 3).join(' / ')); }

console.log('\n[30] Doodle: tempo animacji i ponowne zaznaczenie opcji');
try {
  const a = await boot('test', { ls: { 'kanban-lang': 'pl', 'kanban-v1': ddState({ dd: { on: true, shown: D(0) } }) } });
  ok(a.ev('S.dd.speed') === 1.6, 'domyślne tempo to ×1,6 (wolniej niż w oryginale)');
  a.ev("tab='set';render()");
  const sel = a.d.getElementById('ddspeed');
  ok(!!sel && [...sel.options].map(o => o.textContent).join() === 'Statycznie,Wolno,Normalnie,Szybko' && sel.value === '1.6', 'w Ustawieniach jest wybór tempa (Statycznie / Wolno / Normalnie / Szybko)');
  const setSpeed = v => { const s = a.d.getElementById('ddspeed'); s.value = String(v); s.dispatchEvent(new a.w.Event('change', { bubbles: true })); };
  setSpeed(2.4); await sleep(700);
  ok(a.ev('S.dd.speed') === 2.4 && dlgOf(a).hasAttribute('open') && /--dds:\s*2\.4/.test(ddCard(a).querySelector('.ddc').getAttribute('style')), 'zmiana tempa zapisuje je i od razu pokazuje podgląd z nowym tempem (×2,4)');
  dlgOf(a).click(); a.ev("tab='set';render()");
  setSpeed(0); await sleep(700);
  ok(a.ev('S.dd.speed') === 0 && ddCard(a).querySelector('.ddc').classList.contains('dd-still'), 'Statycznie: karta dostaje klasę dd-still (bez ruchu)');
  dlgOf(a).click(); a.ev("S.dd.speed=2;tab='set';render()");
  ok([...a.d.getElementById('ddspeed').options].some(o => /Własne ×2/.test(o.textContent) && o.selected), 'tempo spoza listy (np. z pracowni) jest pokazane jako „Własne”');
  // ponowne zaznaczenie opcji pokazuje doodle od razu
  a.ev("S.dd.on=true;S.dd.shown=today();tab='set';render()");
  const cb = a.d.getElementById('ddon'); cb.checked = false; cb.dispatchEvent(new a.w.Event('change', { bubbles: true })); await sleep(500);
  ok(a.ev('S.dd.on') === false && !dlgOf(a).hasAttribute('open'), 'odznaczenie wyłącza i niczego nie pokazuje');
  cb.checked = true; cb.dispatchEvent(new a.w.Event('change', { bubbles: true })); await sleep(900);
  ok(a.ev('S.dd.on') === true && dlgOf(a).hasAttribute('open') && !!ddCard(a), 'ponowne zaznaczenie od razu pokazuje doodle (nawet jeśli dziś już było)');
  ok(a.ev('S.dd.shown') === D(0), 'po takim pokazie dzień jest oznaczony jako pokazany');
} catch (e) { ok(false, 'sekcja przerwana wyjątkiem', String(e.stack || e.message).split('\n').slice(0, 3).join(' / ')); }

console.log('\n[31] Doodle: pracownia scen (tylko wersja testowa)');
try {
  const a = await boot('test', { ls: { 'kanban-lang': 'pl', 'kanban-v1': ddState({ dd: { on: false } }) } });
  a.ev("tab='set';render()");
  const b = a.d.querySelector('[data-a=ddlab]'); ok(!!b, 'w wersji testowej jest przycisk „Podgląd scen (test)”');
  b.click(); await sleep(900);
  const cnt = id => a.d.getElementById(id) ? a.d.getElementById(id).options.length : -1;
  ok(dlgOf(a).hasAttribute('open') && cnt('dlt') === ddMan.tla.length && cnt('dlh') === ddMan.postacie.length && cnt('dlw') === ddMan.pogoda.length && cnt('dle') === ddMan.wejscia.length, 'pracownia ma listy: tła, postaci, pogody i wejścia z manifestu');
  const pv = () => a.d.getElementById('ddlp');
  ok(pv().querySelectorAll('polygon').length > 300, 'od razu pokazuje scenę');
  const before = pv().innerHTML, h = a.d.getElementById('dlh'); h.value = [...h.options].map(o => o.value).find(v => v !== h.value); h.dispatchEvent(new a.w.Event('change', { bubbles: true }));
  ok(pv().innerHTML !== before, 'zmiana postaci przerysowuje scenę');
  const s = a.d.getElementById('dls'); s.value = '3'; s.dispatchEvent(new a.w.Event('change', { bubbles: true }));
  ok(/--dds:\s*3/.test(pv().getAttribute('style')) && !pv().classList.contains('dd-still'), 'tempo ×3 ustawia mnożnik na podglądzie');
  s.value = '0'; s.dispatchEvent(new a.w.Event('change', { bubbles: true }));
  ok(pv().classList.contains('dd-still'), 'tempo „Statycznie” zatrzymuje ruch na podglądzie');
  s.value = '2'; s.dispatchEvent(new a.w.Event('change', { bubbles: true }));
  a.d.getElementById('dlu').click(); ok(a.ev('S.dd.speed') === 2, '„Użyj tego tempa” zapisuje wybraną wartość jako ustawienie');
  const snap = [a.d.getElementById('dlt').value, a.d.getElementById('dlh').value, a.d.getElementById('dlw').value].join();
  let changed = false; for (let i = 0; i < 12 && !changed; i++) { a.d.getElementById('dlr').click(); changed = [a.d.getElementById('dlt').value, a.d.getElementById('dlh').value, a.d.getElementById('dlw').value].join() !== snap; }
  ok(changed && pv().querySelectorAll('polygon').length > 300, '„Losuj” zmienia kombinację i rysuje scenę');
  ok(a.ev('S.dd.shown') === undefined && a.ev('S.dd.sd') === undefined, 'pracownia nie rusza stanu „doodle dnia” (scena dnia, historia, oznaczenie pokazu)');
  a.d.getElementById('dlx').click(); ok(!dlgOf(a).hasAttribute('open'), 'przycisk „Zamknij” zamyka pracownię');
  ok(a.errors.length === 0, 'brak błędów skryptu', a.errors.join(' | '));
  // produkcja (jeśli już ma doodle): pracowni nie ma
  if (fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8').includes('ddLab')) {
    const r = await boot('', { ls: { 'kanban-lang': 'pl', 'kanban-v1': ddState({ dd: { on: false } }) } });
    r.ev("tab='set';render()"); ok(!r.d.querySelector('[data-a=ddlab]') && !!r.d.getElementById('ddspeed'), 'w produkcji jest wybór tempa, ale nie ma pracowni scen');
  }
} catch (e) { ok(false, 'sekcja przerwana wyjątkiem', String(e.stack || e.message).split('\n').slice(0, 3).join(' / ')); }

// ---------- bilans list ----------
const m0off = -((new Date().getDay() + 6) % 7); // przesunięcie dzisiejszego poniedziałku względem dziś
function balLog(a1 = { norm: 10, rec: 12 }, a2 = { norm: 4, rec: 2 }) {
  const log = []; let n = 0;
  const put = (area, off) => log.push({ id: 'b' + (++n), tid: 'bt' + n, area, tpl: null, title: 'x', date: D(off), res: 'done', c: 2 });
  for (const [area, v] of [['a1', a1], ['a2', a2]]) {
    const perDay = v.norm / 5; // pierwsze 5 dni tygodnia po norm/5 (zaokrąglenie w górę/dół)
    for (let i = 0; i < 28; i++) { const off = m0off - 35 + i, k = i % 7; if (k < 5) { const cnt = Math.floor(v.norm / 5) + (k < v.norm % 5 ? 1 : 0); for (let c = 0; c < cnt; c++) put(area, off); } }
    for (let c = 0; c < v.rec; c++) put(area, -7 + (c % 6)); // ostatnie 7 dni: -7..-2
  }
  return log;
}
const balState = (extra = {}, logArgs = []) => mkState([], { log: balLog(...logArgs), created: D(-200), ...extra });

console.log('\n[32] Bilans list: pasek na górze „Zrobione”');
try {
  const a = await boot('test', { ls: { 'kanban-lang': 'pl', 'kanban-v1': balState() } });
  a.ev("tab='done';render()");
  const card = a.d.querySelector('#main .balbar') && a.d.querySelector('#main .balbar').parentElement;
  ok(!!card && a.d.getElementById('main').firstElementChild === card, 'karta „Bilans list” jest pierwsza w „Zrobione”');
  const segs = [...a.d.querySelectorAll('.balseg')];
  ok(segs.length === 2, 'pasek ma dwa kolory (po jednym na listę)');
  ok(segs.map(s => s.style.flexGrow).join() === '120,50', 'szerokości są proporcjonalne do wskaźnika (120 i 50)', segs.map(s => s.style.flexGrow).join());
  ok(/Prywatna 120%/.test(segs[0].textContent) && /Zawodowa 50%/.test(segs[1].textContent), 'etykiety w segmentach: nazwa i procent');
  ok(/#2a9d8f|rgb\(42, 157, 143\)/i.test(segs[0].getAttribute('style')) && /color:\s*(#[0-9a-f]{6}|rgb)/i.test(segs[0].getAttribute('style')), 'segment ma kolor listy i kontrastowy kolor tekstu');
  ok(/Prywatna idzie najlepiej \(120% swojej normy\)\. Zawodowa 50%\./.test(card.textContent), 'zdanie wskazuje najlepszą listę i podaje pozostałe', card.textContent.slice(0, 160));
  ok(/Ostatnie 7 dni względem zwykłego tempa/.test(card.textContent) && !card.querySelector('.balchip'), 'podpis wyjaśnia, że to własna norma; brak plakietek, gdy obie listy są porównywalne');
  ok(a.errors.length === 0, 'brak błędów skryptu', a.errors.join(' | '));
  // pauza jednej z list
  const p = await boot('test', { ls: { 'kanban-lang': 'pl', 'kanban-v1': balState({ pauses: [PZ(-1, 3, ['a2'])] }) } });
  p.ev("tab='done';render()");
  ok(!p.d.querySelector('.balbar') && /Zawodowa: pauza/.test(p.d.querySelector('.balchip') ? p.d.querySelector('.balchips').textContent : '') && /Za mało danych, żeby porównać listy/.test(mainText(p)), 'lista w pauzie: plakietka „pauza”, brak paska i spokojny komunikat zamiast porównania');
  // mała próbka
  const f = await boot('test', { ls: { 'kanban-lang': 'pl', 'kanban-v1': balState({}, [{ norm: 10, rec: 10 }, { norm: 2, rec: 5 }]) } });
  f.ev("tab='done';render()");
  ok(!f.d.querySelector('.balbar') && /Zawodowa: za mało zadań w zwykłym tygodniu/.test(f.d.querySelector('.balchips') ? f.d.querySelector('.balchips').textContent : ''), 'lista z normą poniżej progu: plakietka z powodem, bez procentów');
  // jedna lista: bez karty
  const o = await boot('test', { ls: { 'kanban-lang': 'pl', 'kanban-v1': balState({ areas: [{ id: 'a1', name: 'Prywatna', color: '#2a9d8f' }] }) } });
  o.ev("tab='done';render()"); ok(!/Bilans list/.test(mainText(o)), 'przy jednej liście karta się nie pokazuje');
  // równo
  const e = await boot('test', { ls: { 'kanban-lang': 'pl', 'kanban-v1': balState({}, [{ norm: 10, rec: 10 }, { norm: 10, rec: 10 }]) } });
  e.ev("tab='done';render()"); ok(/Wszystko idzie równo: Prywatna 100%, Zawodowa 100% swojej normy\./.test(mainText(e)), 'oba na 100%: zdanie „idzie równo”', mainText(e).slice(0, 120));
  // angielski
  const en = await boot('test', { ls: { 'kanban-lang': 'en', 'kanban-v1': balState() } });
  en.ev("tab='done';render()");
  ok(/List balance/.test(mainText(en)) && /is doing best \(120% of its usual pace\)/.test(mainText(en)), 'po angielsku: „List balance … is doing best”', mainText(en).slice(0, 140));
} catch (e) { ok(false, 'sekcja przerwana wyjątkiem', String(e.stack || e.message).split('\n').slice(0, 3).join(' / ')); }

console.log('\n[33] Produkcja po promocji: bilans list działa także w głównej wersji');
try {
  if (!fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8').includes('balCard')) console.log('  --   pominięto: katalog główny nie ma jeszcze bilansu list');
  else {
    const r = await boot('', { ls: { 'kanban-lang': 'pl', 'kanban-v1': balState() } });
    r.ev("tab='done';render()");
    ok(r.errors.length === 0, 'produkcja: brak błędów skryptu', r.errors.join(' | '));
    ok(!!r.d.querySelector('#main .balbar') && /Prywatna idzie najlepiej \(120% swojej normy\)/.test(mainText(r)), 'produkcja: karta bilansu pokazuje najlepszą listę');
  }
} catch (e) { ok(false, 'sekcja przerwana wyjątkiem', String(e.stack || e.message).split('\n').slice(0, 3).join(' / ')); }

// ---------- Ustawienia: grupy ----------
console.log('\n[34] Ustawienia: sześć zwijanych grup, logiczny podział');
try {
  const a = await boot('test', { ls: { 'kanban-lang': 'pl', 'kanban-v1': mkState([mkTask({ t: 'x' })], { created: D(-200) }) } });
  a.ev("tab='set';render()");
  const groups = () => [...a.d.querySelectorAll('#main details.sg')];
  const g = k => a.d.querySelector(`#main details.sg[data-g=${k}]`);
  const inG = (k, sel) => !!(g(k) && g(k).querySelector(sel));
  ok(groups().map(x => x.dataset.g).join() === 'lists,coins,pause,look,data,app', 'kolejność grup: listy, monety, pauza, wygląd i język, dane, aplikacja');
  ok(groups().every(x => !x.open), 'domyślnie wszystkie grupy są zwinięte (widać spis sześciu pozycji)');
  const titles = groups().map(x => x.querySelector('summary b').textContent.trim());
  ok(titles.join('|') === 'Listy i przyczyny|Monety i sklepik|Pauza|Wygląd i język|Dane|Aplikacja i diagnostyka', 'tytuły grup', titles.join('|'));
  const subs = Object.fromEntries(groups().map(x => [x.dataset.g, x.querySelector('summary small').textContent.trim()]));
  ok(/Listy: 2 · przyczyny: \d+/.test(subs.lists) && /^\+\d+ \/ −\d+ · nagrody: \d+$/.test(subs.coins) && subs.pause === 'brak' && /Polski · doodle: (wł|wył)\./.test(subs.look) && subs.data === 'Kopii jeszcze nie robiono' && /^v1\.\d+\.\d+ \[TEST\]$/.test(subs.app), 'podtytuły streszczają stan każdej grupy bez otwierania', JSON.stringify(subs));
  // zawartość: wszystko, co dotyczy wyglądu, razem; wszystko, co dotyczy danych, razem
  ok(inG('lists', '#an2') && inG('lists', '#rn'), 'grupa „Listy i przyczyny”: dodawanie listy i przyczyny');
  ok(inG('coins', '#rd') && inG('coins', '#rf') && inG('coins', '#sn'), 'grupa „Monety i sklepik”: stawki i nowa nagroda');
  ok(inG('pause', '[data-a=pznew]'), 'grupa „Pauza”: planowanie pauzy');
  ok(inG('look', '#thsel') && inG('look', '#lg') && inG('look', '#ddon') && inG('look', '#ddspeed') && inG('look', '[data-a=ddreplay]'), 'grupa „Wygląd i język”: skórka, język, doodle i tempo animacji razem');
  ok(inG('data', '[data-a=exp]') && inG('data', '[data-a=imp]') && inG('data', '#keepsel'), 'grupa „Dane”: zapis, wczytanie kopii i porządkowanie danych razem');
  ok(inG('app', '[data-a=tab][data-tab=diag]'), 'grupa „Aplikacja i diagnostyka”: diagnostyka');
  ok(!inG('look', '[data-a=exp]') && !inG('data', '#thsel') && !inG('data', '#ddon'), 'wygląd i dane nie mieszają się nawzajem');
  ok(!g('coins').querySelector('h3') || !/Monety i sklepik/.test(g('coins').querySelector('h3').textContent), 'w grupach jednosekcyjnych nie ma zdublowanego nagłówka');
  // zachowanie przy przerysowaniu
  g('data').open = true; g('data').dispatchEvent(new a.w.Event('toggle')); 
  a.ev("render()");
  ok(g('data').open && groups().filter(x => x.open).length === 1, 'otwarta grupa zostaje otwarta po przerysowaniu, pozostałe zwinięte');
  g('look').open = true; g('look').dispatchEvent(new a.w.Event('toggle'));
  const cb = a.d.getElementById('ddon'); cb.checked = false; cb.dispatchEvent(new a.w.Event('change', { bubbles: true }));
  ok(groups().filter(x => x.open).map(x => x.dataset.g).sort().join() === 'data,look', 'zmiana ustawienia w grupie nie zwija grup (otwarte: dane i wygląd)');
  g('data').open = false; g('data').dispatchEvent(new a.w.Event('toggle')); a.ev('render()');
  ok(!g('data').open && g('look').open, 'zwinięcie grupy też jest zapamiętane');
  // wersja testowa: banner na wierzchu, poza grupami
  const first = a.d.querySelector('#main .set').firstElementChild;
  ok(first.tagName !== 'DETAILS' && !!first.querySelector('[data-a=exittest]'), 'w wersji testowej banner środowiska jest na samej górze, poza grupami');
  ok(!inG('app', '[data-a=exittest]'), 'banner testowy nie jest zdublowany w grupie aplikacji');
  ok(!!a.d.querySelector('#main details.sg[data-g=app] summary .dgd'), 'wskaźnik stanu diagnostyki jest widoczny także na zwiniętej grupie');
  // stopka poza grupami
  ok(!!a.d.querySelector('#main .set > .foot') && !a.d.querySelector('#main details .foot'), 'stopka z wersją jest pod grupami');
  // pauza i podtytuł
  a.ev("S.pauses=[{id:'pp',from:'" + D(-1) + "',to:'" + D(3) + "',areas:null}];render()");
  ok(/^trwa do /.test(g('pause').querySelector('summary small').textContent.trim()), 'trwająca pauza widoczna w podtytule grupy „Pauza”');
  a.ev("S.pauses=[{id:'pp',from:'" + D(5) + "',to:'" + D(9) + "',areas:null}];render()");
  ok(/^zaplanowana: /.test(g('pause').querySelector('summary small').textContent.trim()), 'zaplanowana pauza także');
  a.ev("S.lastBackup=Date.now();render()");
  ok(g('data').querySelector('summary small').textContent.trim() === 'Ostatnia kopia: dziś', 'podtytuł „Dane” pokazuje wiek ostatniej kopii');
  ok(a.errors.length === 0, 'brak błędów skryptu', a.errors.join(' | '));
  // angielski
  const e = await boot('test', { ls: { 'kanban-lang': 'en', 'kanban-v1': mkState([mkTask({ t: 'x' })], { created: D(-200) }) } });
  e.ev("tab='set';render()");
  const et = [...e.d.querySelectorAll('#main details.sg summary b')].map(x => x.textContent.trim()).join('|');
  ok(et === 'Lists and reasons|Coins and shop|Pause|Appearance and language|Data|App and diagnostics', 'po angielsku tytuły grup', et);
  // wersja główna (po promocji): wyrzutnia testu wewnątrz grupy aplikacji, nie na wierzchu
  if (fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8').includes('class=sgt')) {
    const r = await boot('', { ls: { 'kanban-lang': 'pl', 'kanban-v1': mkState([mkTask({ t: 'x' })], { created: D(-200) }) } });
    r.ev("tab='set';render()");
    const rf = r.d.querySelector('#main .set').firstElementChild;
    ok(rf.tagName === 'DETAILS' && !!r.d.querySelector('#main details.sg[data-g=app] [data-a=gotest]'), 'produkcja: „Środowisko testowe” jest w grupie aplikacji, a na wierzchu są grupy');
  }
} catch (e) { ok(false, 'sekcja przerwana wyjątkiem', String(e.stack || e.message).split('\n').slice(0, 3).join(' / ')); }

console.log('\n[35] Bilans list: krótka historia (dwa tygodnie) i powody w plakietkach');
try {
  const twoWeeks = (a1perDay, a2perDay, a2startOff) => { // dane od poniedziałku sprzed dwóch tygodni do wczoraj
    const log = []; let n = 0; const put = (area, off) => log.push({ id: 'h' + (++n), tid: 'ht' + n, area, tpl: null, title: 'x', date: D(off), res: 'done', c: 2 });
    for (let off = m0off - 14; off <= -1; off++) { for (let k = 0; k < a1perDay; k++) put('a1', off); if (off >= a2startOff) for (let k = 0; k < a2perDay; k++) put('a2', off); }
    return mkState([], { log, created: D(-30) });
  };
  const a = await boot('test', { ls: { 'kanban-lang': 'pl', 'kanban-v1': twoWeeks(2, 1, m0off - 14) } });
  a.ev("tab='done';render()");
  ok(!!a.d.querySelector('#main .balbar') && !/Za mało danych, żeby porównać/.test(mainText(a)), 'po dwóch tygodniach danych pasek się pokazuje (wcześniej było „za mało danych”)', mainText(a).slice(0, 120));
  ok(/Wstępnie: historia jest jeszcze krótka/.test(mainText(a)), 'z notką, że wynik jest wstępny');
  ok(a.ev("balStats(S,today()).every(x=>x.st==='ok')"), 'obie listy mają wskaźnik');
  // druga lista zaczęła dopiero w zeszłym tygodniu: powód podany w plakietce
  const b = await boot('test', { ls: { 'kanban-lang': 'pl', 'kanban-v1': twoWeeks(2, 1, m0off - 6) } });
  b.ev("tab='done';render()");
  const chip = b.d.querySelector('.balchip') ? b.d.querySelector('.balchips').textContent : '';
  ok(!b.d.querySelector('.balbar') && /Zawodowa: za mało historii \(dni sprzed ostatniego tygodnia: 0, potrzeba 5\)/.test(chip), 'lista bez historii: plakietka mówi, czego brakuje (dni historii i próg)', chip);
  ok(/Za mało danych, żeby porównać listy/.test(mainText(b)), 'a karta spokojnie mówi, że nie ma jeszcze z czym porównywać');
  // długa historia, ale mało zadań: inny powód
  const c = await boot('test', { ls: { 'kanban-lang': 'pl', 'kanban-v1': balState({}, [{ norm: 10, rec: 10 }, { norm: 2, rec: 5 }]) } });
  c.ev("tab='done';render()");
  const chip2 = c.d.querySelector('.balchips') ? c.d.querySelector('.balchips').textContent : '';
  ok(/Zawodowa: za mało zadań w zwykłym tygodniu \(2 zamiast co najmniej 3\)/.test(chip2), 'mało zadań przy długiej historii: plakietka podaje normę (2) i próg (3)', chip2);
  const en = await boot('test', { ls: { 'kanban-lang': 'en', 'kanban-v1': twoWeeks(2, 1, m0off - 6) } });
  en.ev("tab='done';render()");
  ok(/not enough history \(days before last week: 0, need 5\)/.test(en.d.querySelector('.balchips') ? en.d.querySelector('.balchips').textContent : ''), 'po angielsku plakietka też podaje powód');
} catch (e) { ok(false, 'sekcja przerwana wyjątkiem', String(e.stack || e.message).split('\n').slice(0, 3).join(' / ')); }

console.log(`\nWynik: ${pass} ok, ${fail} błędów`);
process.exit(fail ? 1 : 0);
