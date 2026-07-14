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

## UI (React) — wzorce z Feature 5

- **Zegar tylko przez `src/ui/clock.ts`** (`localToday`, `nowISO`, `currentHour`, `nowMs`) — jedyne miejsce w UI czytające `new Date()`. Domena dostaje czas jako argument.
- **Odliczanie = deadline, nie ticki**: timery liczą `endAt - nowMs()` przy każdym ticku, nigdy dekrementacji na `setInterval` (przeglądarki dławią interwały w tle, a użytkownik MA wyjść z aplikacji zrobić zadanie — finding z review Feature 5).
- **Zapis w momencie zdarzenia**: tap/klik zbierający dane persystuje NATYCHMIAST (synchronnie wywołany `onEntryChange`); opóźnienia (auto-advance, animacje) są wyłącznie wizualne i mają cleanup w `useEffect` — `setTimeout` bez cleanupu po unmount = bug.
- **Modal fullscreen**: `role="dialog"` + `aria-modal` + focus na kontener (`tabIndex={-1}`) po otwarciu + Escape zamyka. Zamknięcie zawsze bezpieczne, bo stan już zapisany.
- **Remount po dacie**: komponenty trzymające stan kroków dnia dostają `key={entry.date}` — przejście przez północ tworzy nowy wpis i musi zresetować lokalny stan.
- **Poprawny HTML**: żadnych `<h2>`/`<p>` wewnątrz `<button>` (button = phrasing content). Karta informacyjna to `div`, ścieżką interakcji jest osobny CTA.
- Kolejność kroków pętli żyje w JEDNYM miejscu: `LOOP_STEPS`/`nextStep` w domenie — UI nie hardkoduje przejść.
- Wyrównania/drobne style przez klasy narzędziowe (`.center` w `styles.css`), nie inline `style={{...}}`.
- `aria-live` nie może ogłaszać co sekundę — tylko zdarzenia (start/koniec, `role="status"`).
- Animacje ozdobne respektują `prefers-reduced-motion`.

## UI (React) — wzorce z Feature 6 (Progres)

- **Modal nad treścią interaktywną (bottom-sheet) przywraca focus**: przy otwarciu złap `document.activeElement`, po zamknięciu `invoker.focus()` w cleanup `useEffect`. Modal fullscreen (pętla dzienna) tego nie potrzebuje — sheet TAK, bo pod spodem jest klikalna siatka.
- **Touch target ≥ 44px**: mały wizualnie przycisk (np. kropka 22px) dostaje niewidzialne rozszerzenie `::after { position:absolute; inset:-Npx }` + `position:relative` na przycisku. Nie powiększać wizualnie.
- **Współdzielone helpery UI w `src/ui/`**: formatowanie dat → `src/ui/dates.ts`, mapy emoji → `src/ui/emotions.ts`. Gdy drugi ekran potrzebuje tego samego — wydziel moduł, nie kopiuj (formatery przyjmują datę jako argument, nie czytają zegara).
- **Stałe domenowe importowane, nie powtarzane**: liczby jak `COMPLETIONS_TO_ADVANCE` eksportuje domena, UI importuje. Literał w UI = przyszły dryf.
- **Interpunkcja w i18n, nie w JSX**: zamiast sklejania `{t('klucz')}: {wartość}` — klucz z placeholderem `'Twój plan: {value}'`. Różne języki różnie stawiają dwukropki/szyk.
- **`role="status"` z unikalną treścią**: komunikat zdarzenia zawiera identyfikator (np. datę) — tap w kolejny element zmienia tekst, więc czytnik ogłasza ponownie; statyczny tekst by zamilkł.
- **Elementy dekoracyjne vs informacyjne w siatce**: kropka „pusta" = `aria-hidden` (brak informacji, brak poczucia winy), kropka „dziś/pending" = `role="img"` + aria-label (niesie informację, choć nieinteraktywna).

## UI (React) — wzorce z Feature 7 (Dziennik)

