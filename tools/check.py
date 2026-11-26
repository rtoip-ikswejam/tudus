#!/usr/bin/env python3
"""Kontrola przed wydaniem Tudusia. Uruchomienie z katalogu głównego repo:  python3 tools/check.py
Kod wyjścia 1 = jest błąd (nie wydawać). Ostrzeżenia nie blokują."""
import json, os, re, subprocess, sys, tempfile

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
errors, warns = [], []
def err(m): errors.append(m); print('  BŁĄD   ' + m)
def warn(m): warns.append(m); print('  uwaga  ' + m)
def ok(m): print('  ok     ' + m)
def rd(p): return open(os.path.join(ROOT, p), encoding='utf8').read()
def exists(p): return os.path.exists(os.path.join(ROOT, p))

def node_check(label, code):
    with tempfile.NamedTemporaryFile('w', suffix='.js', delete=False, encoding='utf8') as f:
        f.write(code); name = f.name
    try:
        r = subprocess.run(['node', '--check', name], capture_output=True, text=True)
    except FileNotFoundError:
        warn('brak node: pomijam sprawdzanie składni'); return None
    finally:
        os.unlink(name)
    if r.returncode: err(f'składnia JS: {label}: ' + r.stderr.strip().splitlines()[-1][:160] + '  | ' + (r.stderr.strip().splitlines()[1][:120] if len(r.stderr.strip().splitlines()) > 1 else ''))
    return r.returncode == 0

