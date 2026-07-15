---
name: feature-workflow
description: Standardowy przepływ implementacji pojedynczego feature'u MVP w projekcie Showup. Używaj przy każdym zadaniu typu "zaimplementuj ekran X / algorytm Y / przepływ Z" w Fazie 4 i późniejszych.
---

# Feature Workflow — Showup

Jeden feature = jedna pełna iteracja tego przepływu. Nie zaczynaj kolejnego feature'u przed domknięciem poprzedniego.

## Kroki

1. **Przeczytaj spec przed kodem.** Odpowiednie sekcje `docs/ux-spec.md` (ekrany, dylematy rozstrzygnięte) i `docs/data-model.md` (encje, algorytmy). Jeśli spec milczy w istotnej kwestii — dylemat do użytkownika (rule: `ai-workflow.md`), nie zgaduj.
   **Obowiązkowo:** przejrzyj `.claude/rules/code-style.md` pod kątem sekcji dotyczących podobnych ekranów/mechanik i wypisz w planie, KTÓRE reguły stosujesz — dwie fazy z rzędu re-złamały zapisane reguły, bo czytano je dopiero post-stage (`ai-workflow.md`).
2. **Domena najpierw.** Logika w `src/domain/` jako czyste funkcje + testy jednostkowe (`*.test.ts` obok pliku). Data/zegar jako parametr, nie `new Date()` w środku.
3. **Storage, jeśli potrzebny.** Rozszerz `StorageAdapter` w `src/storage/` — reszta kodu nie dotyka IndexedDB bezpośrednio.
4. **UI na końcu.** Ekran w `src/ui/screens/` (jeden plik), współdzielone kawałki w `src/ui/components/`. Stringi tylko przez i18n (dodaj klucze do `pl.ts` i `en.ts` naraz), style tylko przez tokeny.
5. **Weryfikacja.** `npm test` + `npm run build` muszą przechodzić. Przepływy UI sprawdź wizualnie w przeglądarce (dev server + screenshot), w PL i EN. Gdy stan ekranu zależy od danych w IndexedDB lub timera auto-advance → skill `visual-verification` (chirurgia bazy z backupem, zamrożenie setTimeout, obowiązkowy checklist sprzątania).
6. **Code review.** Uruchom subagenta `code-reviewer` na diffie feature'u; napraw uwagi istotne.
7. **Post-stage analysis.** Nowy wzorzec/pułapka → aktualizacja `.claude/rules/` lub tego skilla (wymóg z `CLAUDE.md`).

## Antywzorce

- Budowanie UI przed przetestowaną domeną.
- "Tymczasowe" stringi po polsku wpisane na sztywno w JSX.
- Dodawanie zależności **runtime** (trafiających do bundle'a appki) bez decyzji użytkownika.
  Zależności dev-only (narzędzia testowe/buildowe) wolno dodać samodzielnie — zgłosić w podsumowaniu.
- Persystowanie czegoś, co da się wyliczyć z `DailyEntry`.