- **`aria-label` na przycisku z treścią NADPISUJE jego dostępną nazwę** — czytnik traci wszystko, co widzi użytkownik widzący (finding MAJOR z review F7). Przycisk-wiersz listy: ŻADNEGO `aria-label`, tekst wiersza jest nazwą; emoji-dane w środku = `role="img"` + label z i18n. `aria-label` tylko na przyciskach bez tekstu (ikony, kropki).
- **Lookupy treści eksportuje `src/content/index.ts`** (`challengeById: ReadonlyMap`) — ekrany importują, nie budują własnych `new Map(challenges...)`.
- **Niezmienniki domeny w typach, nie w fallbackach UI**: filtr z predykatem typu (`.filter((e): e is JournalEntry => ...)`) + typ zawężony (`DailyEntry & { emotionBefore: Emotion }`) zamiast martwych gałęzi `?:` w JSX.
- **Formatery dat dla list bez ograniczenia czasowego** dostają opcjonalne `today` i dodają rok, gdy inny niż bieżący (`formatDayLong(date, lang, today?)`); okna stałe (kalendarz 28 dni) pomijają parametr.
- **Clamp tekstu**: `-webkit-line-clamp` zawsze w parze ze standardowym `line-clamp`.

## UI (React) — wzorce z Feature 8 (Onboarding-quiz)

- **Krokowe przepływy (wizard) przenoszą focus na `<h1>` po zmianie kroku**: React reużywa DOM między krokami, więc focus zostałby na przycisku „Dalej" i czytnik nie ogłosiłby nowego pytania. Nagłówek: `tabIndex={-1}` + `ref.focus()` + `outline: none` dla focusa programowego.
- **Wzorzec „pomiń pierwszy run" przez `mountedRef` NIE DZIAŁA w StrictMode** (dev odpala efekty 2x — drugi przebieg widzi `mounted=true` i kradnie focus przy starcie). Zamiast tego ref z poprzednią wartością: `if (prevRef.current !== step) focus(); prevRef.current = step;`.
- **Funkcje toggle w domenie zwracają tę samą referencję, gdy nic się nie zmieniło** — UI porównuje `next === current` i pomija zbędny `setState` + zapis draftu (zignorowany tap = zero efektów ubocznych). Test asercją `toBe(current)`, nie `toEqual`.
- **Głęboka kopia odpowiedzi z tablicami**: `structuredClone(answers)` zamiast spreadu — spread aliasuje tablice do persystowanego obiektu; test aliasingu musi mutować także tablicę, nie tylko skalar.
- **Bramka bootu obsługuje błędy per-odczyt, nie jednym catch**: brak profilu + błąd odczytu draftu → onboarding z `draft:null` (utrata draftu tylko restartuje quiz); pominięcie onboardingu to bug. Analogicznie logi błędów zapisu rozdzielone per operacja (`saveProfile` vs `clearQuizDraft`).
- **Klucze i18n dla opcji sterowanych danymi przez mapped type**: typ `OptionLabelKey` wyprowadzony z literałów `QUIZ_QUESTIONS` — brakujące tłumaczenie opcji = błąd builda, nie runtime (rozszerzenie wzorca `as const satisfies`).
- **Wznowienie draftu**: `firstUnansweredIndex(answers)` w domenie wyznacza krok startowy; UI tylko `min(idx+1, DONE_STEP)`. Draft zapisywany od CTA ekranu powitalnego, żeby wybór języka przeżył przerwanie.

## Treści statyczne (challenges.json)

- Ręcznie edytowany JSON = dane niezaufane: walidator sprawdza typy w runtime (`typeof`), zbiera WSZYSTKIE błędy w jeden throw, bez cichych fallbacków.
- Bramka builda: `prebuild` uruchamia testy `src/content` — zepsuty katalog nie przechodzi `npm run build`. Nie usuwać tego skryptu.
- W polskich tekstach cudzysłowy typograficzne „…” muszą być domknięte typograficznie — ASCII `"` w środku stringa psuje JSON (błąd znaleziony 2x w Fazie 4).
- Każde wyzwanie musi realizować technikę z listy ZATWIERDZONYCH w `docs/titd-method.{pl,en}.md` (część 4 zawiera techniki odrzucone — ich nie używamy; sprzeczność = zmiana treści albo jawna zmiana dokumentu metody za zgodą użytkownika).
