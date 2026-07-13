# Code Style Rules — Unstuck

Wiążące zasady kodu dla tego projektu (React 18 + TypeScript + Vite). Szczegóły architektury: `docs/architecture.md`.

## Struktura i granice warstw

- `src/domain/` — czysta logika TS. **Zero importów React, storage, i18n.** Funkcje czyste, testowalne bez mocków.
- `src/storage/` — jedyne miejsce dotykające IndexedDB (przez `idb`). Reszta kodu używa `StorageAdapter`.
- `src/ui/screens/` — jeden ekran = jeden plik. `src/ui/components/` — komponenty współdzielone.
- `src/content/` — statyczne treści (`challenges.json`). Id wyzwań niezmienne, format `l{level}-{nnn}`.
- `src/i18n/` — własny lekki i18n. `en.ts` typowany kluczami z `pl.ts`.

## Twarde zakazy

- **Żadnych stringów UI w komponentach** — wszystko przez `t('klucz')`. Dotyczy też aria-labels i alt.
- **Żadnych kolorów/rozmiarów inline** — tylko tokeny CSS z `src/tokens.css` (`var(--primary)` itd.).
- **Żadnej alarmowej czerwieni** w UI (zasada produktu — ton ciepły, bez presji).
- **Nie persystować stanów wyliczalnych** — `DailyEntry` to jedyne źródło prawdy; `ProgressState` (streak, poziom) zawsze wyliczany z wpisów.

## Konwencje

- Nazwy plików komponentów: `PascalCase.tsx`; moduły domenowe: `camelCase.ts`.
- Typy domenowe tylko w `src/domain/types.ts` — nie duplikować definicji.
  - Gdy potrzebna runtime'owa lista wartości unii → `as const satisfies Record<Unia, true>` + `Object.keys()`, żeby dryf był błędem kompilacji (wzorzec z `src/content/index.ts`).
- Stan globalny: React state + context. Nie dodawać bibliotek stanu bez decyzji użytkownika.
- Komentarze: WHY, nie WHAT. Bez zakomentowanego kodu.

## TypeScript strict

- `strict: true` + `noUncheckedIndexedAccess: true` (tsconfig.app.json) — obowiązują. Nie wyłączać punktowo (`// @ts-ignore` zakazane).
- Dostęp po indeksie: preferuj destrukturyzację z guardem (`const [first] = xs; if (first === undefined) ...`) zamiast `!`. Cast krotki (`as [number, ...]`) tylko przy formacie gwarantowanym przez typ (np. `ISODate`), z komentarzem WHY.

## Treści statyczne (challenges.json)

- Ręcznie edytowany JSON = dane niezaufane: walidator sprawdza typy w runtime (`typeof`), zbiera WSZYSTKIE błędy w jeden throw, bez cichych fallbacków.
- Bramka builda: `prebuild` uruchamia testy `src/content` — zepsuty katalog nie przechodzi `npm run build`. Nie usuwać tego skryptu.
- W polskich tekstach cudzysłowy typograficzne „…” muszą być domknięte typograficznie — ASCII `"` w środku stringa psuje JSON (błąd znaleziony 2x w Fazie 4).
- Każde wyzwanie musi realizować technikę z listy ZATWIERDZONYCH w `docs/titd-method.{pl,en}.md` (część 4 zawiera techniki odrzucone — ich nie używamy; sprzeczność = zmiana treści albo jawna zmiana dokumentu metody za zgodą użytkownika).
