// Testy bilansu list (blok BALANCE w index.html): wskaźnik względem własnej normy, pauza, mała próbka, zgodność po porządkowaniu.
// Uruchomienie:  node tools/balance.test.mjs
process.env.TZ = 'Europe/Warsaw';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
let pass = 0, fail = 0;
const ok = (c, name, info = '') => { c ? pass++ : fail++; console.log((c ? '  ok   ' : '  FAIL ') + name + (c || !info ? '' : '  → ' + info)); };

function load(file) {
  const src = fs.readFileSync(path.join(ROOT, file), 'utf8');
  const bl = n => (src.match(new RegExp('/\\* ' + n + '-BEGIN[\\s\\S]*?/\\* ' + n + '-END \\*/')) || [null])[0];
  const [a, p, b] = [bl('AGG'), bl('PAUSE'), bl('BALANCE')];
  if (!a || !p || !b) return null;
  return new Function(a + p + b + '\nreturn{aAdd,aMon,aggTry,balStats,balSummary,BAL_MIN,BAL_DAYS};')();
}

const TD = '2026-11-18'; // środa. Okno „ostatnie 7 dni”: 11-11..11-17. Norma: tygodnie od 10-12 do 11-08 (28 dni).
let uid = 0;
const L = (area, date, res = 'done') => ({ id: 'l' + (++uid), tid: 't' + uid, area, title: 'x', date, res, c: res === 'done' ? 2 : 0 });
const add = (A, d, n) => A.aAdd(d, n);

function mk(A, spec, { pauses = [], extraAreas = [] } = {}) {
  // spec: { a1: {norm: 10, rec: 12}, a2: {...} }; norma rozłożona równo po 4 tygodniach, tydzień = pn..nd od 10-12
  const areas = [{ id: 'a1', name: 'Prywatne', color: '#2a9d8f' }, { id: 'a2', name: 'Zawodowe', color: '#3976be' }, ...extraAreas];
  const log = [];
  for (const [id, v] of Object.entries(spec)) {
    const perWeek = v.norm, mons = ['2026-10-12', '2026-10-19', '2026-10-26', '2026-11-02'];
    for (const m of mons) for (let i = 0; i < perWeek; i++) log.push(L(id, add(A, m, i % 7)));
    for (let i = 0; i < (v.rec || 0); i++) log.push(L(id, add(A, '2026-11-11', i % 7)));
    for (let i = 0; i < (v.noise || 0); i++) log.push(L(id, TD)); // dziś: nie liczy się
  }
  return { areas, log, wk: {}, pauses, tasks: [] };
}

const A = load('test/index.html');
if (!A) { console.log('Brak bloków AGG/PAUSE/BALANCE w test/index.html'); process.exit(1); }

console.log('\n=== Wskaźnik względem własnej normy ===');
{
  const s = mk(A, { a1: { norm: 10, rec: 12 }, a2: { norm: 6, rec: 4 } });
  const st = A.balStats(s, TD), a1 = st.find(x => x.id === 'a1'), a2 = st.find(x => x.id === 'a2');
  ok(a1.st === 'ok' && a1.idx === 120 && a1.norm === 10 && a1.rec === 12, 'lista 1: norma 10/tydz., ostatnie 7 dni 12 → 120%', JSON.stringify(a1));
  ok(a2.st === 'ok' && a2.idx === 67 && a2.norm === 6, 'lista 2: norma 6/tydz., ostatnie 7 dni 4 → 67%', JSON.stringify(a2));
  const sm = A.balSummary(st);
  ok(sm.k === 'best' && sm.top.id === 'a1' && sm.ok.map(x => x.id).join() === 'a1,a2', 'najlepiej idzie lista 1; kolejność od najlepszej');
  // sprawiedliwość wobec małej listy: 4 zadań to dużo dla listy o normie 3
  const s2 = mk(A, { a1: { norm: 30, rec: 30 }, a2: { norm: 3, rec: 5 } });
  const sm2 = A.balSummary(A.balStats(s2, TD));
  ok(sm2.top.id === 'a2' && sm2.top.idx === 167, 'mała lista (3→5) wygrywa z dużą (30→30): pasek mierzy tempo własne, nie liczbę zadań', JSON.stringify(sm2.top));
  // równo: różnica poniżej 10 punktów
  const s3 = mk(A, { a1: { norm: 10, rec: 10 }, a2: { norm: 10, rec: 10 } });
  ok(A.balSummary(A.balStats(s3, TD)).k === 'even', 'oba na 100%: „równo”');
  const s4 = mk(A, { a1: { norm: 20, rec: 20 }, a2: { norm: 20, rec: 18 } });
  ok(A.balSummary(A.balStats(s4, TD)).k === 'even', '100% i 90% (różnica 10 punktów) mieści się w „równo”', JSON.stringify(A.balStats(s4, TD).map(x => x.idx)));
  const s5 = mk(A, { a1: { norm: 20, rec: 20 }, a2: { norm: 20, rec: 17 } });
  ok(A.balSummary(A.balStats(s5, TD)).k === 'best', '100% i 85%: wskazuje lepszą');
}

