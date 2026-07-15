# Testing Rules — Showup

Stack testowy: **Vitest + Testing Library + jsdom** (skonfigurowane w `vite.config.ts`, uruchamianie: `npm test`).

## Priorytety pokrycia

1. **`src/domain/` — obowiązkowe testy jednostkowe.** Zwłaszcza silnik programu
   (`program.ts`, spec: `docs/data-model.md` §4):
   - bramka testowa (nowy blok / konsolidacja / fail+regen / step-down / graduacja / seed-kalibracja),
   - derywacja pozycji (sloty od blockAnchor, freeze pauzy, okno przesunięcia 48 h, slot testowy),
   - `dayKindFor` i `sessionPlan` (deload, feel, regen → throw),
   - streak wybaczający (obecność, nigdy wynik).
   Przypadki brzegowe: pierwszy dzień, granice bracketów, pauza dokładnie 14 dni, slot 11.
2. **`src/storage/`** — testy adaptera na fake/in-memory IndexedDB; test migracji bloba.
3. **UI** — testy zachowań krytycznych przepływów (pętla dzienna 6 kroków), nie szczegółów implementacji.

## Konwencje

- Pliki testów obok kodu: `streak.ts` → `streak.test.ts`.
- Nazwy testów opisowe, po angielsku: `"resets streak after two missed days"`.
- Arrange / Act / Assert; daty w testach zawsze jawne (bez `new Date()` bez argumentu — wstrzykiwać zegar/datę jako parametr funkcji domenowej).
- Testy domenowe bez mocków — czysta logika przyjmuje dane wejściowe, zwraca wynik.

## Fixture'y silnika programu — pułapka pauzy (lekcja 2026-07-15, ugryzła DWA razy)

- Reguła pauzy (>14 dni od ostatniego completed → freeze + retest-kalibracja) jest globalna:
  **każdy** scenariusz z odstępem >14 dni między wpisami wpada w nią przypadkiem i maskuje
  właściwe oczekiwania (np. „oblany test" staje się „kalibracją po pauzie").
- Zasada: fixture'y rozciągnięte w czasie trzymają wpisy keep-alive (np. `session('2026-07-24')`
  albo easy na off-day) i komentarz *dlaczego* ten wpis tam jest.
- Przy każdej zmianie reguły zależnej od odstępów między wpisami: spodziewaj się pęknięcia
  starych fixture'ów — najpierw sprawdź, czy to fixture kłamał, zanim „naprawisz" kod.
- Punkt startowy fixture'ów: `START='2026-07-06'` (poniedziałek), profil Mon/Wed/Fri `[1,3,5]`.

## Fixture'y muszą przestrzegać invariantów spec (lekcja 2026-07-15, faza storage)

- Zaostrzenie walidatora importu wykryło, że NASZE własne fixture'y łamały spec
  (easy day z `sets:[3]` — wg §1 sets tylko na niedegradowanej sesji).
- Zasada: po każdym zaostrzeniu walidacji przepuść przez nią istniejące fixture'y
  i happy-path'y — fixture „przechodzący" przy luźnej walidacji może kodować błąd.
- Testy formatu blobu przypinają wersję literałem (`const CURRENT = 2`), celowo NIE
  importują `CURRENT_SCHEMA_VERSION`: bump wersji ma wymusić nowe fixture'y, a nie
  po cichu przecelować stare.

## Buildery rekordów — test round-trip przez walidator importu (faza onboardingu)

- Każdy builder produkujący persystowane rekordy (`buildOnboardingRecords`) ma test
  przepuszczający wynik przez `buildExportBlob` → `validateExportBlob` z asercją
  `{ ok: true }` — najsilniejsza możliwa asercja zgodności z §1, moduły nie mogą się
  rozjechać w ciszy. Testuj też brzegi (result 0, wariant z estymacji).
- Każda bramka `throw` w builderze ma testy negatywne (po jednym na klasę złego wejścia).

## Definition of Done dla feature

Feature nie jest ukończony, dopóki `npm test` i `npm run build` nie przechodzą.
