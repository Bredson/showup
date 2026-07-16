# PRD — Showup (droga do 100 pompek)

> Dokument roboczy (PL). Fundamenty: [`fitness-research.md`](./fitness-research.md) (nauka +
> architektura forka), [`pushup-program-research.md`](./pushup-program-research.md) (program
> „Speirs-core hybrid"), metoda TITD: [`titd-method.pl.md`](./titd-method.pl.md).
> Status: **zaakceptowany** (decyzje użytkownika 2026-07-14/15: nazwa „Showup", cel v1 = tylko
> 100 pompek, fork Unstuck, check samopoczucia/energii, stałe dni sesji + przesunięcie o 1).
> Po niezależnym review 2026-07-15 (FIX FIRST) — poprawki naniesione tu i w data-model.md §8.

## 1. Wizja

Aplikacja prowadząca od dowolnej bazy (nawet 0) do **100 pompek z rzędu** — metodą nawykową,
nie sprintem motywacyjnym. Siostra Unstuck: ta sama filozofia (CBT + micro-self-management,
samowspółczucie, zero presji), inna domena i inna progresja.

**Zasady nadrzędne:**
1. **Nawyk = pokazanie się, nie wynik** (Phillips & Gardner 2016: nawyk inicjacji przewiduje
   częstość ćwiczeń). Passa nagradza obecność (2-min minimum), nigdy liczbę powtórzeń.
2. **Decyduje twój test, nie kalendarz.** Awans tylko przez zdany test zdolności; realny
   horyzont od bazy 10 pompek to ~5–7 miesięcy i appka mówi to wprost.
3. **Bezpieczeństwo wbudowane w pętlę** — check samopoczucia steruje auto-dostosowaniem,
   deloady i dni odpoczynku są funkcją, nie przeszkodą.

## 2. Decyzje produktowe

| Decyzja | Wybór | Konsekwencja |
|---|---|---|
| Platforma / dane / języki | jak Unstuck: PWA, 100% lokalnie, PL+EN | odziedziczone z forka bez zmian |
| Relacja do Unstuck | **fork siostrzany** (opcja c z fitness-research) | wspólna historia gita → cherry-pick fixów; brak wspólnego pakietu core do czasu realnego bólu |
| Cel v1 | **tylko 100 pompek** | jedna rzecz porządnie; architektura programu generyczna, ale bez drugiego programu w MVP |
| System treningowy | **hybryda „Speirs-core"** | 3x/tydz. + drabinka wariantów BWF + łatwe dni GtG + periodyzacja testowa (pełny szkielet: pushup-program-research.md §3) |
| Check przed startem | **1 pytanie: samopoczucie/energia** | odpowiedzi łączą nastrój i ciało; „coś boli" → auto-obniżenie sesji |
| Lejek programu (§6) | **karta „Historia bloków" w Progresie** (decyzja 2026-07-15) | wiersz per test bramkowy (data, wariant, wynik, rezultat bramki) derywowany z wpisów; zero persystencji |
| „Requiz" w Showup | **zmiana dni sesji w Ustawieniach** (decyzja 2026-07-15) | pełny re-onboarding z nowym Max Testem odrzucony — kłóciłby się z zasadą „testy tylko w harmonogramie"; walidacja dni jak przy onboardingu |
| Harmonogram | **stałe 3 dni wybrane przy onboardingu + przesunięcie o 1 dzień** (przy onboardingu żadne dwa dni nie sąsiadują; przesunięcie dozwolone tylko gdy zachowa ≥ 48 h od poprzedniej i do następnej twardej sesji — inaczej sesja przepada **bez kaskady**) | stały sygnał nawykowy (Kaushal & Rhodes) bez „pierwsza kolizja z życiem = porażka"; kaskadowe przesuwanie zniszczyłoby stały sygnał |

## 3. Mapowanie metody i researchu na funkcje

| Zasada | Funkcja w aplikacji | MVP? |
|---|---|---|
| Personalizacja na starcie | Onboarding = **pierwszy Max Test** → dobór wariantu i przedziału | ✅ |
| Nawyk inicjacji | Ekran główny = dzisiejszy dzień programu, nic więcej | ✅ |
| Zasada 2 minut | **2-min minimum** każdego dnia: seria GtG 40–50% maxa LUB rozgrzewka nadgarstków — trzyma passę | ✅ |
| Progresja zdolnościowa | Max Test co 4. tydzień bramkuje awans (+≥15%); drabinka wariantów (ściana→skos→kolana→pełne) | ✅ |
| Periodyzacja | Bloki 4-tygodniowe: 3 tyg. narastające + tydzień deload; nigdy 2 twarde sesje dzień po dniu | ✅ |
| IF-THEN | Pole „Kiedy [sygnał], zrobię sesję" przy onboardingu (kotwica Fogga) | ✅ |
| Check samopoczucia | 1 pytanie przed sesją i testem (dni łatwe bez checku): „Jak się czujesz? Jaka energia?" → świeżo / OK / zmęczony·zakwasy / coś boli | ✅ |
| Auto-dostosowanie | „zmęczony" → sesja -1 seria; „coś boli" → dzień wykonany jako łatwy (degradacja) + copy czerwonych flag; zdegradowany test wraca na następny dzień sesji | ✅ |
| Cel osiągnięty | Pierwszy test ≥ 100 na pełnych pompkach → ekran celebracji (koniec programu v1) | ✅ |
| Self-compassion po wpadce | Oblany test → „blok konsolidacyjny" bez wstydu; przerwa ≤ 2 tyg. → powrót do tego samego tygodnia, dłuższa → najpierw retest; streak wybaczający bez zmian | ✅ |
| Pozytywne wzmocnienie | Komunikat po sesji + wykres maxów z testów | ✅ |
| Refleksja | 1 zdanie po sesji (jak Unstuck) | ✅ |
| Progress tracker | Passa obecności + kalendarz + krzywa Max Testów | ✅ |
| Balans mięśniowy | Opcjonalny nudge: wiosłowanie/band pull-apart 1–2x/tydz. | ⬜ po MVP |
| Long set practice (50→100) | Dodatkowa cotygodniowa wolna seria od bloku ~5 | ⬜ po MVP (dotyczy późnej fazy programu) |

## 4. Pętla dzienna (serce produktu)

Dzień ma jeden z typów wyznaczanych przez harmonogram + pozycję w programie:

```
TWARDA SESJA (3x/tydz., stałe dni; przesuwalna o 1 dzień):
  check samopoczucia → plan sesji (5 serii z tabeli; auto-dostosowanie)
  → wykonanie z wpisaniem powtórzeń per seria → refleksja (1 zdanie) → wzmocnienie

DZIEŃ ŁATWY (pozostałe dni):
  2-min minimum: jedna perfekcyjna seria 40–50% maxa LUB rozgrzewka
  → odhaczenie → passa trwa (wszystko ponad minimum opcjonalne, nienagradzane dodatkowo)

DZIEŃ TESTU (koniec 4. tygodnia bloku, zamiast 3. sesji):
  rozgrzewka → jedna seria do upadku technicznego → wynik → bramka:
  awans / konsolidacja / tydzień regeneracyjny (reguły: pushup-program-research.md §3
  + doprecyzowania w data-model.md §4)
  test opuszczony lub zdegradowany bólem → wędruje na następny dzień sesji (tydzień 4
  się wydłuża; bramka czeka na wynik)

[dzień opuszczony] → komunikat self-compassion, streak wybaczający (bez zmian z Unstuck)
```

Standard powtórzenia (egzekwowany w testach, uczony od onboardingu): deska biodra–barki,
łokcie ~45°, klatka na pięść od podłogi, pełny wyprost. Powtórzenie łamiące formę nie liczy się.

## 5. Zakres MVP

**W MVP:**
1. Onboarding: disclaimer zdrowotny (PAR-Q-style) → nauka standardu → pierwszy Max Test
   (kaskada z góry: start od pełnych pompek; wynik poniżej progu → po przerwie jedna próba
   na łatwiejszym wariancie; maks. 2 realne próby, reszta wariantów estymowana) →
   wybór 3 dni sesji + IF-THEN → profil lokalny
2. Pętla dzienna (pkt 4) — wszystkie typy dnia, auto-dostosowanie z checku
3. Silnik programu: drabinka wariantów, tabele serii z % maxa, bloki, deloady, bramki testowe
   (parametry w `program.json`, strojone bez zmian kodu)
4. Progress: passa obecności + kalendarz + krzywa Max Testów
5. Journaling: samopoczucie, wyniki serii, refleksje — podgląd historii
6. i18n PL/EN, PWA offline, eksport/import (format `app: 'showup'`)

**Poza MVP (świadomie):**
- inne programy (yoga, codzienny ruch) — architektura gotowa, treści nie
- powiadomienia, konta, sync, statystyki zaawansowane, nudge balansu, long-set practice
- timer przerw między seriami (do rozważenia po dogfoodingu — telefon i tak leży obok)

## 6. Kryteria sukcesu MVP

- Autor przechodzi pełny blok 4-tygodniowy (3 sesje/tydz. + test) na własnym programie
- Twarda sesja obsługiwana w appce w < 60 s interakcji (bez czasu ćwiczenia)
- Dzień łatwy = < 20 s interakcji
- Zero danych opuszczających urządzenie; działa offline
- Appka mierzy własny lejek lokalnie: zdawalność testów per blok (research: takich danych nie ma nigdzie)

## 7. Sklepy z aplikacjami

Jak Unstuck: architektura Capacitor-ready (odziedziczona), TWA/Capacitor po walidacji.

## 8. Design UI/UX

Odziedziczony kierunek Unstuck (jasny, ciepły, kremowo-pomarańczowy) w MVP — spójność rodziny
produktów i zero pracy. Rewizja tożsamości wizualnej (ikona! — obecnie kiełek Unstuck) po MVP.

**Rewizja po MVP (2026-07-16, zrealizowana):** własna ikona „schodki + kropka obecności ze
śladem skoków" oraz zmiana palety akcentów na kremowo-turkusową (`--primary #0D8478`,
`--primary-soft #2BB3A3`) — turkus kojarzony ze sportem/fitnessem, wyraźnie odróżnia Showup
od pomarańczowego Unstuck. Kremowe tło `#FDF6EC` i miękka zieleń `--success` bez zmian
(sygnatura rodziny). Szczegóły: `docs/design-direction.md`.

**Rewizja 2 (2026-07-16, zrealizowana):** wnętrze aplikacji przechodzi na miętowo-turkusową
paletę „Mgiełka" (tło `#EAF6F3`, białe karty); kremowa sygnatura pozostaje wyłącznie na ikonie
jako łącznik rodziny. `--success` przyciemniona do `#5F9D4A` (kontrast na bieli).
Szczegóły: `docs/design-direction.md`.

## 9. Wymagania niefunkcjonalne

- **Prywatność:** 100% danych lokalnie; zero analityki zewnętrznej
- **Bezpieczeństwo (nowe vs Unstuck):** disclaimer przed pierwszym i każdym Max Testem;
  copy czerwonych flag (ostry ból stawu = stop; drętwienie dłoni = specjalista);
  testy zamknięte w harmonogramie — **żadnej gamifikacji codziennych prób maxa**
- **Prostota:** ekran główny = jeden dzień programu; każdy dodatkowy element wymaga uzasadnienia
- **Języki:** wszystkie teksty przez i18n, nigdy hardcode