console.log('\n=== Krótka historia (dwa tygodnie używania aplikacji) ===');
{
  const TD2 = '2026-11-23'; // poniedziałek; dane od 09.11 (W2) i z W1 (16–22.11)
  const areas = [{ id: 'a1', name: 'Prywatne', color: '#2a9d8f' }, { id: 'a2', name: 'Zawodowe', color: '#3976be' }];
  // stałe tempo „po k zadań dziennie” od dnia `start`
  const steady = (perDay1, perDay2, start, end = '2026-11-22') => {
    const log = []; for (const [id, k] of [['a1', perDay1], ['a2', perDay2]]) for (let d = start; d <= end; d = add(A, d, 1)) for (let i = 0; i < k; i++) log.push(L(id, d));
    return { areas, log, wk: {}, pauses: [], tasks: [] };
  };
  let st = A.balStats(steady(2, 1, '2026-11-09'), TD2);
  ok(st.every(x => x.st === 'ok') && st[0].idx === 100 && st[1].idx === 100, 'dwa pełne tygodnie danych: obie listy się porównują, tempo stałe = 100%', JSON.stringify(st.map(x => [x.st, x.idx, x.days])));
  ok(st.every(x => x.days === 7 && x.prelim === true), 'norma opiera się na 7 dniach historii i jest oznaczona jako wstępna');
  ok(Math.abs(st[0].norm - 14) < 1e-9 && Math.abs(st[1].norm - 7) < 1e-9, 'norma = rzeczywiste tempo tygodniowe (14 i 7), a nie jedna czwarta (poprzedni błąd)', st.map(x => x.norm).join());
  st = A.balStats(steady(4, 2, '2026-11-09'), TD2);
  ok(st[0].idx === 100 && st[1].idx === 100, 'większe liczby (4 i 2 dziennie) też dają 100%, a nie 400% jak wcześniej');
  // start w środku tygodnia: dni sprzed startu nie są zerami
  const byStart = ['2026-11-09', '2026-11-10', '2026-11-11'].map(s0 => A.balStats(steady(2, 1, s0), TD2));
  ok(byStart.every(r => r.every(x => x.st === 'ok' && x.idx === 100)), 'start w poniedziałek, wtorek i środę: za każdym razem 100% (norma liczona od pierwszego dnia, bez zer sprzed startu)', JSON.stringify(byStart.map(r => r.map(x => x.days))));
  const days = byStart.map(r => r[0].days).join();
  ok(days === '7,6,5', 'liczba dni historii: 7, 6, 5', days);
  // za krótko: start w czwartek (4 dni przed ostatnim tygodniem)
  st = A.balStats(steady(2, 1, '2026-11-12'), TD2);
  ok(st.every(x => x.st === 'few' && x.why === 'hist' && x.days === 4), 'start w czwartek: tylko 4 dni historii (<5), powód „hist”, bez udawania wyniku', JSON.stringify(st.map(x => [x.st, x.why, x.days])));
  ok(A.balSummary(st).k === 'none', 'wtedy karta mówi „za mało danych”, ale znamy powód');
  st = A.balStats(steady(2, 1, '2026-11-17'), TD2);
  ok(st.every(x => x.why === 'hist' && x.days === 0), 'dane tylko z ostatniego tygodnia: 0 dni historii');
  // długa historia, ale mało zadań: inny powód
  const sl = mk(A, { a1: { norm: 2, rec: 2 }, a2: { norm: 10, rec: 10 } });
  const stl = A.balStats(sl, TD);
  ok(stl.find(x => x.id === 'a1').why === 'low' && stl.find(x => x.id === 'a2').why === null, 'mało zadań przy długiej historii: powód „low”, druga lista bez powodu');
  ok(stl.find(x => x.id === 'a1').prelim === false && stl.find(x => x.id === 'a1').days === 28, 'długa historia nie jest wstępna (28 dni)');
  // pierwsza aktywność z agregatów tygodniowych
  const big = steady(2, 1, '2026-11-09'); big.schema = 3; big.reasons = [];
  const rr = A.aggTry(big, TD2, 2);
  ok(rr.ok && !rr.none && JSON.stringify(A.balStats(rr.c, TD2)) === JSON.stringify(A.balStats(big, TD2)), 'po porządkowaniu danych bilans krótkiej historii jest identyczny (pierwszy ślad czytany z agregatów)', JSON.stringify([rr.ok, rr.none]));
  // niezależność od dnia tygodnia: stałe tempo, start 14 dni przed poniedziałkiem
  const res = [];
  for (let d = 0; d < 7; d++) { const td = add(A, TD2, d), m0 = A.aMon(td); res.push(A.balStats(steady(2, 1, add(A, m0, -14), add(A, td, -1)), td).map(x => x.st + ':' + x.idx).join('/')); }
  ok(res.every(r => /^ok:\d+\/ok:\d+$/.test(r)), 'dwa tygodnie historii: w każdy dzień tygodnia lista się porównuje (bez „za mało danych”)', res.join(' | '));
}

