// Testy rdzenia pauzy (blok PAUSE-BEGIN..PAUSE-END w index.html), bez DOM.
// Uruchomienie:  node tools/pause.test.mjs
process.env.TZ = 'Europe/Warsaw';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
let pass = 0, fail = 0;
const ok = (c, name, info = '') => { c ? pass++ : fail++; console.log((c ? '  ok   ' : '  FAIL ') + name + (c || !info ? '' : '  → ' + info)); };

function load(file) {
  const src = fs.readFileSync(path.join(ROOT, file), 'utf8');
  const agg = src.match(/\/\* AGG-BEGIN[\s\S]*?\/\* AGG-END \*\//), pz = src.match(/\/\* PAUSE-BEGIN[\s\S]*?\/\* PAUSE-END \*\//);
  if (!agg || !pz) return null;
  return new Function(agg[0] + pz[0] + '\nreturn{aAdd,pauseOn,pauseWeekDays,pauseActive,pauseOk,pauseHeld};')();
}

function suite(label, P) {
  console.log(`\n=== ${label} ===`);
  const P1 = { id: 'p1', from: '2026-07-10', to: '2026-07-20', areas: null };
  const s = { areas: [{ id: 'a1' }, { id: 'a2' }], pauses: [P1] };

  // aAdd
  ok(P.aAdd('2026-03-28', 1) === '2026-03-29' && P.aAdd('2026-03-28', 2) === '2026-03-30', 'aAdd: przejście na czas letni');
  ok(P.aAdd('2026-10-24', 2) === '2026-10-26', 'aAdd: przejście na czas zimowy');
  ok(P.aAdd('2025-12-31', 1) === '2026-01-01' && P.aAdd('2026-01-01', -1) === '2025-12-31', 'aAdd: przełom roku w obie strony');
  ok(P.aAdd('2024-02-28', 1) === '2024-02-29' && P.aAdd('2026-02-28', 1) === '2026-03-01', 'aAdd: rok przestępny');

  // pauseOn
  ok(!P.pauseOn(s, 'a1', '2026-07-09') && P.pauseOn(s, 'a1', '2026-07-10') && P.pauseOn(s, 'a1', '2026-07-20') && !P.pauseOn(s, 'a1', '2026-07-21'), 'pauseOn: granice włącznie (od i do)');
  ok(P.pauseOn(s, 'a1', '2026-07-15') && P.pauseOn(s, 'a2', '2026-07-15'), 'pauseOn: areas=null obejmuje wszystkie listy');
  const s2 = { areas: s.areas, pauses: [{ id: 'q', from: '2026-07-10', to: '2026-07-20', areas: ['a2'] }] };
  ok(!P.pauseOn(s2, 'a1', '2026-07-15') && P.pauseOn(s2, 'a2', '2026-07-15'), 'pauseOn: pauza tylko dla wybranej listy');
  ok(!P.pauseOn({ areas: [] }, 'a1', '2026-07-15') && !P.pauseOn({ pauses: [] }, 'a1', '2026-07-15'), 'pauseOn: brak pauz (undefined i pusta lista)');
  const s3 = { areas: s.areas, pauses: [P1, { id: 'z', from: '2026-07-18', to: '2026-07-25', areas: null }] };
  ok(P.pauseOn(s3, 'a1', '2026-07-23') && P.pauseOn(s3, 'a1', '2026-07-12'), 'pauseOn: nakładające się pauzy');

  // pauseWeekDays (tydzień od poniedziałku)
  ok(P.pauseWeekDays(s, 'a1', '2026-07-13') === 7, 'pauseWeekDays: tydzień w całości w pauzie = 7');
}
function suite2(label, P) {
  const s = { areas: [{ id: 'a1' }, { id: 'a2' }], pauses: [{ id: 'p1', from: '2026-07-10', to: '2026-07-20', areas: null }] };
  // 6-12 lipca 2026 (pn-nd): pauza od 10 (piątek) => 10, 11, 12 = 3 dni
  ok(P.pauseWeekDays(s, 'a1', '2026-07-06') === 3, 'pauseWeekDays: pauza od piątku daje 3 dni w tym tygodniu');
  ok(P.pauseWeekDays(s, 'a1', '2026-07-20') === 1, 'pauseWeekDays: ostatni dzień pauzy w poniedziałek = 1');
  ok(P.pauseWeekDays(s, 'a1', '2026-07-27') === 0 && P.pauseWeekDays(s, 'a1', '2026-06-29') === 0, 'pauseWeekDays: tygodnie bez pauzy = 0');
  const s2 = { areas: s.areas, pauses: [{ id: 'q', from: '2026-07-10', to: '2026-07-20', areas: ['a2'] }] };
  ok(P.pauseWeekDays(s2, 'a1', '2026-07-13') === 0 && P.pauseWeekDays(s2, 'a2', '2026-07-13') === 7, 'pauseWeekDays: liczy tylko dla listy objętej pauzą');

  // pauseActive
  const s3 = { areas: s.areas, pauses: [{ id: 'k', from: '2026-07-10', to: '2026-07-14', areas: null }, { id: 'd', from: '2026-07-12', to: '2026-07-25', areas: null }, { id: 'o', from: '2026-07-01', to: '2026-07-30', areas: ['a2'] }] };
  ok(P.pauseActive(s3, 'a1', '2026-07-13').id === 'd', 'pauseActive: przy nakładaniu wybiera pauzę kończącą się najpóźniej');
  ok(P.pauseActive(s3, 'a1', '2026-07-28') === null && P.pauseActive(s3, 'a2', '2026-07-28').id === 'o', 'pauseActive: respektuje listę i daty; brak = null');

  // pauseOk
  const good = { id: 'x', from: '2026-07-10', to: '2026-07-10', areas: null };
  ok(P.pauseOk(good) && P.pauseOk({ ...good, areas: ['a1'] }), 'pauseOk: poprawne (jednodniowa, null i lista)');
  ok(!P.pauseOk({ ...good, from: '2026-07-11' }) && !P.pauseOk({ ...good, from: '2026-7-1' }) && !P.pauseOk({ ...good, to: 'jutro' }), 'pauseOk: odrzuca odwrócone i błędne daty');
  ok(!P.pauseOk({ ...good, areas: [] }) && !P.pauseOk({ ...good, id: 5 }) && !P.pauseOk(null) && !P.pauseOk({ ...good, areas: 'a1' }), 'pauseOk: odrzuca pustą listę, zły id, null, areas nie-tablicę');

  // pauseHeld
  const T = (id, extra) => ({ id, area: 'a1', t: id, st: 'todo', at: '2026-07-12', rep: { k: 'none', days: [] }, ...extra });
  const st = {
    areas: s.areas, pauses: [],
    tasks: [T('w'), T('edge1', { at: '2026-07-10' }), T('edge2', { at: '2026-07-20' }), T('before', { at: '2026-07-09' }), T('after', { at: '2026-07-21' }),
      T('noat', { at: undefined }), T('prog', { st: 'prog' }), T('arch', { st: 'arch' }), T('idea', { st: 'idea' }),
      T('tpl', { tpl: 'x' }), T('rep', { rep: { k: 'daily', days: [] } }), T('a2', { area: 'a2' })],
  };
  const ids = p => P.pauseHeld(st, p).map(t => t.id).sort().join();
  ok(ids({ id: 'p', from: '2026-07-10', to: '2026-07-20', areas: null }) === 'a2,edge1,edge2,w', 'pauseHeld: tylko zadania do zrobienia z datą w zakresie (włącznie z granicami), bez cyklicznych i innych statusów', ids({ id: 'p', from: '2026-07-10', to: '2026-07-20', areas: null }));
  ok(ids({ id: 'p', from: '2026-07-10', to: '2026-07-20', areas: ['a2'] }) === 'a2', 'pauseHeld: pauza tylko dla jednej listy bierze tylko jej zadania');
  ok(ids({ id: 'p', from: '2026-08-01', to: '2026-08-05', areas: null }) === '', 'pauseHeld: brak zadań w zakresie = pusta lista');
  ok(P.pauseHeld({ areas: [], tasks: undefined }, { from: 'a', to: 'b', areas: null }).length === 0, 'pauseHeld: brak tasks nie rzuca wyjątku');
}

const t = load('test/index.html');
if (!t) { console.log('Brak bloków AGG/PAUSE w test/index.html'); process.exit(1); }
suite('test/index.html', t); suite2('test/index.html', t);
const r = load('index.html');
if (r) { suite('index.html (produkcja)', r); suite2('index.html (produkcja)', r); } else console.log('\n(produkcja nie ma jeszcze bloku PAUSE: pomijam)');

console.log(`\nWynik: ${pass} ok, ${fail} błędów`);
process.exit(fail ? 1 : 0);
