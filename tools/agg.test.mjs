// Testy rdzenia agregacji (blok AGG-BEGIN..AGG-END w index.html), bez DOM.
// Uruchomienie:  node tools/agg.test.mjs
process.env.TZ = 'Europe/Warsaw'; // strefa z przejściami DST, żeby testować granice tygodni
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
let pass = 0, fail = 0;
const ok = (c, name, info = '') => { c ? pass++ : fail++; console.log((c ? '  ok   ' : '  FAIL ') + name + (c || !info ? '' : '  → ' + info)); };

function load(file) {
  const src = fs.readFileSync(path.join(ROOT, file), 'utf8');
  const m = src.match(/\/\* AGG-BEGIN[\s\S]*?\/\* AGG-END \*\//);
  if (!m) return null;
  return new Function(m[0] + '\nreturn{aMon,aggAdd,aggTotals,aggCompact,aggTry,aggPeek,aggFails,aggReasonCounts,aggMergeReason,aggCountArea,aggWeeks,wkGet,aggSpr,AGG_PEND};')();
}

// --- generator danych ---
const rng = seed => () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
const pad = n => String(n).padStart(2, '0');
const dstr = d => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
const TD = '2026-11-19'; // czwartek
const addDays = (s, n) => { const [y, m, d] = s.split('-').map(Number); const x = new Date(y, m - 1, d, 12); x.setDate(x.getDate() + n); return dstr(x); };
const TITLES = ['Bieganie', 'bieganie ', 'Czytanie', 'Siłownia', 'Zakupy', 'Raport tygodniowy', 'Medytacja'];

function gen({ days, rep = 3, one = 3, seed = 1, steps = 3, pFailNoReason = 0.3 }) {
  const R = rng(seed), tasks = [], log = [], id = () => Math.floor(R() * 36 ** 6).toString(36).padStart(6, '0') + 'x';
  const reasons = ['r1', 'r2', 'r3', 'r4'].map(i => ({ id: i, name: 'Przyczyna ' + i }));
  for (let d = days; d >= 0; d--) {
    const date = addDays(TD, -d);
    const mk = (area, title, tpl, st) => {
      const t = { id: id(), area, tpl, t: title, d: tpl ? 'Opis zadania cyklicznego, dwa zdania opisu.' : '', time: '', imp: 0, cnt: 1, exp: 0, n: 0, rep: { k: 'none', days: [] }, st, date };
      if (tpl) t.steps = Array.from({ length: steps }, (_, k) => ({ id: id(), t: 'Krok ' + k, d: 1 }));
      tasks.push(t); return t;
    };
    for (let k = 0; k < rep; k++) {
      const area = R() < .6 ? 'a1' : 'a2', title = TITLES[Math.floor(R() * TITLES.length)], t = mk(area, title, 'tpl' + k, 'closed');
      if (R() < .8) log.push({ id: id(), tid: t.id, area, tpl: t.tpl, title, date, res: 'done', c: 2 });
      else log.push({ id: id(), tid: t.id, area, tpl: t.tpl, title, date, res: 'fail', k: R() < .5 ? 'p' : 'f', c: R() < .5 ? 0 : -1, reason: R() < pFailNoReason ? null : 'r' + (1 + Math.floor(R() * 4)), dec: 'todo' });
    }
    for (let k = 0; k < one; k++) {
      const area = R() < .6 ? 'a1' : 'a2', title = 'Jednorazowe ' + Math.floor(R() * 50), t = mk(area, title, null, 'done');
      log.push({ id: id(), tid: t.id, area, tpl: null, title, date, res: 'done', c: 2 });
    }
  }
  // zadania, które mają zostać nietknięte
  ['todo', 'prog', 'arch', 'idea'].forEach((st, i) => tasks.push({ id: 'keep' + i, area: 'a1', t: 'Zostaje ' + st, d: '', time: '', rep: { k: 'none', days: [] }, st, date: addDays(TD, -300) }));
  tasks.push({ id: 'tplx', area: 'a1', t: 'Szablon', d: '', time: '', rep: { k: 'daily', days: [] }, st: 'todo', date: addDays(TD, -300) });
  return { schema: 3, tasks, log, reasons, areas: [{ id: 'a1', name: 'A' }, { id: 'a2', name: 'B' }], area: 'a1', wk: {}, keep: 0, last: TD };
}

// niezależna implementacja tygodnia (arytmetyka UTC, bez stref czasowych)
const monUTC = s => { const d = new Date(s + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7)); return d.toISOString().slice(0, 10); };
// niezależne zliczenie: area -> tydzień -> {d,f,p}, z logu i agregatów
function indep(s) {
  const m = {}, b = (a, w) => ((m[a] = m[a] || {})[w] = m[a][w] || { d: 0, f: 0, p: 0 });
  s.log.forEach(l => { if (!l.date) return; const x = b(l.area, monUTC(l.date)); if (l.res === 'done') x.d++; else (l.k || (l.dec === 'todo' ? 'p' : 'f')) === 'p' ? x.p++ : x.f++; });
  Object.keys(s.wk || {}).forEach(a => Object.keys(s.wk[a]).forEach(w => { const x = b(a, w), y = s.wk[a][w]; x.d += y.d; x.f += y.f; x.p += y.p; }));
  return JSON.stringify(Object.keys(m).sort().map(a => [a, Object.keys(m[a]).sort().map(w => [w, m[a][w].d, m[a][w].f, m[a][w].p])]));
}
const clone = o => JSON.parse(JSON.stringify(o));