console.log('\n=== Niezależność od dnia tygodnia ===');
{
  // dane budowane względem td: norma w 4 pełnych tygodniach sprzed ostatniego, ostatnie 7 dni osobno
  const gen = td => {
    const m0 = A.aMon(td), log = [], areas = [{ id: 'a1', name: 'P', color: '#2a9d8f' }, { id: 'a2', name: 'Z', color: '#3976be' }];
    for (const [id, norm, rec] of [['a1', 10, 12], ['a2', 6, 4]]) {
      for (let w = 2; w <= 5; w++) for (let i = 0; i < norm; i++) log.push(L(id, add(A, m0, -7 * w + (i % 7))));
      for (let i = 0; i < rec; i++) log.push(L(id, add(A, td, -7 + (i % 7))));
    }
    return { areas, log, wk: {}, pauses: [], tasks: [] };
  };
  const res = [];
  for (let d = 0; d < 7; d++) { const td = add(A, '2026-11-16', d); const st = A.balStats(gen(td), td); res.push(st.map(x => x.idx).join('/')); }
  ok(res.every(r => r === '120/67'), 'poniedziałek…niedziela: zawsze 120% i 67% (okno i norma nie zależą od dnia tygodnia)', res.join(' | '));
}

console.log('\n=== Okno ostatnich 7 dni ===');
{
  const base = mk(A, { a1: { norm: 10, rec: 0 }, a2: { norm: 10, rec: 0 } });
  const put = d => { base.log.push(L('a1', d)); };
  put('2026-11-10'); put('2026-11-18'); put('2026-11-19'); // poza oknem: 7 dni i 8 dni wstecz, dziś, jutro
  ok(A.balStats(base, TD).find(x => x.id === 'a1').rec === 0, 'wpisy z dziś i sprzed okna nie liczą się do „ostatnich 7 dni”');
  put('2026-11-11'); put('2026-11-17');
  ok(A.balStats(base, TD).find(x => x.id === 'a1').rec === 2, 'granice okna są włączone: 11-11 (7 dni temu) i 11-17 (wczoraj)');
  base.log.push(L('a1', '2026-11-12', 'fail'), L('a1', '2026-11-13', 'fail'));
  ok(A.balStats(base, TD).find(x => x.id === 'a1').rec === 2, 'porażki i odłożenia nie liczą się jako zrobione');
  base.log.push(L('zzz', '2026-11-12'));
  ok(A.balStats(base, TD).length === 2, 'wpisy list, których nie ma, są ignorowane');
}

console.log('\n=== Za mało danych ===');
{
  const s = mk(A, { a1: { norm: 10, rec: 10 }, a2: { norm: 2, rec: 5 } });
  const st = A.balStats(s, TD), a2 = st.find(x => x.id === 'a2');
  ok(a2.st === 'few' && a2.idx === null, `norma poniżej ${A.BAL_MIN}/tydz.: bez procentów („few”)`, JSON.stringify(a2));
  ok(A.balSummary(st).k === 'none', 'jedna lista z normą: za mało, żeby porównywać („none”)');
  ok(A.balStats({ areas: [{ id: 'a1', name: 'A', color: '#000000' }], log: [], wk: {}, pauses: [] }, TD)[0].st === 'few', 'lista bez żadnych danych: „few”, bez dzielenia przez zero');
  ok(A.balStats({ areas: [], log: [], wk: {} }, TD).length === 0, 'brak list: pusty wynik');
  ok(A.balStats({ areas: [{ id: 'a1', name: 'A' }] }, TD)[0].st === 'few', 'brak dziennika i pauz w stanie: bez wyjątku');
}

