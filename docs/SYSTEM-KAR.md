# System kar: zasady ustalone z użytkownikiem (wdrożone w 1.24.0, tylko w `test/`)

Terminologia z futbolu: **żółta kartka**, **druga żółta (ostatnie ostrzeżenie)**, **czerwona kartka**, **karna ławka**. Zero wyjątków kalendarzowych poza **Pauzą**. Opt-in, bez autoironii. Kary pisze użytkownik; w kodzie nie ma żadnej stałej kary.

## Zasady
1. **Zakres:** tylko szablony zadań cyklicznych (codziennie, wybrane dni tygodnia, raz w tygodniu) z włączonym polem „Zobowiązanie” (formularz zadania). Włączenie liczy się **od następnego dnia**. Licznik jest przypięty do szablonu (`S.cm[idSzablonu]`), nie do dziennej kopii.
2. **Porażka:** wystąpienie zadania bez wykonania do końca dnia (sprawdzane następnego dnia, także dni bez otwarcia aplikacji) albo świadomie zapisana porażka (k=f). **Odłożenie (k=p) nie jest porażką** (także na inną datę) i nie zeruje licznika. Wykonanie > porażka > samo odłożenie. Dzień bez śladu = porażka.
3. **Próg:** 3 porażki z rzędu dla danego zadania, niezależnie od częstotliwości (pn/śr/pt: po trzecim niewykonanym wystąpieniu; raz w tygodniu: po 3 tygodniach). 1. = żółta, 2. = druga żółta, 3. = czerwona. Każde wykonanie zeruje licznik (także w trakcie ławki).
4. **Strzał:** rano dnia po 3. porażce losuje się karę z listy użytkownika i zaczyna się **karna ławka** (data ławki = ten dzień, także gdy aplikacji nie otwarto). Kolejne liczniki w czasie ławki rosną do 3 i czekają (bez drugiej kary). Wykonanie czekającego zadania odwołuje jego strzał.
5. **Ławka trwa, dopóki użytkownik nie wykona zadania, które ją wywołało.** Kara jest dodatkiem: wykonuje się ją tego samego dnia, **nie ma przycisku „Wykonane”** ani statystyki wykonania. Brak kary za karę.
6. **Oddech:** po zdjęciu ławki 2 dni bez strzałów (liczone od daty zdjęcia, dni pauzy listy ławki nie liczą się). Potem czekające zadania strzelają po jednym, w kolejności dojścia do 3.
7. **Pauza:** zamraża liczniki (dni pauzy nie są porażkami), strzały (per lista), oddech; w czasie pauzy listy ławki szarość jest zdjęta, ławka czeka.
8. **Lista kar:** własna, 0–6 pozycji, **domyślnie pusta**; zobowiązanie wymaga co najmniej 1 kary. Tylko tekst (np. „50 pompek”). Losowanie bez zwracania; wylosowana kara zablokowana do wyczerpania puli, potem odblokowują się wszystkie. Użytkownik nie blokuje kar sam. Kary trwającej nie edytuje i nie usuwa; ostatniej kary nie usunie, dopóki są zobowiązania. Ostrzeżenie o bolesnych/szkodliwych karach i odpowiedzialności w ustawieniach.
9. **Wyłączanie:** zobowiązanie wyłączysz tylko przy liczniku 0 i bez ławki (po wykonaniu zadania). Osobnego przycisku „wyłącz system kar” nie ma: system wyłącza się przez usunięcie zobowiązań. Zadania ze zobowiązaniem nie da się zarchiwizować, zmienić na niepowtarzalne ani usunąć razem z listą.
10. **Furtka odkładania** (odłóż wciąż na kolejny dzień) zostaje na uczciwości.
11. **Wygląd:** na ławce szarość całej aplikacji (`html.bench`, filtr CSS), baner „Karna ławka” w Dzisiaj ze szczegółami, doodle wyłączony. Znaczki 🟨/🟨🟨/🟥 przy zadaniach.

## Dane
`S.cm={idSzablonu:{from,n,rc}}`, `S.pn=[{id,t,u}]`, `S.pen={b,lf,ba,h,ev,chk}` (ławka, dzień zdjęcia, lista, historia ≤100, komunikaty, ostatni rozliczony dzień). Migawka cofania w wpisie dziennika (`cs`), ważna tylko tego samego dnia. Schemat bez zmian (3), pola opcjonalne.

## Kod
Blok `PEN-BEGIN/END` w `index.html` (czyste funkcje), testy `tools/pen.test.mjs` i sekcje `[P1]–[P6]` w `smoke.mjs`. Rozliczenie: `penRun` w `roll()` po wygasaniu zadań, przed generowaniem cyklicznych. Wygasanie kopii zadań ze zobowiązaniem działa jak „wygasające” (porażka k=f, monety jak przy wygasaniu).

## Do sprawdzenia na telefonie (jsdom tego nie widzi)
Szarość całej aplikacji razem z oknami dialogowymi i paskiem u dołu, wyłączenie doodla, czytelność banera, działanie po północy przy otwartej aplikacji.