def check_dir(d):
    pre = d + '/' if d else ''
    name = d or 'produkcja (root)'
    print(f'\n== {name} ==')
    if not exists(pre + 'index.html') or not exists(pre + 'sw.js'):
        err(f'{name}: brak index.html lub sw.js'); return
    html, sw = rd(pre + 'index.html'), rd(pre + 'sw.js')

    # 1. wersje
    mv = re.search(r"const V='([^']+)'", html)
    ms = re.search(r"const VER\s*=\s*'([^']+)'", sw) or re.search(r"const C\s*=\s*'kanban-([^']+)'", sw)
    sp = re.search(r'id="spv">v([^<]+)<', html)
    if not mv or not ms: err(f'{name}: nie znaleziono wersji w index.html lub sw.js')
    else:
        if mv.group(1) != ms.group(1): err(f'{name}: wersja w index.html ({mv.group(1)}) != sw.js ({ms.group(1)})')
        elif sp and sp.group(1) != mv.group(1): err(f'{name}: wersja na splashu ({sp.group(1)}) != V ({mv.group(1)})')
        else: ok(f'wersja {mv.group(1)} spójna (index.html, sw.js, splash)')

    # 2. składnia JS
    scripts = re.findall(r'<script>(.*?)</script>', html, re.S)
    good = all(node_check(f'{pre}index.html <script #{i}>', s) is not False for i, s in enumerate(scripts))
    for f in ['sw.js', 'themes.js', 'lang/pl.js', 'lang/en.js']:
        if exists(pre + f): good = (node_check(pre + f, rd(pre + f)) is not False) and good
    if good: ok('składnia JS wszystkich skryptów')

    # 3. pliki w SW, skrypty, ikony
    lists = re.findall(r"const (?:NEED|OPT)\s*=\s*\[(.*?)\]", sw, re.S)
    files = [x for l in lists for x in re.findall(r"'([^']+)'", l)]
    miss = [f for f in files if f != './' and not exists(pre + f)]
    if miss: err(f'{name}: sw.js wymienia nieistniejące pliki: {miss}')
    else: ok(f'{len(files)} plików z listy service workera istnieje')
    miss = [s for s in re.findall(r'<script[^>]+src="([^"]+)"', html) if not exists(pre + s)]
    if miss: err(f'{name}: index.html ładuje nieistniejące skrypty: {miss}')
    if exists(pre + 'manifest.json'):
        try:
            icons = [i['src'] for i in json.loads(rd(pre + 'manifest.json')).get('icons', [])]
            miss = [i for i in icons if not exists(pre + i)]
            if miss: err(f'{name}: manifest.json wskazuje brakujące ikony: {miss}')
        except Exception as e: err(f'{name}: manifest.json nie jest poprawnym JSON: {e}')

    # 4. tłumaczenia
    if exists(pre + 'lang/en.js'):
        en = set(re.findall(r'^"((?:[^"\\]|\\.)*)"\s*:', rd(pre + 'lang/en.js'), re.M))
        pl = set(re.findall(r'^"((?:[^"\\]|\\.)*)"\s*:', rd(pre + 'lang/pl.js'), re.M)) if exists(pre + 'lang/pl.js') else en
        if en != pl: warn(f'{name}: lang/pl.js i lang/en.js mają różne klucze ({len(en ^ pl)} różnic)')
        used = set(re.findall(r"\btr\('((?:[^'\\]|\\.)*)'", html))
        used = {u.replace("\\'", "'").replace('\\\\', '\\') for u in used}
        unk = sorted(u for u in used if u.replace('"', '\\"') not in en and u not in en)
        if unk: warn(f'{name}: {len(unk)} tekstów w tr() bez tłumaczenia EN, np.: {unk[:3]}')
        else: ok('wszystkie teksty w tr() mają tłumaczenie EN')

    # 4b. blok agregacji (testowany osobno) musi mieć oba znaczniki
    if 'AGG-BEGIN' in html and 'AGG-END' not in html: err(f'{name}: blok AGG ma znacznik początku bez końca')
    if 'PAUSE-BEGIN' in html and ('PAUSE-END' not in html or 'AGG-BEGIN' not in html): err(f'{name}: blok PAUSE wymaga znacznika końca i bloku AGG')
    if 'BALANCE-BEGIN' in html and ('BALANCE-END' not in html or 'PAUSE-BEGIN' not in html): err(f'{name}: blok BALANCE wymaga znacznika końca i bloku PAUSE')
    ms = re.search(r'SCHEMA=(\d+)', html)
    if 'AGG-BEGIN' in html and (not ms or int(ms.group(1)) < 3): err(f'{name}: agregacja wymaga SCHEMA>=3')

    # 4c. doodle: manifest wskazuje istniejące moduły, silnik i teksty
    if exists(pre + 'doodle/manifest.json'):
        try:
            man = json.loads(rd(pre + 'doodle/manifest.json'))
            fl = [man.get('engine', 'engine.js')] + [x['file'] for k in ('tla', 'postacie', 'pogoda') for x in man.get(k, [])] + ['teksty/pl.js', 'teksty/en.js']
            miss = [f for f in fl if not exists(pre + 'doodle/' + f)]
            if miss: err(f'{name}: manifest doodle wskazuje brakujące pliki: {miss}')
            else:
                good = all(node_check(pre + 'doodle/' + f, rd(pre + 'doodle/' + f)) is not False for f in fl)
                if good: ok(f'doodle: {len(fl)} plików modułów istnieje i ma poprawną składnię')
            for k in ('postacie', 'pogoda'):
                for x in man.get(k, []):
                    bad = [s for s in (x.get('seasons') or []) if s not in [t['id'] for t in man.get('tla', [])]]
                    if bad: err(f"{name}: doodle {k}/{x['id']} wymienia nieznane tła: {bad}")
            sw_t = rd(pre + 'sw.js')
            if 'doodle/manifest.json' not in sw_t: err(f'{name}: sw.js nie zapisuje w cache doodle/manifest.json')
        except Exception as e: err(f'{name}: doodle/manifest.json: {e}')

    # 5. izolacja środowiska testowego
    if d == 'test':
        if "K=IS_TEST?'kanban-v1-test':'kanban-v1'" not in html: err('test: klucz danych K nie przełącza się na kanban-v1-test')
        if "LK=IS_TEST?'kanban-log-test':'kanban-log'" not in html: err('test: klucz dziennika LK nie przełącza się na kanban-log-test')
        if re.search(r"setItem\(\s*(?:'kanban-v1'|PK)\b", html) or re.search(r"removeItem\(\s*(?:'kanban-v1'|PK)\b", html):
            err('test: kod zapisuje lub usuwa klucz PRODUKCYJNY (kanban-v1)')
        else: ok('kod testowy nie zapisuje do klucza produkcyjnego')

# skrypty testowe: składnia (uszkodzony test nie może przejść niezauważony)
print('\n== tools/*.mjs ==')
import glob
bad = []
for f in sorted(glob.glob(os.path.join(ROOT, 'tools', '*.mjs'))):
    try:
        r = subprocess.run(['node', '--check', f], capture_output=True, text=True)
        if r.returncode: bad.append(os.path.basename(f) + ': ' + (r.stderr.strip().splitlines() or ['?'])[-1][:100])
    except FileNotFoundError:
        warn('brak node: pomijam sprawdzanie składni testów'); break
if bad: [err('składnia skryptu testowego: ' + b) for b in bad]
else: ok('składnia wszystkich skryptów w tools/*.mjs')

for d in ['', 'test']: check_dir(d)

print(f'\nWynik: {len(errors)} błędów, {len(warns)} uwag')
sys.exit(1 if errors else 0)