console.log('\n=== Pauza ===');
{
  const P = (f, t, a = null) => ({ id: 'p', from: f, to: t, areas: a });
  let s = mk(A, { a1: { norm: 10, rec: 12 }, a2: { norm: 10, rec: 12 } }, { pauses: [P('2026-11-15', '2026-11-25', ['a2'])] });
  let st = A.balStats(s, TD);
  ok(st.find(x => x.id === 'a2').st === 'pause' && st.find(x => x.id === 'a1').st === 'ok', 'lista w pauzie dziś: „pauza”, druga normalnie');
  ok(A.balSummary(st).k === 'none', 'przy jednej liście poza pauzą nie ma porównania');
  s = mk(A, { a1: { norm: 10, rec: 12 }, a2: { norm: 10, rec: 12 } }, { pauses: [P('2026-11-11', '2026-11-14', ['a2'])] }); // 4 dni w oknie, dziś już po pauzie
  ok(A.balStats(s, TD).find(x => x.id === 'a2').st === 'pause', 'pauza przez ≥4 z 7 dni ostatniego okna: „pauza”');
  s = mk(A, { a1: { norm: 10, rec: 12 }, a2: { norm: 10, rec: 8 } }, { pauses: [P('2026-11-12', '2026-11-13', ['a2'])] }); // 2 dni pauzy: 8 zadań w 5 dniach → 11,2/tydz.
  const a2 = A.balStats(s, TD).find(x => x.id === 'a2');
  ok(a2.st === 'ok' && a2.idx === 112, '2 dni pauzy w oknie: tempo liczone z aktywnych dni (8 w 5 dniach ≈ 11,2/tydz. → 112%)', JSON.stringify(a2));
  // norma: tydzień w pauzie (bez zadań) nie zaniża normy
  const s2 = mk(A, { a1: { norm: 10, rec: 10 }, a2: { norm: 10, rec: 10 } });
  s2.log = s2.log.filter(l => !(l.area === 'a2' && l.date >= '2026-10-26' && l.date <= '2026-11-01')); // a2 nic nie robi w pauzie w jednym z tygodni normy
  s2.pauses = [P('2026-10-26', '2026-11-01', ['a2'])];
  ok(A.balStats(s2, TD).find(x => x.id === 'a2').idx === 100, 'tydzień pauzy w normie jest pomijany (norma nadal 10/tydz., a nie 7,5)', JSON.stringify(A.balStats(s2, TD).find(x => x.id === 'a2')));
  const s3 = mk(A, { a1: { norm: 10, rec: 10 }, a2: { norm: 10, rec: 10 } }); s3.log = s3.log.filter(l => !(l.area === 'a2' && l.date >= '2026-10-12' && l.date <= '2026-11-04'));
  s3.pauses = [P('2026-10-12', '2026-11-04', ['a2'])];
  ok(A.balStats(s3, TD).find(x => x.id === 'a2').st === 'few', 'prawie cały okres normy w pauzie: brak normy, bez zgadywania');
}

console.log('\n=== Trzy listy i zgodność po porządkowaniu danych ===');
{
  const s = mk(A, { a1: { norm: 10, rec: 14 }, a2: { norm: 8, rec: 6 }, a3: { norm: 5, rec: 5 } }, { extraAreas: [{ id: 'a3', name: 'Dom', color: '#d97706' }] });
  const sm = A.balSummary(A.balStats(s, TD));
  ok(sm.ok.length === 3 && sm.ok.map(x => x.id).join() === 'a1,a3,a2', 'trzy listy: kolejność 140%, 100%, 75%', sm.ok.map(x => x.id + ':' + x.idx).join());
  // porządkowanie danych (keep=2) nie zmienia bilansu: normy ze starszych tygodni idą z agregatów
  const big = mk(A, { a1: { norm: 10, rec: 12 }, a2: { norm: 6, rec: 4 } });
  const r = A.aggTry({ ...big, tasks: [], reasons: [], schema: 3 }, TD, 2);
  ok(r.ok && !r.none && r.c.log.length < big.log.length, 'porządkowanie coś zagregowało (dane testowe są na tyle stare)', JSON.stringify([r.ok, r.none, r.ent]));
  ok(JSON.stringify(A.balStats(r.c, TD)) === JSON.stringify(A.balStats(big, TD)), 'bilans po porządkowaniu danych jest identyczny jak przed');
  const r4 = A.aggTry({ ...big, tasks: [], reasons: [], schema: 3 }, TD, 4);
  ok(JSON.stringify(A.balStats(r4.c, TD)) === JSON.stringify(A.balStats(big, TD)), 'to samo przy oknie 4 tygodnie');
}

console.log(`\nWynik: ${pass} ok, ${fail} błędów`);
process.exit(fail ? 1 : 0);
