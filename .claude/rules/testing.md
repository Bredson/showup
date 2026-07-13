# Testing Rules — Unstuck

Stack testowy: **Vitest + Testing Library + jsdom** (skonfigurowane w `vite.config.ts`, uruchamianie: `npm test`).

## Priorytety pokrycia

1. **`src/domain/` — obowiązkowe testy jednostkowe.** Zwłaszcza:
   - algorytm streaka wybaczającego (1 dzień przerwy nie zeruje, 2+ zeruje, grace odnawialny),
   - progresja poziomów (7/10 ukończeń),
   - dobór wyzwania (bez powtórek, poziom użytkownika).
   Przypadki brzegowe: zmiana dnia o północy, pierwszy dzień, dzień wybaczony.
2. **`src/storage/`** — testy adaptera na fake/in-memory IndexedDB; test migracji bloba.
3. **UI** — testy zachowań krytycznych przepływów (pętla dzienna 6 kroków), nie szczegółów implementacji.

## Konwencje

- Pliki testów obok kodu: `streak.ts` → `streak.test.ts`.
- Nazwy testów opisowe, po angielsku: `"resets streak after two missed days"`.
- Arrange / Act / Assert; daty w testach zawsze jawne (bez `new Date()` bez argumentu — wstrzykiwać zegar/datę jako parametr funkcji domenowej).
- Testy domenowe bez mocków — czysta logika przyjmuje dane wejściowe, zwraca wynik.

## Definition of Done dla feature

Feature nie jest ukończony, dopóki `npm test` i `npm run build` nie przechodzą.
