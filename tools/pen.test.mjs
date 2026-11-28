// Testy rdzenia systemu kar (blok PEN-BEGIN..PEN-END w index.html), bez DOM.
// Uruchomienie:  node tools/pen.test.mjs
process.env.TZ = 'Europe/Warsaw';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
let pass = 0, fail = 0;
const ok = (c, name, info = '') => { c ? pass++ : fail++; console.log((c ? '  ok   ' : '  FAIL ') + name + (c || !info ? '' : '  → ' + info)); };

function load(file) {
  const src = fs.readFileSync(path.join(ROOT, file), 'utf8');
  const g = re => src.match(re);
  const agg = g(/\/\* AGG-BEGIN[\s\S]*?\/\* AGG-END \*\//), pz = g(/\/\* PAUSE-BEGIN[\s\S]*?\/\* PAUSE-END \*\//), pn = g(/\/\* PEN-BEGIN[\s\S]*?\/\* PEN-END \*\//);
  if (!agg || !pz || !pn) return null;
  return new Function(agg[0] + pz[0] + pn[0] + '\nreturn{aAdd,penInit,penSched,penTpl,penSanitize,penPick,penLift,penBreath,penFire,penOut,penSettle,penDone,penUndo,penCanOn,penCanOff,penOn,penOff,penPunAdd,penPunEdit,penPunDel,penGray,PEN_MAX,PEN_LIM,PEN_BREATH};')();
}

// deterministyczny generator
const mk = seed => () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;

function suite(label, P) {
  console.log(`\n=== ${label} ===`);
  const A = P.aAdd;
  const rng0 = () => 0;
  let uid = 0;
  const T = (id, rep = { k: 'daily', days: [] }, area = 'a1') => ({ id, area, t: 'Zadanie ' + id, rep, st: 'todo', cnt: 1 });
  const S0 = (tasks, pn = ['50 pompek', '5 zł do skarbonki', '20 minut sprzątania']) => P.penInit({ areas: [{ id: 'a1' }, { id: 'a2' }], tasks, log: [], pauses: [], pn: pn.map((t, i) => ({ id: 'p' + i, t, u: 0 })) });
  const L = (s, id, date, what) => s.log.push({ id: 'l' + (++uid), tpl: id, date, res: what === 'done' ? 'done' : 'fail', k: what === 'p' ? 'p' : what === 'f' ? 'f' : undefined, dec: 'todo' });
  // dzień „na żywo”: wykonanie przez penDone, porażka/odłożenie tylko wpis w dzienniku
  const live = (s, id, date, what) => { L(s, id, date, what); if (what === 'done') return P.penDone(s, id, date); return null; };

  // --- start i okno ---
  {
    const s = S0([T('a')]);
    ok(s.cm && s.pn.length === 3 && s.pen.b === null && s.pen.lf === null, 'penInit: puste zobowiązania, lista kar, ławka');
    const bad = P.penInit({ pn: [{ id: 'x', t: 'a' }, null, { id: 'y', t: '  ' }, ...Array.from({ length: 9 }, (_, i) => ({ id: 'z' + i, t: 'k' + i }))], pen: 5, cm: [] });
    ok(bad.pn.length === P.PEN_MAX && bad.pn.every(p => p.t.trim()), 'penInit: uszkodzone dane naprawione, max ' + P.PEN_MAX + ' kar');
  }
  ok(P.penSched({ rep: { k: 'daily' } }, '2026-07-04') && P.penSched({ rep: { k: 'days', days: [1, 3, 5] } }, '2026-07-01') && !P.penSched({ rep: { k: 'days', days: [1, 3, 5] } }, '2026-07-02') && !P.penSched({ rep: { k: 'none', days: [] } }, '2026-07-01'), 'penSched: codziennie, dni tygodnia, brak powtarzania');

  // --- trzy porażki z rzędu → czerwona kartka rano następnego dnia ---
  {
    const s = S0([T('a')]); const t0 = '2026-07-01'; // środa
    ok(P.penOn(s, s.tasks[0], t0) && s.cm.a.from === '2026-07-02', 'włączenie działa od następnego dnia');
    P.penSettle(s, '2026-07-02', rng0); ok(s.cm.a.n === 0 && !s.pen.ev.length, 'dziś (dzień włączenia) nie liczy się');
    P.penSettle(s, '2026-07-03', rng0); ok(s.cm.a.n === 1 && s.pen.ev.at(-1).k === 'y1', '1. porażka: żółta kartka');
    P.penSettle(s, '2026-07-04', rng0); ok(s.cm.a.n === 2 && s.pen.ev.at(-1).k === 'y2' && !s.pen.b, '2. porażka: druga żółta, bez kary');
    P.penSettle(s, '2026-07-05', rng0);
    ok(s.cm.a.n === 3 && s.pen.b && s.pen.b.from === '2026-07-05' && s.pen.b.tpl === 'a', '3. porażka (04.07): ławka rano 05.07');
    ok(s.pen.ev.at(-1).k === 'r' && s.pen.ev.at(-1).pt === '50 pompek', 'komunikat czerwonej kartki z karą');
    const ev = s.pen.ev.length; P.penSettle(s, '2026-07-05', rng0); P.penSettle(s, '2026-07-05', rng0);
    ok(s.pen.ev.length === ev && s.pen.b.pt === '50 pompek', 'idempotencja: ponowne rozliczenie tego samego dnia nic nie zmienia');
    P.penSettle(s, '2026-07-12', rng0); ok(s.cm.a.n === 3 && s.pen.b.from === '2026-07-05' && s.pen.h.length === 0, 'w czasie ławki licznik stoi na 3, ławka trwa tygodniami, bez nowych kar');
  }
  // --- nadrabianie dni bez otwarcia aplikacji ---
  {
    const s = S0([T('a')]); P.penOn(s, s.tasks[0], '2026-07-01');
    P.penSettle(s, '2026-07-09', rng0);
    ok(s.cm.a.n === 3 && s.pen.b && s.pen.b.from === '2026-07-05', 'aplikacja nieotwierana 8 dni: ławka z datą 05.07, nie z dnia otwarcia');
    ok(s.pen.ev.filter(e => e.k === 'r').length === 1, 'jedna czerwona kartka mimo wielu dni');
  }
  // --- wykonanie zeruje; odłożenie neutralne; świadoma porażka liczy się ---
  {
    const s = S0([T('a')]); P.penOn(s, s.tasks[0], '2026-07-01');
    L(s, 'a', '2026-07-02', 'f'); L(s, 'a', '2026-07-03', 'p'); P.penSettle(s, '2026-07-04', rng0);
    ok(s.cm.a.n === 1, 'świadoma porażka liczy się, samo odłożenie jest neutralne (nie zeruje i nie dolicza)');
    L(s, 'a', '2026-07-04', 'done'); P.penSettle(s, '2026-07-05', rng0); ok(s.cm.a.n === 0, 'wykonanie zeruje licznik');
    // priorytet: wykonane > porażka w tym samym dniu
    const s2 = S0([T('a')]); P.penOn(s2, s2.tasks[0], '2026-07-01'); L(s2, 'a', '2026-07-02', 'f'); L(s2, 'a', '2026-07-02', 'done'); P.penSettle(s2, '2026-07-03', rng0);
    ok(s2.cm.a.n === 0, 'wykonane i porażka tego samego dnia: wygrywa wykonanie');
  }
  // --- zadania w wybrane dni tygodnia i tygodniowe ---
  {
    const s = S0([T('a', { k: 'days', days: [1, 3, 5] })]); P.penOn(s, s.tasks[0], '2026-07-05'); // niedziela
    P.penSettle(s, '2026-07-11', rng0); // sobota: pn 6, śr 8, pt 10
    ok(s.cm.a.n === 3 && s.pen.b && s.pen.b.from === '2026-07-11', 'pn/śr/pt: trzecie niewykonanie w piątek → ławka w sobotę');
    const w = S0([T('w', { k: 'days', days: [2] })]); P.penOn(w, w.tasks[0], '2026-07-05');
    P.penSettle(w, '2026-07-20', rng0); ok(w.cm.w.n === 2 && !w.pen.b, 'raz w tygodniu: po 2 tygodniach dwie kartki');
    P.penSettle(w, '2026-07-22', rng0); ok(w.cm.w.n === 3 && w.pen.b && w.pen.b.from === '2026-07-22', 'raz w tygodniu: trzecia porażka po 3 tygodniach (wt 21.07) → ławka 22.07');
  }
  // --- ławka, wykonanie, oddech, kolejka ---
  {
    const s = S0([T('a'), T('b')]); P.penOn(s, s.tasks[0], '2026-07-01'); P.penOn(s, s.tasks[1], '2026-07-01');
    ['02', '03', '04'].forEach(d => L(s, 'b', '2026-07-' + d, 'done')); // b robione
    P.penSettle(s, '2026-07-05', rng0); ok(s.pen.b && s.pen.b.tpl === 'a' && s.cm.b.n === 0, 'a trafia na ławkę, b jest czyste');
    // b zaczyna się migać w czasie ławki: dochodzi do 3 i czeka
    P.penSettle(s, '2026-07-09', rng0);
    ok(s.cm.b.n === 3 && s.cm.b.rc && s.pen.b.tpl === 'a' && s.pen.ev.some(e => e.k === 'w' && e.tpl === 'b'), 'b w czasie ławki a: dochodzi do 3 i czeka (komunikat „czeka”), bez drugiej kary');
    // a wykonane 10.07 → oddech 2 dni
    P.penSettle(s, '2026-07-10', rng0); const sn = live(s, 'a', '2026-07-10', 'done');
    ok(sn && !s.pen.b && s.cm.a.n === 0 && P.penBreath(s, '2026-07-11') === 2 && s.pen.h.length === 1 && s.pen.h[0].to === '2026-07-10', 'wykonanie zdejmuje ławkę, zeruje licznik, startuje oddech, trafia do historii');
    P.penSettle(s, '2026-07-11', rng0); ok(!s.pen.b && P.penBreath(s, '2026-07-11') === 2 && P.penBreath(s, '2026-07-12') === 1, '11.07: oddech 1. dzień, b czeka');
    P.penSettle(s, '2026-07-12', rng0); ok(!s.pen.b && P.penBreath(s, '2026-07-12') === 1 && P.penBreath(s, '2026-07-13') === 0, '12.07: oddech 2. dzień, b czeka');
    P.penSettle(s, '2026-07-13', rng0); ok(s.pen.b && s.pen.b.tpl === 'b' && s.pen.b.from === '2026-07-13', '13.07: czekające b dostaje ławkę (3. dzień po zdjęciu)');
    ok(s.pen.b.pt !== '50 pompek', 'druga kara jest inną niż pierwsza (blokada wylosowanej)');
  }
  {
    // wykonanie czekającego zadania odwołuje strzał
    const s = S0([T('a'), T('b')]); P.penOn(s, s.tasks[0], '2026-07-01'); P.penOn(s, s.tasks[1], '2026-07-01');
    P.penSettle(s, '2026-07-05', rng0); // a i b identycznie: strzela jedna, druga czeka
    const waiting = ['a', 'b'].find(id => s.pen.b.tpl !== id), under = s.pen.b.tpl;
    ok(s.cm[waiting].n === 3 && s.cm[waiting].rc, 'dwa zadania z 3 porażkami: jedno na ławce, drugie czeka');
    const sn = live(s, waiting, '2026-07-05', 'done');
    ok(sn && s.cm[waiting].n === 0 && !s.cm[waiting].rc && s.pen.b.tpl === under, 'wykonanie czekającego odwołuje jego strzał, ławka pierwszego trwa');
    const sn2 = live(s, under, '2026-07-06', 'done');
    ok(sn2 && !s.pen.b && !s.cm.a.rc && !s.cm.b.rc, 'po zdjęciu ławki nic już nie czeka');
  }
  {
    // kolejność: wcześniej dojście do 3 strzela pierwsze
    const s = S0([T('a'), T('b')]); P.penOn(s, s.tasks[0], '2026-07-01'); P.penOn(s, s.tasks[1], '2026-07-03');
    L(s, 'a', '2026-07-02', 'done'); // a: przerwa w serii przesuwa jego 3. porażkę
    P.penSettle(s, '2026-07-08', rng0);
    ok(s.pen.b && s.pen.b.tpl === 'a' && s.pen.b.from === '2026-07-06' && s.cm.b.rc === '2026-07-06', 'strzela zadanie, które pierwsze doszło do 3 (a: 05.07 → ławka 06.07), drugie czeka');
  }
  // --- pauza ---
  {
    const s = S0([T('a')]); P.penOn(s, s.tasks[0], '2026-07-01');
    s.pauses = [{ id: 'p', from: '2026-07-03', to: '2026-07-10', areas: null }];
    P.penSettle(s, '2026-07-11', rng0);
    ok(s.cm.a.n === 1 && !s.pen.b, 'pauza zamraża liczniki: w trakcie pauzy brak porażek (poza 02.07 i 11.07→n=1)');
    const s2 = S0([T('a')]); P.penOn(s2, s2.tasks[0], '2026-07-01'); P.penSettle(s2, '2026-07-04', rng0); // n=2 (02,03)
    s2.pauses = [{ id: 'p', from: '2026-07-05', to: '2026-07-06', areas: ['a1'] }];
    P.penSettle(s2, '2026-07-05', rng0); ok(s2.cm.a.n === 3 && s2.cm.a.rc === '2026-07-04', '3. porażka 04.07 wykryta rano 05.07, już w pauzie');
    // 3. porażka 04.07 wykryta rano 05.07 w trakcie pauzy → strzał czeka do końca pauzy
    ok(!s2.pen.b, 'strzał nie pada w trakcie pauzy listy');
    P.penSettle(s2, '2026-07-07', rng0); ok(s2.pen.b && s2.pen.b.from === '2026-07-07', 'po pauzie strzał pada pierwszego dnia po niej');
    // pauza innej listy nie blokuje
    const s3 = S0([T('a')]); P.penOn(s3, s3.tasks[0], '2026-07-01'); s3.pauses = [{ id: 'p', from: '2026-07-01', to: '2026-07-31', areas: ['a2'] }];
    P.penSettle(s3, '2026-07-05', rng0); ok(s3.pen.b && s3.pen.b.from === '2026-07-05', 'pauza innej listy nie wstrzymuje');
    // oddech zamrożony w pauzie listy ławki
    const s4 = S0([T('a'), T('b')]); P.penOn(s4, s4.tasks[0], '2026-07-01'); P.penOn(s4, s4.tasks[1], '2026-07-01');
    P.penSettle(s4, '2026-07-05', rng0); const u = s4.pen.b.tpl; live(s4, u, '2026-07-05', 'done');
    s4.pauses = [{ id: 'p', from: '2026-07-06', to: '2026-07-20', areas: null }];
    P.penSettle(s4, '2026-07-20', rng0); ok(P.penBreath(s4, '2026-07-20') === 2 && !s4.pen.b, 'oddech stoi w czasie pauzy');
    P.penSettle(s4, '2026-07-23', rng0); ok(s4.pen.b && s4.pen.b.from === '2026-07-23', 'po pauzie: oddech 21–22.07, strzał 23.07', JSON.stringify(s4.pen.b));
    ok(P.penGray({ pen: { b: { area: 'a1' } }, pauses: [{ id: 'p', from: '2026-07-01', to: '2026-07-31', areas: null }] }, '2026-07-10') === false && P.penGray({ pen: { b: { area: 'a1' } }, pauses: [] }, '2026-07-10') === true && P.penGray({ pen: { b: null }, pauses: [] }, '2026-07-10') === false, 'penGray: szarość trwa, w pauzie jej listy zdjęta, bez ławki brak');
  }
  // --- losowanie ---
  {
    const s = S0([T('a')], ['x', 'y', 'z']); const r = mk(7);
    const got = [P.penPick(s, r).t, P.penPick(s, r).t, P.penPick(s, r).t];
    ok(new Set(got).size === 3, 'trzy losowania z trzech kar: bez powtórzeń');
    const four = P.penPick(s, r); ok(['x', 'y', 'z'].includes(four.t) && s.pn.filter(p => p.u).length === 1, 'po wyczerpaniu puli odblokowanie wszystkich i nowy cykl');
    const one = S0([T('a')], ['tylko']); ok(P.penPick(one, r).t === 'tylko' && P.penPick(one, r).t === 'tylko', 'jedna kara: zawsze ta sama');
    ok(P.penPick(S0([T('a')], []), r) === null, 'pusta lista: brak losowania');
    const cnt = { x: 0, y: 0, z: 0 }, rr = mk(3), s2 = S0([T('a')], ['x', 'y', 'z']);
    for (let i = 0; i < 300; i++) cnt[P.penPick(s2, rr).t]++; ok(cnt.x === 100 && cnt.y === 100 && cnt.z === 100, 'w 300 losowaniach każda kara dokładnie 100 razy (cykle bez zwracania)', JSON.stringify(cnt));
  }
  // --- zasady włączania/wyłączania i edycji listy kar ---
  {
    const s = S0([T('a'), T('n', { k: 'none', days: [] }), { ...T('i'), tpl: 'a' }]);
    ok(P.penCanOn(s, s.tasks[0]).ok && P.penCanOn(s, s.tasks[1]).why === 'rep' && P.penCanOn(s, s.tasks[2]).why === 'rep', 'zobowiązanie tylko dla szablonów zadań cyklicznych');
    s.pn = []; ok(P.penCanOn(s, s.tasks[0]).why === 'pun' && !P.penOn(s, s.tasks[0], '2026-07-01'), 'bez kar nie da się włączyć zobowiązania');
    s.pn = [{ id: 'p', t: 'k', u: 0 }];
    ok(P.penOn(s, s.tasks[0], '2026-07-01') && P.penCanOn(s, s.tasks[0]).why === 'on', 'włączenie raz');
    ok(P.penCanOff(s, 'a').ok && P.penOff(s, 'a') && !s.cm.a, 'wyłączenie przy liczniku 0');
    P.penOn(s, s.tasks[0], '2026-07-01'); P.penSettle(s, '2026-07-03', rng0);
    ok(P.penCanOff(s, 'a').why === 'n' && !P.penOff(s, 'a') && s.cm.a, 'przy żółtej kartce wyłączyć nie można (wykonanie zeruje licznik)');
    P.penSettle(s, '2026-07-05', rng0); ok(P.penCanOff(s, 'a').why === 'bench', 'na ławce wyłączyć nie można');
    ok(!P.penPunDel(s, 'p').ok && P.penPunDel(s, 'p').why !== undefined, 'kary trwającej (i ostatniej przy zobowiązaniach) nie usuniesz');
    ok(P.penPunEdit(s, 'p', 'inna').why === 'busy', 'karę trwającą na ławce można edytować dopiero po zdjęciu ławki');
    const t = S0([T('a')]); ok(P.penPunAdd(t, 'n1', '  nowa  ').ok && t.pn.at(-1).t === 'nowa', 'dodanie kary (przycięcie spacji)');
    ok(P.penPunAdd(t, 'n2', '   ').why === 'empty', 'pusta kara odrzucona');
    P.penPunAdd(t, 'n3', 'c'); P.penPunAdd(t, 'n4', 'd'); ok(P.penPunAdd(t, 'n5', 'e').why === 'max' && t.pn.length === 6, 'najwyżej 6 kar');
    ok(P.penPunDel(t, 'n1').ok && t.pn.length === 5 && P.penPunEdit(t, 'n3', 'zmieniona').ok && t.pn.find(p => p.id === 'n3').t === 'zmieniona', 'edycja i usuwanie kar poza ławką');
    const u = S0([T('a')], ['jedyna']); ok(P.penPunDel(u, 'p0').ok && u.pn.length === 0, 'ostatnią karę można usunąć, gdy nie ma zobowiązań');
  }
  // --- cofanie wykonania ---
  {
    const s = S0([T('a')]); P.penOn(s, s.tasks[0], '2026-07-01'); P.penSettle(s, '2026-07-05', rng0);
    const sn = live(s, 'a', '2026-07-05', 'done');
    ok(!s.pen.b && s.cm.a.n === 0, 'wykonanie zdjęło ławkę');
    ok(P.penUndo(s, 'a', sn, '2026-07-05') && s.pen.b && s.pen.b.from === '2026-07-05' && s.cm.a.n === 3 && s.pen.h.length === 0 && P.penBreath(s, '2026-07-06') === 0, 'cofnięcie w ten sam dzień przywraca ławkę, licznik i brak oddechu');
    const sn2 = live(s, 'a', '2026-07-05', 'done'); ok(!P.penUndo(s, 'a', sn2, '2026-07-06'), 'cofnięcie następnego dnia nie przywraca (migawka tylko na dziś)');
    const s2 = S0([T('a')]); P.penOn(s2, s2.tasks[0], '2026-07-01'); ok(live(s2, 'a', '2026-07-02', 'done') === null, 'wykonanie przy liczniku 0 nic nie zmienia (brak migawki)');
  }
  {
    const s = S0([T('a'), T('b')]); P.penOn(s, s.tasks[0], '2026-07-01'); P.penOn(s, s.tasks[1], '2026-07-01');
    L(s, 'b', '2026-07-02', 'done'); L(s, 'b', '2026-07-03', 'done'); L(s, 'b', '2026-07-04', 'done');
    P.penSettle(s, '2026-07-05', rng0); const sn = live(s, 'a', '2026-07-05', 'done');
    s.pen.b = { tpl: 'b', title: 'B', pt: 'x', pid: 'p0', from: '2026-07-05', area: 'a1' }; s.cm.b.n = 3;
    ok(!P.penUndo(s, 'a', sn, '2026-07-05') && s.pen.b.tpl === 'b', 'cofnięcie nie nadpisuje innej, już trwającej ławki');
    const u = S0([T('a')], ['jedyna']); P.penOn(u, u.tasks[0], '2026-07-01');
    ok(P.penPunDel(u, 'p0').why === 'last' && u.pn.length === 1, 'ostatniej kary nie usuniesz, gdy działa zobowiązanie (nawet bez ławki)');
  }
  // --- sprzątanie danych ---
  {
    const s = S0([T('a')]); P.penOn(s, s.tasks[0], '2026-07-01'); s.cm.ghost = { from: '2026-07-02', n: 1, rc: null };
    ok(P.penSanitize(s, false) === 1 && s.cm.ghost, 'penSanitize bez fix tylko liczy');
    ok(P.penSanitize(s, true) === 1 && !s.cm.ghost && s.cm.a, 'penSanitize usuwa zobowiązanie bez szablonu');
    P.penSettle(s, '2026-07-05', rng0); s.tasks[0].st = 'arch'; P.penSettle(s, '2026-07-06', rng0);
    ok(!s.cm.a && !s.pen.b, 'zarchiwizowany szablon: zobowiązanie i ławka znikają');
    const z = S0([T('a')]); P.penOn(z, z.tasks[0], '2026-07-01'); z.tasks[0].rep = { k: 'none', days: [] }; P.penSettle(z, '2026-07-04', rng0); ok(!z.cm.a, 'szablon bez powtarzania traci zobowiązanie');
  }
  // --- przełom roku i zmiany czasu ---
  {
    const s = S0([T('a')]); P.penOn(s, s.tasks[0], '2026-12-30'); P.penSettle(s, '2027-01-03', rng0);
    ok(s.cm.a.n === 3 && s.pen.b && s.pen.b.from === '2027-01-03', 'przełom roku: porażki 31.12, 01.01, 02.01 → ławka 03.01', JSON.stringify(s.pen.b));
    const d = S0([T('a')]); P.penOn(d, d.tasks[0], '2026-10-23'); P.penSettle(d, '2026-10-28', rng0);
    ok(d.cm.a.n === 3 && d.pen.b && d.pen.b.from === '2026-10-27', 'zmiana czasu (25.10): dni liczone bez przesunięć');
    const m = S0([T('a')]); P.penOn(m, m.tasks[0], '2026-03-26'); P.penSettle(m, '2026-03-31', rng0);
    ok(m.cm.a.n === 3 && m.pen.b && m.pen.b.from === '2026-03-30', 'zmiana czasu wiosną (29.03)');
  }
  // --- historia i limity ---
  {
    const s = S0([T('a')], ['k']); s.pen.h = Array.from({ length: 105 }, (_, i) => ({ tpl: 'a', title: 't', pt: 'k', from: 'x', to: 'y' + i }));
    s.pen.b = { tpl: 'a', title: 'A', pt: 'k', pid: 'p0', from: '2026-07-01', area: 'a1' }; P.penLift(s, '2026-07-02');
    ok(s.pen.h.length === 100 && s.pen.h.at(-1).to === '2026-07-02', 'historia ławki ograniczona do 100 wpisów');
  }

  // --- symulacja losowa z niezmiennikami ---
  {
    let bad = '', shots = 0, runs = 0;
    for (let seed = 1; seed <= 400 && !bad; seed++) {
      const r = mk(seed), s = S0([T('a'), T('b', { k: 'days', days: [1, 3, 5] }), T('c', { k: 'days', days: [6] })], ['k1', 'k2', 'k3', 'k4']);
      let td = '2026-06-01'; const ids = ['a', 'b', 'c']; ids.forEach(id => P.penOn(s, s.tasks.find(t => t.id === id), td));
      let lastLift = null; const bench = []; 
      for (let i = 0; i < 120 && !bad; i++) {
        td = A(td, 1); const skip = r() < 0.12; // dzień bez otwarcia aplikacji
        if (skip) continue;
        const prevB = s.pen.b;
        P.penSettle(s, td, r);
        if (s.pen.b && (!prevB || prevB.from !== s.pen.b.from)) { shots++; bench.push(s.pen.b.from); if (lastLift && s.pen.b.from < A(lastLift, 3)) bad = `seed ${seed}: strzał ${s.pen.b.from} wcześniej niż 3 dni po zdjęciu ${lastLift}`; }
        // dzisiejsze działania „na żywo”
        for (const id of ids) { const x = r(); if (x < 0.35) { const wasB = s.pen.b && s.pen.b.tpl === id, sn = live(s, id, td, 'done'); if (wasB && !s.pen.b) lastLift = td; } else if (x < 0.5) L(s, id, td, 'f'); else if (x < 0.6) L(s, id, td, 'p'); }
        // niezmienniki
        for (const id of ids) { const e = s.cm[id]; if (!e) { bad = `seed ${seed}: brak cm ${id}`; break; } if (e.n < 0 || e.n > 3) bad = `seed ${seed}: n=${e.n}`; if (e.n < 3 && e.rc) bad = `seed ${seed}: rc bez 3`; }
        if (s.pen.b && s.cm[s.pen.b.tpl].n !== 3) bad = `seed ${seed} ${td}: ławka przy n=${s.cm[s.pen.b.tpl].n}`;
        if (s.pen.b && s.cm[s.pen.b.tpl].rc) bad = `seed ${seed}: ławka i rc`;
        if (s.pen.ev.length > 20 || s.pen.h.length > 100) bad = `seed ${seed}: limity`;
        const copy = JSON.stringify(s); P.penSettle(s, td, r); if (JSON.stringify(s) !== copy) bad = `seed ${seed} ${td}: rozliczenie nieidempotentne`;
      }
      runs++;
    }
    ok(!bad && shots > 100, `400 symulacji po 120 dni: niezmienniki spełnione (${shots} strzałów)`, bad);
  }
}

const src = load('test/index.html');
if (!src) { console.log('Brak bloku PEN w test/index.html'); process.exit(1); }
suite('test/index.html', src);
console.log(`\nWynik: ${pass} ok, ${fail} błędów`);
process.exit(fail ? 1 : 0);
