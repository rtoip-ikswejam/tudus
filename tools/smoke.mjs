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

export async function boot(sub, { ls = {}, failSet = [] } = {}) {
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
      const D = w.HTMLDialogElement.prototype;
      D.showModal = function () { this.setAttribute('open', ''); };
      D.close = function () { this.removeAttribute('open'); if (this.onclose) this.onclose(); };
      w.addEventListener('error', e => errors.push('window.error: ' + (e.message || e.error)));
    },
  });
  await new Promise(r => dom.window.addEventListener('load', r));
  await sleep(1500);
  return { w: dom.window, d: dom.window.document, errors, ev: s => dom.window.eval(s) };
}

export const mkTask = (o) => ({ id: 't' + Math.random().toString(36).slice(2, 7), area: 'a1', t: 'Zad', d: '', time: '', rep: { k: 'none', days: [] }, imp: false, cnt: 1, exp: false, st: 'prog', date: today(), ...o });
export const mkState = (tasks, extra = {}) => ({ schema: 2, tasks, log: [], last: today(), reasons: [], areas: [{ id: 'a1', name: 'Prywatna', color: '#2a9d8f' }, { id: 'a2', name: 'Zawodowa', color: '#3976be' }], area: 'a1', ...extra });

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

console.log(`\nWynik: ${pass} ok, ${fail} błędów`);
process.exit(fail ? 1 : 0);
