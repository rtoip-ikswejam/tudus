# Tuduś: przekazanie do nowej rozmowy (stan: produkcja 1.23.1, test 1.24.1 (system kar))

## Czym jest
Prywatna aplikacja do zadań (PWA) na GitHub Pages. Jeden plik `index.html` (cała logika), dane w `localStorage`, bez serwera. Interfejs po polsku, tłumaczenia EN w `lang/*.js` (funkcja `tr('polski tekst')`, każdy nowy tekst musi mieć wpis w `lang/pl.js` i `lang/en.js`; `tools/check.py` pilnuje).

## Układ repozytorium
- Katalog główny = **produkcja**: `index.html`, `sw.js`, `manifest.json`, `themes.js`, `lang/`, `doodle/`, ikony, `README.md`.
- `test/` = **wersja testowa**: te same pliki co w głównym. `index.html` i `sw.js` rozpoznają środowisko po ścieżce (`/test/` → klucz danych `kanban-v1-test`, osobny service worker). Wejście do testu kopiuje dane z produkcji (tylko w jedną stronę).
- `doodle/`: silnik izometrycznych scen (`engine.js`), moduły `tla/ postacie/ pogoda/`, `teksty/pl.js|en.js`, `manifest.json` (lista modułów, wagi, ograniczenia sezonów).
- `tools/`: testy i kontrole (patrz niżej). `.github/workflows/check.yml` uruchamia je po każdym wgraniu.

## Dane (`S`, klucz `kanban-v1`, schemat 3)
`tasks[]` (st: prog/todo/idea/done/closed/arch; pola m.in. `at`, `exp`, `rep`, `cnt`, `n`, `sp`, `br`, `late`), `log[]` (wpisy res: done/fail, k: p=odłożone, f=porażka), `wk{}` (tygodniowe agregaty na listę: d,f,p,ce,cl,r,sm,sn,sc), `reasons[]`, `areas[]`, `coins`, `rate`, `shop[]`, `pauses[]`, `dd{}` (doodle: on, speed, shown, scene, msg, recent, seen), `spr[]` (sprinty), `sprint{}` (aktywny), `keep` (0|2|3|4 tygodnie szczegółów), `cmp`, `last`, `created`.

## Funkcje (stan na 1.23.1)
Porządkowanie danych (agregacja do tygodni, transakcyjnie z weryfikacją sum), pauza (wakacje/choroba), doodle dnia (10 postaci, komunikaty A/B/C z danych), bilans list (wskaźnik względem własnej normy), Ustawienia w 6 zwijanych grupach, formularz zadania w grupach, sprint (minutnik, przerwa informacyjnie), „Często odkładane” w Statystykach.

## Kod w blokach z markerami (czyste funkcje, testowane osobno)
`AGG-BEGIN/END`, `PAUSE-BEGIN/END`, `PEN-BEGIN/END`, `DOODLE-BEGIN/END`, `BALANCE-BEGIN/END` w `index.html`.

## Proces pracy (ważne)
1. Zmiany robimy w `test/`, wersja w `V` (index.html), `VER` (sw.js) i na splashu (`id="spv"`).
2. Paczka **„zmiany”** (`test/` + `tools/`) → użytkownik wgrywa i testuje na telefonie.
3. Po jego zgodzie paczka **„produkcja”** (pliki z `test/` bajt w bajt do katalogu głównego + `doodle/` + `README.md` + `tools/`).
4. **Zawsze najpierw testy na katalogu roboczym, dopiero potem pakowanie**, a potem weryfikacja na czystym zrzucie (oryginał + poprzednia produkcja + zmiany + produkcja).
5. Po „zrób produkcję” użytkownik oczekuje: paczka zip + krótka instrukcja wgrania + opis zmian + jak cofnąć.

## Testy (`cd tools && npm ci`)
`python3 tools/check.py` (składnia, wersje, pliki, tłumaczenia, izolacja testu), `node agg.test.mjs`, `pause.test.mjs`, `doodle.test.mjs`, `balance.test.mjs` (rdzeń bez DOM), `pen.test.mjs`, `node smoke.mjs` (uruchamia aplikację w jsdom 24.1.3, ok. 390 asercji, ~2 min). Nowe funkcje dostają testy jednostkowe i dymne; warto robić „mutacje” (psuć kod i sprawdzać, czy testy zawodzą).

## Lekcje z błędów (nie powtarzać)
- Testy w jsdom **nie wykonują animacji CSS, dźwięku, wake locka ani wibracji**: te rzeczy sprawdza tylko użytkownik na telefonie. Kolizja klasy `.spin` (istniejące kółko ładowania) wirowała cały ekran sprintu; teraz test skanuje reguły CSS pod kątem animacji.
- Średnie liczone „z 4 tygodni” dawały zera sprzed używania aplikacji (bilans, doodle). Zawsze liczyć od pierwszego śladu aktywności i testować krótką historię (dwa tygodnie).
- Dane testowe z długą historią ukrywają błędy; prawdziwe dane są krótsze i nieregularne.

## Do zrobienia (lista zaległości)
Liczby osobiste w „Zrobione” (rekord tygodnia, seria, kamienie milowe), warianty kolorystyczne postaci, jednorożec, galeria odkrytych postaci, alarm w tle przez ntfy (opcjonalnie), eksport podsumowania do wklejenia asystentowi, układ repozytorium `main`/`dev`, ~~system kar~~ (wdrożony w `test/` 1.24.1, czeka na test na telefonie i zgodę na produkcję; patrz `SYSTEM-KAR.md`).
