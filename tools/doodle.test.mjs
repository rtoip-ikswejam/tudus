// Testy doodle dnia: logika komunikatów i wyboru sceny (blok DOODLE w index.html), teksty, moduły scen.
// Uruchomienie:  cd tools && npm install && node doodle.test.mjs
process.env.TZ = 'Europe/Warsaw';
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pkg from 'jsdom';
const { JSDOM } = pkg;

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
let pass = 0, fail = 0;
const ok = (c, name, info = '') => { c ? pass++ : fail++; console.log((c ? '  ok   ' : '  FAIL ') + name + (c || !info ? '' : '  → ' + info)); };

function loadLogic(file) {
  const src = fs.readFileSync(path.join(ROOT, file), 'utf8');
  const bl = n => (src.match(new RegExp('/\\* ' + n + '-BEGIN[\\s\\S]*?/\\* ' + n + '-END \\*/')) || [null])[0];
  const [a, p, d] = [bl('AGG'), bl('PAUSE'), bl('DOODLE')];
  if (!a || !p || !d) return null;
  return new Function(a + p + d + '\nreturn{aAdd,aMon,aggTry,ddStats,ddOpts,ddMsg,ddScene,ddHash,ddRng};')();
}

const TD = '2026-11-18'; // środa
const addDays = (s, n) => { const [y, m, d] = s.split('-').map(Number); const x = new Date(y, m - 1, d, 12); x.setDate(x.getDate() + n); return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0'); };
let uid = 0;
const done = (date, area = 'a1', n = 1) => Array.from({ length: n }, () => ({ id: 'l' + (++uid), tid: 't' + uid, area, title: 'x', date, res: 'done', c: 2 }));
// stan: dla każdego z 28 dni sprzed zeszłego poniedziałku po `perDay` zadań, plus wybrane dni
function mk({ perDay = 5, y = 7, d = 5, thisWeek = 0, w1 = null, pauses = [], areas = ['a1'], created = addDays(TD, -90), extra = [] } = {}) {
  const log = [];
  const mon = (() => { const x = new Date(TD + 'T12:00:00'); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0'); })();
  for (let i = 1; i <= 35; i++) { const dt = addDays(mon, -i); log.push(...done(dt, 'a1', perDay)); }
  // dni „wczoraj” i „przedwczoraj” (TD = środa: wtorek i poniedziałek bieżącego tygodnia)
  log.push(...done(addDays(TD, -1), 'a1', y), ...done(addDays(TD, -2), 'a1', d), ...extra);
  return { areas: areas.map(id => ({ id })), tasks: [], log, wk: {}, pauses, created };
}

const L = loadLogic('test/index.html');
if (!L) { console.log('Brak bloków AGG/PAUSE/DOODLE w test/index.html'); process.exit(1); }

console.log('\n=== Statystyki i warunki A/B/C ===');
{
  const s = mk({ y: 7, d: 5 });
  const st = L.ddStats(s, TD);
  ok(st.y === 7 && st.d === 5, 'wczoraj i przedwczoraj liczone z dziennika', JSON.stringify([st.y, st.d]));
  ok(Math.abs(st.avg - 5) < 1e-9 && st.w1 === 35 && st.w2 === 35, 'średnia z 4 pełnych tygodni = 5/dzień, tygodnie po 35');
  const opts = L.ddOpts(st).map(o => o[0].t).join();
  ok(opts === 'A,C2', 'A (wczoraj 7 > 5) i C2 (7 ≥ średnia 5); B nie, bo tygodnie równe', opts);
  const s2 = mk({ y: 3, d: 5 }); const o2 = L.ddOpts(L.ddStats(s2, TD));
  ok(o2.length === 1 && o2[0][0].t === 'C', 'wczoraj 3 < 5: tylko C (A nie zachodzi)');
  ok(o2[0][0].p.y === 3 && o2[0][0].p.a === 5 && o2[0][0].p.n === 2, 'C: do średniej brakuje 2', JSON.stringify(o2[0][0].p));
  ok(L.ddOpts(L.ddStats(mk({ y: 0, d: 5 }), TD))[0][0].t === 'C0' && L.ddOpts(L.ddStats(mk({ y: 0, d: 5 }), TD))[0][0].p.n === 3, 'wczoraj 0: C0, na start 3 (średnia 5 ograniczona do 3)');
  ok(L.ddOpts(L.ddStats(mk({ y: 5, d: 5 }), TD)).map(o => o[0].t).join() === 'C2', 'wczoraj = przedwczoraj: bez A');
  const n1 = L.ddOpts(L.ddStats(mk({ y: 4, d: 9 }), TD))[0][0].p.n, n2 = L.ddOpts(L.ddStats(mk({ y: 1, d: 9 }), TD))[0][0].p.n;
  ok(n1 === 1 && n2 === 3, 'liczba „o ile więcej” rośnie z luką, ale nie przekracza 3', n1 + ',' + n2);
  const big = L.ddOpts(L.ddStats(mk({ perDay: 20, y: 20, d: 30 }), TD))[0][0].p.n;
  ok(big >= 1 && big <= 3, 'przy dużej średniej zachęta nadal mieści się w 1–3', String(big));
  // B: tydzień lepszy od poprzedniego
  const log = []; const mon = L.aMon(TD);
  for (let i = 1; i <= 7; i++) log.push(...done(addDays(mon, -i), 'a1', 6));       // zeszły tydzień: 42
  for (let i = 8; i <= 14; i++) log.push(...done(addDays(mon, -i), 'a1', 4));      // tydzień wcześniej: 28
  const sb = { areas: [{ id: 'a1' }], log, wk: {}, pauses: [], tasks: [], created: addDays(TD, -90) };
  const ob = L.ddOpts(L.ddStats(sb, TD));
  ok(ob.some(o => o[0].t === 'B' && o[0].p.w1 === 42 && o[0].p.w2 === 28 && o[0].p.x === 14), 'B: zeszły tydzień 42 > 28, różnica 14', JSON.stringify(ob.map(o => o[0])));
}

console.log('\n=== Pauza i nowy użytkownik ===');
{
  const td = TD, P1 = (f, t, a = null) => ({ id: 'p', from: addDays(td, f), to: addDays(td, t), areas: a });
  let m = L.ddMsg(mk({ pauses: [P1(-2, 3)] }), TD);
  ok(m.t === 'P' && m.p.to === addDays(TD, 3), 'pauza dla wszystkich list dziś: komunikat P z datą końca');
  m = L.ddMsg(mk({ pauses: [P1(-5, -1)] }), TD);
  ok(m.t === 'R', 'pauza skończyła się wczoraj: „witaj z powrotem” (R)');
  m = L.ddMsg(mk({ areas: ['a1', 'a2'], pauses: [P1(-2, 3, ['a2'])] }), TD);
  ok(m.t !== 'P' && m.t !== 'R', 'pauza tylko jednej z dwóch list: normalny komunikat');
  const stp = L.ddStats(mk({ y: 9, d: 2, areas: ['a1', 'a2'], pauses: [P1(-2, 3, ['a2'])] }), TD);
  ok(stp.yP === true && !L.ddOpts(stp).some(o => o[0].t === 'A'), 'dzień objęty pauzą (nawet częściowo) wyłącza porównanie dnia (A)');
  const stw = L.ddStats(mk({ pauses: [P1(-10, -9)] }), TD);
  ok(stw.wP === true && !L.ddOpts(stw).some(o => o[0].t === 'B'), 'pauza w zeszłym lub poprzednim tygodniu wyłącza porównanie tygodni (B)');
  const sp = mk({ pauses: [P1(-20, -14)] }); sp.log = sp.log.filter(l => !(l.date >= addDays(TD, -20) && l.date <= addDays(TD, -14))); // w pauzie nic się nie robi
  const st2 = L.ddStats(sp, TD);
  ok(st2.avg > 0 && Math.abs(st2.avg - 5) < 1e-9, 'dni pauzy nie zaniżają średniej (dzielnik pomniejszony o dni pauzy)', String(st2.avg));
  ok(L.ddStats(mk({ pauses: [P1(-27, -1)] }), TD).avg === 0, 'prawie cały okres w pauzie: brak średniej (0), zamiast zgadywania');
  ok(L.ddMsg({ areas: [{ id: 'a1' }], log: [], wk: {}, pauses: [], tasks: [], created: TD }, TD).t === 'N', 'zupełnie nowy użytkownik: N');
  ok(L.ddMsg(mk({ created: addDays(TD, -1) }), TD).t === 'N', 'dane są, ale konto z wczoraj: N');
  ok(L.ddMsg(mk({}), TD).t !== 'N', 'stary użytkownik z danymi: nie N');
}

console.log('\n=== Losowanie komunikatów: deterministyczne i z wagami ===');
{
  const s = mk({ y: 7, d: 5 });
  const a = L.ddMsg(s, TD), b = L.ddMsg(s, TD);
  ok(JSON.stringify(a) === JSON.stringify(b), 'ten sam dzień i dane: ten sam komunikat');
  // wszystkie trzy możliwe: A (y>d), B (w1>w2) i C
  const log = []; const mon = L.aMon(TD);
  for (let i = 1; i <= 7; i++) log.push(...done(addDays(mon, -i), 'a1', 6));
  for (let i = 8; i <= 28; i++) log.push(...done(addDays(mon, -i), 'a1', 4));
  log.push(...done(addDays(TD, -1), 'a1', 9), ...done(addDays(TD, -2), 'a1', 5));
  const sa = { areas: [{ id: 'a1' }], log, wk: {}, pauses: [], tasks: [], created: addDays(TD, -90) };
  const kinds = ddKinds(L, sa); ok(kinds.A > 0 && kinds.B > 0 && Object.keys(kinds).some(k => k.startsWith('C')), 'przy A, B i C wszystkie bywają wybierane', JSON.stringify(kinds));
  const tot = Object.values(kinds).reduce((x, y) => x + y, 0);
  ok(Math.abs(kinds.A / tot - 0.4) < 0.06 && Math.abs(kinds.B / tot - 0.4) < 0.06, 'wagi 2:2:1: A i B po ok. 40%', JSON.stringify(Object.fromEntries(Object.entries(kinds).map(([k, v]) => [k, (v / tot).toFixed(2)]))));
  const only = ddKinds(L, mk({ y: 2, d: 5 }));
  ok(Object.keys(only).length === 1 && Object.keys(only)[0].startsWith('C'), 'bez A i B zawsze C', JSON.stringify(only));
}
function ddKinds(L, s) { const o = {}; for (let i = 0; i < 2000; i++) { const t = L.ddMsg(s, TD, 'x' + i).t; o[t] = (o[t] || 0) + 1; } return o; }

console.log('\n=== Wybór sceny ===');
const man = JSON.parse(fs.readFileSync(path.join(ROOT, 'test/doodle/manifest.json'), 'utf8'));
{
  const sc = L.ddScene(man, {}, TD);
  ok(sc && man.tla.some(x => x.id === sc.tlo) && man.postacie.some(x => x.id === sc.hero) && man.pogoda.some(x => x.id === sc.wea), 'zwraca poprawne identyfikatory z manifestu');
  ok(JSON.stringify(sc) === JSON.stringify(L.ddScene(man, {}, TD)), 'ten sam dzień: ta sama scena');
  let viol = 0, rep = 0, prev = null, dd = {}, days = 400, hs = {};
  for (let i = 0; i < days; i++) {
    const td = addDays('2026-01-01', i), s = L.ddScene(man, dd, td);
    const h = man.postacie.find(x => x.id === s.hero), w = man.pogoda.find(x => x.id === s.wea);
    if (h.seasons && !h.seasons.includes(s.tlo)) viol++;
    if (w.seasons && !w.seasons.includes(s.tlo)) viol++;
    if (prev && prev === s.hero) rep++;
    prev = s.hero; hs[s.hero] = (hs[s.hero] || 0) + 1;
    dd.recent = (dd.recent || []).concat(s.hero).slice(-7); dd.seen = dd.seen || {}; [s.tlo, s.hero, s.wea].forEach(x => { dd.seen[x] = 1; });
  }
  ok(viol === 0, `400 dni: postacie i pogoda zawsze pasują do tła (np. śnieg tylko zimą)`, String(viol));
  ok(rep === 0, 'ta sama postać nigdy dwa dni z rzędu', String(rep));
  ok(man.postacie.every(p => hs[p.id] > 20), 'każda postać pojawia się wielokrotnie', JSON.stringify(hs));
  // nowość: niewidziane elementy mają większą wagę
  const seen = {}; man.tla.concat(man.postacie, man.pogoda).forEach(x => { seen[x.id] = 1; }); delete seen.sowa;
  let sowa = 0, n = 1500; for (let i = 0; i < n; i++) { const s = L.ddScene(man, { seen }, addDays('2020-01-01', i)); if (s.hero === 'sowa') sowa++; }
  let base = 0; for (let i = 0; i < n; i++) { const s = L.ddScene(man, { seen: man.tla.concat(man.postacie, man.pogoda).reduce((o, x) => (o[x.id] = 1, o), {}) }, addDays('2020-01-01', i)); if (s.hero === 'sowa') base++; }
  ok(sowa / n > base / n * 1.4, `nowa postać pojawia się częściej (bonus „nowość”): ${(100 * sowa / n).toFixed(0)}% vs ${(100 * base / n).toFixed(0)}%`);
  ok(L.ddScene({ tla: [], postacie: [], pogoda: [], wejscia: [] }, {}, TD) === null, 'pusty manifest: null, bez wyjątku');
  ok(L.ddScene({ tla: man.tla, postacie: man.postacie, pogoda: [], wejscia: [] }, {}, TD) === null, 'brak pogody: null, bez wyjątku');
  ok(L.ddScene(man, { recent: 'zepsute', seen: null }, TD) !== undefined, 'uszkodzone dane stanu nie powodują wyjątku');
}

console.log('\n=== Silnik, teksty i moduły ===');
{
  const dir = path.join(ROOT, 'test/doodle');
  const ctx = vm.createContext({ console }); ctx.window = ctx; ctx.globalThis = ctx;
  const run = f => vm.runInContext(fs.readFileSync(path.join(dir, f), 'utf8'), ctx, { filename: f });
  run('engine.js'); [...man.tla, ...man.postacie, ...man.pogoda].forEach(m => run(m.file)); run('teksty/pl.js'); run('teksty/en.js');
  const Dd = ctx.Doodle;
  // odmiana
  const f = (l, tpl, p) => Dd.fmt(l, tpl, p);
  const pl = n => f('pl', '{n|zadanie,zadania,zadań}', { n });
  ok([1, 2, 4, 5, 12, 14, 21, 22, 25, 112].map(pl).join('|') === '1 zadanie|2 zadania|4 zadania|5 zadań|12 zadań|14 zadań|21 zadań|22 zadania|25 zadań|112 zadań', 'polska odmiana: zadanie/zadania/zadań', [1, 2, 4, 5, 12, 14, 21, 22, 25, 112].map(pl).join('|'));
  ok(f('en', '{n|task,tasks}', { n: 1 }) === '1 task' && f('en', '{n|task,tasks}', { n: 3 }) === '3 tasks', 'angielska odmiana');
  ok(f('pl', 'a {x} b', {}) === 'a  b' && f('pl', '{n}', { n: 0 }) === '0', 'brak parametru daje pusty ciąg, zero jest zachowane');
  ok(Dd.text('pl', 'A', 0, { y: 3, d: 1, x: 2 }) !== Dd.text('pl', 'A', 0.99, { y: 3, d: 1, x: 2 }), 'zmienna r wybiera różne warianty tekstu');
  // kompletność i zgodność parametrów
  const need = { A: ['y', 'd', 'x'], B: ['w1', 'w2', 'x'], C: ['y', 'a', 'n'], C2: ['y', 'n'], C0: ['n'], P: ['to'], N: [], R: [] };
  let problems = [];
  for (const l of ['pl', 'en']) for (const [k, ps] of Object.entries(need)) {
    let cnt = 0; for (let i = 0; i < 10; i++) { const s = Dd.text(l, k, i / 10, Object.fromEntries(ps.map(p => [p, 7]))); if (!s) problems.push(`${l}/${k}: pusty tekst`); else if (/\{|\}/.test(s)) problems.push(`${l}/${k}: nierozwinięty placeholder: ${s}`); cnt++; }
    // wariantów: policz różne teksty
    const set = new Set(Array.from({ length: 20 }, (_, i) => Dd.text(l, k, i / 20, Object.fromEntries(ps.map(p => [p, 7]))))); if (set.size < 3) problems.push(`${l}/${k}: tylko ${set.size} warianty`);
  }
  ok(problems.length === 0, 'PL i EN: każdy rodzaj komunikatu ma ≥3 warianty i wszystkie placeholdery są obsłużone', problems.slice(0, 3).join(' ; '));
  const miss = []; const src = fs.readFileSync(path.join(dir, 'teksty/pl.js'), 'utf8');
  for (const [k, ps] of Object.entries(need)) { const m = src.match(new RegExp('"' + k + '":\\s*\\[([\\s\\S]*?)\\]')); const used = new Set(); (m ? m[1] : '').replace(/\{(\w+)/g, (_, v) => used.add(v)); for (const u of used) if (!ps.includes(u)) miss.push(`${k}:{${u}}`); }
  ok(miss.length === 0, 'teksty używają tylko parametrów, które logika faktycznie podaje', miss.join(','));
  // moduły
  const reg = (k, id) => Dd.has(k, id);
  ok([...man.tla.map(x => ['tla', x.id]), ...man.postacie.map(x => ['postacie', x.id]), ...man.pogoda.map(x => ['pogoda', x.id])].every(([k, id]) => reg(k, id)), 'każdy wpis manifestu zarejestrował moduł');
  const orphan = [];
  for (const k of ['tla', 'postacie', 'pogoda']) for (const fl of fs.readdirSync(path.join(dir, k))) if (!man[k].some(x => x.file === `${k}/${fl}`)) orphan.push(`${k}/${fl}`);
  ok(orphan.length === 0, 'w katalogach modułów nie ma plików spoza manifestu', orphan.join(','));
  const meta = man.postacie.filter(p => { const o = Dd.get('postacie', p.id); return !(o.name && o.name.pl && o.name.en && o.cap && o.cap.pl && o.cap.en && Array.isArray(o.o)); });
  ok(meta.length === 0, 'każda postać ma nazwę i opis PL/EN oraz punkt zaczepienia', meta.map(x => x.id).join(','));
  ok(man.tla.every(t => { const o = Dd.get('tla', t.id); return o.sky && o.sky.length === 2 && typeof o.deco === 'function'; }), 'każde tło ma niebo i dekoracje');
  // wszystkie dozwolone kombinacje: poprawny XML, spójne identyfikatory, rozsądny rozmiar
  const dom = new JSDOM(''); const parser = new dom.window.DOMParser();
  let combos = 0, bad = [], maxEl = 0, maxKB = 0;
  for (const t of man.tla) for (const p of man.postacie) { if (p.seasons && !p.seasons.includes(t.id)) continue;
    for (const w of man.pogoda) { if (w.seasons && !w.seasons.includes(t.id)) continue;
      const en = man.wejscia[combos % man.wejscia.length].id; combos++;
      const svg = Dd.svg({ tlo: t.id, hero: p.id, wea: w.id, entry: en });
      const doc = parser.parseFromString(svg, 'image/svg+xml');
      if (doc.querySelector('parsererror') || !svg.startsWith('<svg')) { bad.push(`${t.id}/${p.id}/${w.id}: niepoprawny SVG`); continue; }
      const ids = [...doc.querySelectorAll('[id]')].map(e => e.id), refs = [...svg.matchAll(/url\(#([\w-]+)\)/g)].map(m => m[1]);
      if (ids.length !== new Set(ids).size) bad.push(`${t.id}/${p.id}/${w.id}: zdublowane id`);
      refs.forEach(r => { if (!ids.includes(r)) bad.push(`${t.id}/${p.id}/${w.id}: brak id ${r}`); });
      const cnt = doc.querySelectorAll('polygon,rect,path,circle').length; maxEl = Math.max(maxEl, cnt); maxKB = Math.max(maxKB, svg.length / 1024);
    } }
  ok(bad.length === 0, `${combos} kombinacji scen: poprawny SVG, brak zdublowanych id i martwych odwołań`, bad.slice(0, 3).join(' ; '));
  ok(maxEl <= 1300 && maxKB <= 250, `rozmiar sceny w granicach: max ${maxEl} elementów, ${maxKB.toFixed(0)} KB`, `${maxEl} el., ${maxKB.toFixed(0)} KB`);
  ok(Dd.svg({ tlo: 'nie-ma', hero: 'gornik', wea: 'deszcz', entry: '' }) === '' && Dd.svg({ tlo: 'zima', hero: 'x', wea: 'snieg', entry: '' }) === '', 'nieznane id: pusty wynik zamiast wyjątku');
  const w1 = Dd.svg({ tlo: 'wiosna', hero: 'gornik', wea: 'tecza', entry: 'z-lewej' }), w2 = Dd.svg({ tlo: 'wiosna', hero: 'gornik', wea: 'tecza', entry: 'z-lewej' });
  ok(w1 === w2, 'ta sama scena daje identyczny SVG (powtórka w Ustawieniach wygląda tak samo)');
}

console.log(`\nWynik: ${pass} ok, ${fail} błędów`);
process.exit(fail ? 1 : 0);