function suite(label, A) {
  console.log(`\n=== ${label} ===`);

  // 1. granice tygodni
  {
    const c = [['2026-11-19', '2026-11-16'], ['2026-11-22', '2026-11-16'], ['2026-11-16', '2026-11-16'], ['2026-01-01', '2025-12-29'],
      ['2026-03-29', '2026-03-23'], ['2026-03-30', '2026-03-30'], ['2026-10-25', '2026-10-19'], ['2026-10-26', '2026-10-26'], ['2024-02-29', '2024-02-26']];
    const bad = c.filter(([d, w]) => A.aMon(d) !== w).map(([d, w]) => `${d}→${A.aMon(d)} (oczek. ${w})`);
    ok(!bad.length, 'poniedziałek tygodnia: DST, przełom roku, rok przestępny', bad.join('; '));
    ok(A.aMon(TD, 2) === '2026-11-02' && A.aMon(TD, 0) === '2026-11-16', 'cofanie o N tygodni');
    let all = true; for (let i = 0; i < 800; i++) { const d = addDays('2024-01-01', i); if (A.aMon(d) !== monUTC(d)) { all = false; break; } }
    ok(all, 'zgodność z niezależną implementacją UTC dla 800 kolejnych dni');
  }

  // 2. niezmienniki dla keep = 2, 3, 4
  for (const keep of [2, 3, 4]) {
    const s = gen({ days: 400, seed: 7 + keep }), before = indep(s), nLog = s.log.length;
    const r = A.aggTry(s, TD, keep);
    ok(r.ok && !r.none, `keep=${keep}: aggTry ok i coś zagregowano (${r.ent} wpisów, ${r.tasks} zadań)`, JSON.stringify(r).slice(0, 120));
    ok(indep(r.c) === before, `keep=${keep}: tygodniowe sumy zrobione/porażki/odłożone identyczne przed i po (niezależna kontrola)`);
    ok(A.aggTotals(r.c) === A.aggTotals(s), `keep=${keep}: sumy per przyczyna/tytuł/data identyczne przed i po`);
    ok(JSON.stringify(s).length === JSON.stringify(gen({ days: 400, seed: 7 + keep })).length, `keep=${keep}: stan wejściowy nie został zmieniony (kompaktowanie działa na kopii)`);
    ok(r.c.log.length + r.ent === nLog, `keep=${keep}: liczba wpisów się zgadza (pozostało ${r.c.log.length} + zagregowano ${r.ent})`);
    const cut = A.aMon(TD, keep - 1), pcut = A.aMon(TD, A.AGG_PEND);
    ok(r.c.log.every(l => l.date >= cut || (l.res === 'fail' && !l.reason && l.date >= pcut)), `keep=${keep}: w logu zostały tylko wpisy z okna szczegółów lub młode porażki bez przyczyny`);
    ok(s.log.filter(l => l.date >= cut).every(l => r.c.log.some(x => x.id === l.id)), `keep=${keep}: wszystkie wpisy z okna szczegółów (od ${cut}) zachowane`);
    // druga runda: idempotencja
    const r2 = A.aggTry(r.c, TD, keep);
    ok(r2.ok && r2.none, `keep=${keep}: ponowne uruchomienie niczego nie zmienia`);
  }

  // 3. kolejne dni: porządkowanie przyrostowe zachowuje sumy
  {
    const s = gen({ days: 200, seed: 21 }); let cur = A.aggTry(s, TD, 3).c, ok1 = true;
    for (let d = 1; d <= 40; d++) {
      const td = addDays(TD, d);
      // dopisz „dzisiejsze” wpisy
      cur.log.push({ id: 'n' + d, tid: 'tn' + d, area: 'a1', tpl: null, title: 'Nowe ' + d, date: td, res: 'done', c: 2 });
      cur.tasks.push({ id: 'tn' + d, area: 'a1', t: 'Nowe ' + d, st: 'done', date: td, rep: { k: 'none', days: [] } });
      const q = A.aggTry(cur, td, 3); if (!q.ok) { ok1 = false; break; } cur = q.c;
    }
    ok(ok1, 'przyrostowo przez 40 dni: aggTry zawsze ok');
    const tot = o => (o.log.filter(l => l.res === 'done').length) + Object.values(o.wk).reduce((n, a) => n + Object.values(a).reduce((m, w) => m + w.d, 0), 0);
    const s0 = gen({ days: 200, seed: 21 }), total0 = s0.log.filter(l => l.res === 'done').length;
    ok(tot(cur) === total0 + 40, `przyrostowo: suma zrobionych = ${total0} + 40 nowych`, String(tot(cur)));
    ok(cur.log.every(l => l.date >= A.aMon(addDays(TD, 40), 2) || (l.res === 'fail' && !l.reason)), 'przyrostowo: okno szczegółów przesuwa się z czasem');
  }

  // 4. porażki bez przyczyny
  {
    const mk = (id, date, reason) => ({ id, tid: 't' + id, area: 'a1', tpl: null, title: 'Zad ' + id, date, res: 'fail', k: 'f', c: -1, reason, dec: 'todo' });
    const old = addDays(TD, -70), mid = addDays(TD, -35), young = addDays(TD, -5);
    const s = { tasks: [], areas: [{ id: 'a1' }], wk: {}, log: [mk('o', old, null), mk('m', mid, null), mk('y', young, null), mk('w', mid, 'r1')] };
    const r = A.aggTry(s, TD, 3);
    const ids = r.c.log.map(l => l.id).sort().join();
    ok(ids === 'm,y', 'bez przyczyny: starsze niż 8 tygodni zagregowane, młodsze zostają do uzupełnienia', ids);
    const w = A.wkGet(r.c, 'a1', A.aMon(old));
    ok(w && w.r._ && Object.keys(w.r._).length === 1, 'bez przyczyny: stary trafia do koszyka „_” (bez wybranej przyczyny)');
    const w2 = A.wkGet(r.c, 'a1', A.aMon(mid));
    ok(w2 && w2.r.r1 && !w2.r._, 'z przyczyną: zagregowany pod swoją przyczyną');
  }

  // 5. sprzątanie zadań
  {
    const T = (id, st, date, extra = {}) => ({ id, area: 'a1', t: id, st, date, rep: { k: 'none', days: [] }, ...extra });
    const old = addDays(TD, -60), inWin = addDays(TD, -2);
    const s = {
      areas: [{ id: 'a1' }], wk: {}, reasons: [],
      tasks: [T('cl_old', 'closed', old), T('cl_ref', 'closed', old), T('dn_old', 'done', old), T('dn_win', 'done', inWin), T('cl_win', 'closed', inWin),
        T('dn_nodate', 'done', undefined), T('todo', 'todo', old), T('prog', 'prog', old), T('arch', 'arch', old), T('idea', 'idea', old), T('tpl', 'todo', old, { rep: { k: 'daily', days: [] } })],
      log: [{ id: 'a', tid: 'cl_old', area: 'a1', title: 'x', date: old, res: 'done', c: 2 }, { id: 'b', tid: 'dn_old', area: 'a1', title: 'y', date: old, res: 'done', c: 2 },
        { id: 'c', tid: 'cl_ref', area: 'a1', title: 'z', date: addDays(TD, -20), res: 'fail', k: 'f', c: 0, reason: null, dec: 'todo' }, // młoda porażka bez przyczyny: zostaje w logu
        { id: 'd', tid: 'dn_win', area: 'a1', title: 'w', date: inWin, res: 'done', c: 2 }],
    };
    const r = A.aggTry(s, TD, 3), left = r.c.tasks.map(t => t.id).sort().join();
    ok(left === 'arch,cl_ref,cl_win,dn_nodate,dn_win,idea,prog,todo,tpl', 'sprzątanie zadań: usuwa tylko stare zakończone bez wpisów w logu', left);
  }

  // 6. aggFails / przyczyny / scalanie
  {
    const s = gen({ days: 300, seed: 5 }), r = A.aggTry(s, TD, 3), c = r.c;
    const from = A.aMon(TD, 12);
    const exp = s.log.filter(l => l.res === 'fail' && l.area === 'a1' && l.date >= from).length;
    const got = c.log.filter(l => l.res === 'fail' && l.area === 'a1' && l.date >= from).length + A.aggFails(c, 'a1', from).length;
    ok(got === exp, `13 tygodni: porażki z logu + agregatów = oryginał (${exp})`, String(got));
    const rc = A.aggReasonCounts(c);
    const ex2 = {}; s.log.forEach(l => { if (l.res === 'fail' && l.reason && l.date < A.aMon(TD, 2)) ex2[l.reason] = (ex2[l.reason] || 0) + 1; });
    ok(JSON.stringify(Object.keys(ex2).sort().map(k => [k, ex2[k]])) === JSON.stringify(Object.keys(rc).sort().map(k => [k, rc[k]])), 'liczniki przyczyn w agregatach = liczba zagregowanych porażek z przyczyną');
    const before = A.aggReasonCounts(c).r1 || 0, noRsn = JSON.stringify(c.wk).length;
    const sumAll = o => Object.values(o.wk).reduce((n, a) => n + Object.values(a).reduce((m, w) => m + w.f + w.p, 0), 0);
    const tot0 = sumAll(c); A.aggMergeReason(c, 'r1');
    ok(!('r1' in A.aggReasonCounts(c)) && sumAll(c) === tot0, 'usunięcie przyczyny: wpisy przechodzą do „_”, sumy porażek bez zmian', `r1 było ${before}`);
    ok(A.aggCountArea(c, 'a1') > 0 && A.aggWeeks(c) > 0, 'liczniki pomocnicze (obszar, tygodnie)');
  }

  // 7. odporność
  {
    const s = gen({ days: 60, seed: 9 }); s.log.push({ id: 'nodate', tid: 'x', area: 'a1', title: 'bez daty', res: 'done', c: 2 }, { id: 'nul', tid: 'y', area: 'a1', title: null, date: addDays(TD, -50), res: 'fail', reason: 'r1', k: 'f', c: undefined });
    const r = A.aggTry(s, TD, 2);
    ok(r.ok && r.c.log.some(l => l.id === 'nodate'), 'wpis bez daty zostaje w logu, bez wyjątku');
    ok(indep(r.c) === indep(s), 'wpis z tytułem null i brakującym c nie psuje sum');
    const bad = clone(s); bad.tasks = null; const b = A.aggTry(bad, TD, 3);
    ok(b.ok === false && typeof b.err === 'string', 'uszkodzony stan: aggTry zwraca ok:false zamiast wyjątku');
  }

  // 7b. sprinty: stare wpisy wchodzą do tygodniowych sum, bilans minut się nie zmienia
  {
    const s = gen({ days: 90, seed: 31 });
    let k = 0; const mkS = (date, area, m, c = 1) => ({ id: 's' + (++k), t: 'tx', a: area, n: 'Zadanie', d: date, m, c });
    s.spr = [];
    for (let d = 80; d >= 1; d -= 3) s.spr.push(mkS(addDays(TD, -d), d % 2 ? 'a1' : 'a2', 10 + (d % 4) * 5, d % 5 ? 1 : 0));
    s.spr.push({ id: 'nd', t: 'x', a: 'a1', m: 5, c: 1 }, { id: 'na', t: 'x', d: addDays(TD, -70), m: 5, c: 1 }); // bez daty / bez listy: zostają
    const total = (o, area, from) => A.aggSpr(o, area, from);
    const from = A.aMon(addDays(TD, -85));
    const b1 = total(s, 'a1', from), b2 = total(s, 'a2', from);
    const r = A.aggTry(s, TD, 3);
    ok(r.ok && !r.none && r.spr > 10, `sprinty starsze niż okno trafiają do tygodni (${r.spr} wpisów)`, JSON.stringify([r.ok, r.none, r.spr]));
    const c1 = total(r.c, 'a1', from), c2 = total(r.c, 'a2', from);
    ok(JSON.stringify([b1, b2]) === JSON.stringify([c1, c2]), 'liczba i minuty sprintów w okresie identyczne przed i po porządkowaniu', JSON.stringify([b1, b2, c1, c2]));
    const cut = A.aMon(TD, 2);
    ok(r.c.spr.every(e => !e.d || !e.a || e.d >= cut), 'w S.spr zostają tylko wpisy z okna szczegółów (i uszkodzone bez daty lub listy)');
    ok(r.c.spr.some(e => e.id === 'nd') && r.c.spr.some(e => e.id === 'na'), 'wpisy bez daty lub bez listy nie są gubione');
    ok(A.aggTotals(r.c) === A.aggTotals(s), 'kontrola spójności (aggTotals) uwzględnia sprinty i przechodzi');
    const r2 = A.aggTry(r.c, TD, 3);
    ok(r2.ok && r2.none, 'drugie uruchomienie nic nie zmienia (idempotencja także dla sprintów)');
    // tylko sprinty do zagregowania (bez starych zadań i wpisów) też uruchamia porządkowanie
    const only = { areas: [{ id: 'a1' }], tasks: [], log: [], wk: {}, spr: [mkS(addDays(TD, -60), 'a1', 25)] };
    const ro = A.aggTry(only, TD, 2);
    ok(ro.ok && !ro.none && ro.spr === 1 && ro.c.spr.length === 0 && A.aggSpr(ro.c, 'a1', A.aMon(addDays(TD, -70))).m === 25, 'sam stary sprint wystarcza, żeby porządkowanie zadziałało (none=false)');
    // inna lista i okres: sumy rozdzielone poprawnie
    ok(A.aggSpr(r.c, 'a2', A.aMon(addDays(TD, -10))).n === A.aggSpr(s, 'a2', A.aMon(addDays(TD, -10))).n, 'sumy po liście i krótszym okresie zgadzają się');
  }

  // 8. pomiar rozmiaru i czasu
  console.log('\n  Pomiar (keep=3): rozmiar JSON przed → po, czas aggTry');
  for (const [name, cfg] of [['lekkie  (2 powt.+2 jedn./dzień)', { rep: 2, one: 2 }], ['średnie (4 powt.+4 jedn./dzień)', { rep: 4, one: 4 }], ['intensywne (6 powt.+8 jedn./dzień)', { rep: 6, one: 8 }]]) {
    for (const days of [365, 730]) {
      const s = gen({ days, seed: 3, ...cfg }), t0 = Date.now(), r = A.aggTry(s, TD, 3), ms = Date.now() - t0;
      const a = JSON.stringify(s).length, b = JSON.stringify(r.c).length;
      console.log(`  ${name} ${String(days).padStart(3)} dni: ${String(Math.round(a / 1024)).padStart(5)} KB → ${String(Math.round(b / 1024)).padStart(4)} KB  (−${(100 - 100 * b / a).toFixed(1)}%), ${r.ent} wpisów, ${r.tasks} zadań, ${ms} ms`);
      if (days === 730 && cfg.rep === 6) ok(ms < 3000 && b < a * 0.1, `najcięższy przypadek: <3 s i <10% pierwotnego rozmiaru`, `${ms} ms, ${(100 * b / a).toFixed(1)}%`);
    }
  }
}

const t = load('test/index.html');
if (!t) { console.log('Brak bloku AGG w test/index.html'); process.exit(1); }
suite('test/index.html', t);
const r = load('index.html');
if (r) suite('index.html (produkcja)', r); else console.log('\n(produkcja nie ma jeszcze bloku AGG: pomijam)');

console.log(`\nWynik: ${pass} ok, ${fail} błędów`);
process.exit(fail ? 1 : 0);
