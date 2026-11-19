# Narzędzia kontrolne

Dwie kontrole, które powinny przejść **przed** każdym wydaniem (na GitHubie robi to automatycznie `.github/workflows/check.yml`: czerwony krzyżyk przy commicie = nie wydawać).

| Co | Polecenie | Sprawdza |
|---|---|---|
| Kontrola statyczna | `python3 tools/check.py` | składnię JS, zgodność wersji (`V` w index.html = sw.js = splash), czy pliki z listy service workera istnieją, tłumaczenia EN, izolację środowiska testowego (kod `/test/` nie może pisać do klucza produkcyjnego) |
| Test dymny | `cd tools && npm install && node smoke.mjs` | uruchamia aplikację (produkcję i `/test/`) w jsdom: start bez błędów, kopię danych prod → test, brak miejsca przy kopiowaniu, odświeżenie kopii, liczniki, kolejność zadań, interfejs EN |

Ograniczenia: jsdom nie ma service workera ani prawdziwego localStorage z limitem 5 MB, więc aktualizacje offline i przepełnienie trzeba nadal sprawdzić ręcznie na telefonie (Ustawienia → Diagnostyka).

## Przebieg wydania

1. Zmiany idą do `test/` (nowa wersja w `V`, `VER` w `test/sw.js` i na splashu).
2. Wejście na `/test/` kopiuje dane produkcyjne do osobnej bazy (`kanban-v1-test`). Kopia jest jednokierunkowa: prod → test.
3. Ręczny przegląd na telefonie, potem `tools/check.py` i `smoke.mjs` na zielono.
4. Promocja: zawartość `test/` (index.html, sw.js, lang/, themes.js) trafia do katalogu głównego. Pierwsza promocja koniecznie z nowym `sw.js` (stary kasuje cache testu).
5. Przed pierwszym uruchomieniem nowego schematu danych: kopia zapasowa (Ustawienia → Zapisz kopię).
