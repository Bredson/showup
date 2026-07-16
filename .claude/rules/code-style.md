# Code Style Rules — Showup

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

## UI (React) — wzorce z Feature 9 (Ustawienia)

- **Operacje destrukcyjne NIE są fire-and-forget**: „Usuń wszystkie dane" awaituje `clearAll()` i dopiero po sukcesie wraca do onboardingu; błąd → spokojny komunikat `role="status"` (udawanie, że dane zniknęły, byłoby kłamstwem — odwrotność zasady zapisu przy tapnięciu).
- **Guard przeciw wyścigowi zapis↔wipe (dwie warstwy)**: (1) `wipingRef` w App — `handleProfileChange` ignoruje zapisy, gdy `clearAll()` w locie (`finally` resetuje ref); (2) SettingsScreen dezaktywuje WSZYSTKIE pozostałe kontrolki (`disabled={busy}`) podczas `deleting`. Zapis, który skommituje po wipe, „wskrzesza" usunięte dane — złamana obietnica prywatności.
- **Jedna ścieżka zapisu profilu**: każda późniejsza edycja profilu (język, re-quiz) przechodzi przez `handleProfileChange` w App (setProfile + setLang + saveProfile). Ekrany nie wołają `adapter.saveProfile` bezpośrednio.
- **Pobieranie pliku (`src/ui/download.ts`)**: anchor DOŁĄCZONY do DOM + `click()` + `setTimeout(() => { remove; revokeObjectURL }, 0)` — synchroniczny revoke urywa pobieranie w Safari/iOS, a odłączony anchor bywa ignorowany. Jedyne miejsce DOM API dla eksportu.
- **Tryb wielokrotnego użycia komponentu przez opcjonalny prop-callback** (`onCancel` obecny = retake w OnboardingScreen): kontrakt implicit — MUSI być udokumentowany przy propie; teksty CTA rozróżniane per tryb osobnym kluczem i18n (retake nie może obiecywać „pierwszego wyzwania").
- **Dwustopniowe potwierdzenie inline** (bez modala, bez czerwieni): stan `idle → confirm → deleting → error`, przyciski potwierdzenia w miejscu, „Zostaw" wraca do `idle`.
- **Stałe buildu przez `define`**: `__APP_VERSION__` z package.json w vite.config (`readFileSync`, nie import JSON) + deklaracja w `src/vite-env.d.ts`. Zmiana vite.config wymaga restartu dev servera.
- **Rozwijana sekcja**: przycisk z `aria-expanded` + `aria-controls` wskazującym `id` treści; strzałka ▾/▴ dekoracyjna = `aria-hidden`.
- **Import stałych ze storage w UI jest OK** (np. `CURRENT_SCHEMA_VERSION` w SettingsScreen) — zakaz importów storage dotyczy tylko `src/domain/`; domena przyjmuje wartość jako argument (`buildExportBlob(profile, entries, schemaVersion, now)`).
- Ustawienia nie mają `.btn-primary` — reguła to „maks. jeden primary na ekran", nie „dokładnie jeden" (ekran bez „tej jednej akcji" używa `.btn-secondary`/`.btn-link`).

## UI (React) — wzorce z Feature 10 (interstitial „dzień pominięty")

- **Stan „raz na X" wyliczany, nie persystowany**: „raz na powrót" = pochodna faktu „wpis dnia właśnie powstał" (pierwsze otwarcie tworzy wpis). Zanim dodasz flagę do storage, sprawdź, czy istniejący zapis już nie koduje tej informacji — F10 nie dodał ani bajta persystencji.
- **Komunikaty UI nie mogą obiecywać stanu, którego nie zweryfikowały**: „Twoja passa jest bezpieczna" pokazujemy tylko po sprawdzeniu `computeStreak > 0` (dylemat 9 w ux-spec). Warunek wyboru wariantu żyje w domenie (`comebackKind(missed, streak)`), nie w JSX — test jednostkowy dokumentuje scenariusz kłamstwa.
- **Odczyt „stanu przed" PRZED mutującym wywołaniem w boot effect**: `getAllEntries()` przed `getTodaysChallenge()` (które robi `putEntry`). W StrictMode efekt odpala się 2x — przebieg B czytający PO zapisie przebiegu A widzi już zmutowany świat i gubi zdarzenia jednorazowe (interstitial). Komentarz WHY przy takim uporządkowaniu jest obowiązkowy.
- **Warianty bez `'none'` w propach**: komponent renderowany warunkowo nie przyjmuje wariantu „nie pokazuj" — typ propa to `Exclude<ComebackKind, 'none'>` importowany z domeny, nie powtórzona unia literałów (dryf po dodaniu wariantu = błąd kompilacji).
- **Usuwaj pola API, których UI przestało używać**: gdy shell przejął wyliczanie `firstOpenOfDay`, pole zniknęło ze zwrotki `getTodaysChallenge` (martwe API myli następnego czytelnika). Jedna informacja = jedno źródło.
- **Współdzielona klasa zamiast bliźniaczych** (`.screen-art` dla onboardingu i comeback) — wzorzec F6 „wydziel, nie kopiuj" dotyczy też CSS.
- Interstitial pełnoekranowy renderowany PRZED wszystkimi innymi gałęziami Shell (requiz/loop/taby); zamknięcie = `setState(null)`, zero zapisu.

## UI (React) — wzorce z Fazy 7 (redesign 1c/1f/1h)

- **Liczniki poziomu w UI zawsze clampowane**: `completedByLevel[currentLevel]` rośnie bez ograniczeń na maksymalnym poziomie (domena inkrementuje zawsze, poziom stoi) — każdy odczyt do pilla/ringa to `Math.min(x, COMPLETIONS_TO_ADVANCE)` (finding BLOCKER z review F7-redesign; ProgressScreen i TodayScreen muszą liczyć identycznie).
- **Ring conic przez CSS custom property**: `background: conic-gradient(var(--primary) 0 var(--ring-fill, 0%), var(--surface-alt) ...)`, komponent ustawia `style={{ '--ring-fill': '43%' } as CSSProperties}` — fallback `0%` obowiązkowy; ring dekoracyjny (`aria-hidden`), dane liczbowe żyją w tekście obok.
- **Litery dni tygodnia wyliczane z dat kolumn, nie hardcodowane**: kalendarz to kroczące 28 dni NIE wyrównane do poniedziałku — nagłówek bierze `calendar.slice(0, 7)` i formatuje `formatWeekdayNarrow(date, lang)`; 28 ≡ 0 (mod 7) gwarantuje zgodność każdego wiersza. Nagłówek `aria-hidden` (pełne daty niosą aria-labels kropek).
- **Stan zaznaczenia = klasa + `aria-pressed`**: wizualny wyróżnik (ramka, kropka `aria-hidden`) bez `aria-pressed` jest niewidoczny dla czytnika (finding MINOR z review; konwencja jak OnboardingScreen/SettingsScreen).
- **Usuwanie kluczy i18n przy redesignie**: usuwaj z OBU locale naraz (parity wymusza typ `en.ts`), ale najpierw grep po wszystkich konsumentach — klucz „nieużywany na tym ekranie" może żyć gdzie indziej (`today.level` używa StepChallenge). To samo z klasami CSS (`.level-dots` zostało dla StepReinforce).

## UI + domena — wzorce z Feature 8.1 (import JSON)

- **Walidacja niezaufanego wejścia zwraca result type, nie throw**: `validateExportBlob → { ok:true, blob } | { ok:false, reason, errors[] }` — UI potrzebuje spokojnej gałęzi per wynik; `errors` to pomoc debugowa (console), UI pokazuje ogólny komunikat i18n. Kontrast z walidatorem treści builda, gdzie głośny throw jest celem.
- **Pole pokazywane w UI musi mieć zwalidowany FORMAT, nie tylko typ**: `typeof x === 'string'` nie wystarcza, gdy UI robi `new Date(x)`/`slice` — ręcznie edytowany plik z `exportedAt:"yes"` wyrenderowałby „Invalid Date" w confirmie akcji nieodwracalnej (finding BLOCKER z review F8.1). Walidator gwarantuje dokładnie to, na czym polegają konsumenci.
- **Predykaty walidacyjne (`raw is T`) muszą zwracać `false` przy każdym napushowanym błędzie**: wzorzec `const errorsBefore = errors.length; ...; return errors.length === errorsBefore` — predykat zwracający `true` dla zepsutego obiektu psuje downstream checks (duplikaty po `undefined`).
- **Masowa podmiana danych = remount przez `key`**: po `replaceAll` App bumpuje `key={importGeneration}` na Shell — boot effect czyta świat na nowo z IndexedDB (wpis dnia, progres, interstitial powrotu) zamiast ręcznej chirurgii stanu. Rozszerzenie wzorca „remount po dacie".
- **`replaceAll` atomowe w jednej transakcji idb** (profile+entries+meta): clear+put+delete draftu, `Promise.all([...ops, tx.done])` — porażka importu uczciwie znaczy „nic się nie zmieniło" i komunikat błędu może to obiecać. `meta.installedAt` opisuje urządzenie, nie dane — przeżywa import.
- **Odczyt pliku od użytkownika przez `src/ui/upload.ts`** (`readJSONFile`, lustro `download.ts`): DOM API tylko w `src/ui/`, wynik typu `unknown` idzie do walidatora domeny. Ukryty `input[type=file]`: `name` obowiązkowy, `event.target.value = ''` po każdym wyborze (ten sam plik po poprawce musi znów odpalić `onChange`).
- **Timestamp UTC → lokalna data przez `localToday(new Date(ts))`**: `toISOString()` daje UTC — `slice(0,10)` pokazywałby inny dzień niż nazwa pliku eksportu dla nocnych eksportów (finding z review F8.1).
- **`role="status"` z powtarzalnym wynikiem wymaga resetu stanu przed ponowną próbą**: dwa identyczne odrzucenia pliku z rzędu = brak zmiany DOM = czytnik milczy; `pickImportFile()` wraca do `idle` przed otwarciem pickera.
- **Nigdy dwa destrukcyjne confirmy naraz**: otwarcie confirmu importu zamyka confirm usuwania i odwrotnie (oba przyciski resetują stan sąsiada).

## UI (React) — wzorce z fazy Onboarding Showup (pierwszy Max Test, 2026-07-15)

- **Finisz wieloetapowego zapisu zamraża zegar w ref przy PIERWSZEJ próbie**
  (`finishClock.current ??= { today, now }`): retry po lokalnej północy z nowym
  `localToday()` stworzyłby drugi wpis testowy na innej dacie (pierwszy `putEntry`
  mógł się udać) — a derywacja stanu programu składa WSZYSTKIE wpisy testowe.
- **Timestamp bramki zdrowotnej (disclaimer) to invariant, nie fallback**: `?? nowISO()`
  maskowałby przyszły bug przepływu fabrykując prawnie istotną wartość. Ref null przy
  finiszu = `throw` (łapany przez istniejący catch), symetrycznie do gate'ów buildera.
- **Krytyczne zapisy NIE failują w ciszy**: `console.error` + odblokowany przycisk to
  zamrożona apka z perspektywy użytkownika. Wzorzec: stan `saveError` + `role="alert"`
  z kluczem i18n przy CTA, czyszczony na retry (finding MAJOR z review onboardingu).
- **Builder domenowy jako ostatnia bramka walidacyjna sprawdza WSZYSTKIE wejścia
  symetrycznie**: skoro throw'uje na złe dni, musi też na `result` (ujemny/NaN/float) —
  asymetria = zaufanie, że regex w UI nigdy się nie zmieni; zły wynik psuje derywację
  ORAZ czyni eksport użytkownika nieimportowalnym (backup bezużyteczny).
- **Persystowane tablice w porządku kanonicznym** (`sessionDays` sortowane w builderze,
  nie w UI): stabilne eksporty/diffy niezależnie od kolejności klikania.
- **Region `aria-live` renderowany ZAWSZE, treść przełączana**: pusty `<p role="status">`
  w DOM od startu, komunikaty (licznik „wybrano N z 3" / błąd sąsiedztwa) podmieniane —
  region wpięty dopiero przy błędzie bywa nieogłoszony. Przy <3 wyborach hint licznikowy,
  nie cisza: disabled primary bez podanego powodu to ślepy zaułek.
- **Kropki postępu wizarda**: `role="img"` + `aria-label` z kluczem `onb.progress`
  (`{current}/{total}`) zamiast `aria-hidden` — czytnik też dostaje „krok 3 z 5".
- **Przyciski języka**: `aria-pressed` (konwencja chipów) + atrybut `lang="pl"/"en"` na
  każdym — etykieta jest we własnym języku i czytnik musi ją poprawnie wymówić.
- **Input liczbowy mobile-first**: `type="text" inputMode="numeric" pattern="\d*"
  maxLength` zamiast `type="number"` (spinnery, scroll-to-change, `e`/`-`); realną
  walidację i tak robi regex na kontrolowanej wartości.
- **Kolejność zapisów = kierunek zależności**: wpis testowy PRZED profilem, bo obecność
  profilu jest flagą „onboarded" — porażka w środku nie może zostawić profilu bez
  wpisu założycielskiego.

## UI (React) — wzorce z fazy Pętla dzienna (TodayScreen, 2026-07-15)

- **Derywacja „świat bez dziś" musi obsłużyć dzień założycielski**: `computeProgram`
  rzuca na pustej historii, a wpis onboardingowy JEST dzisiejszym wpisem w dniu
  instalacji — `entries.filter(date !== today)` daje wtedy `[]` i bramka crashuje
  render (BLOCKER z review; 165 testów zielonych, bo crash żył tylko w ścieżce UI).
  Pusta historia → nie porównuj stanów, pokaż `gate.calibrated` (reuse istniejącego
  copy zamiast nowych kluczy — komunikat „test ustawił twój plan" jest prawdziwy).
- **Boot z resume synchronizuje prev-ref focusa**: `prevStep.current = resumed`
  PRZED `setStep(resumed)` — wznowienie kroku po otwarciu apki to nie jest ZMIANA
  kroku i nie może kraść focusa na h1 (rozszerzenie wzorca F8 na boot asynchroniczny).
- **Zamknięcie interstitiala odmontowuje sfokusowany przycisk** → focus spada na
  `body` bez zmiany `step`. Efekt focusa nasłuchuje też sygnału dismiss (drugi
  prev-ref, deps `[step, comeback]`) i przenosi focus na nagłówek kroku.
- **Kontrolowany input czyszczony dopiero PO sukcesie zapisu**: żadnego
  `setInput('')` przed `persist` — błąd zapisu z retry nie może wymagać przepisania
  wartości; przy sukcesie czyści remount `key={idx}` (spójność z wzorcem retry
  pozostałych kroków).
- **Wynik bramki liczony lazy na renderze done**, nie zapisywany przy completion:
  derywacja jest deterministyczna — reload dnia ukończonego pokazuje tę samą bramkę
  za darmo (konsekwencja zakazu „nie persystować stanów wyliczalnych").
  ZAKTUALIZOWANE (faza Lejek bloków): mechanizm „porównaj computeProgram(historia)
  vs computeProgram(historia + dziś)" usunięty — dziś DoneStep czyta
  `computeGateLog(entries, program).find(i => i.date === today)?.outcome`.

## UI (React) — wzorce z fazy Progres + nawigacja (Showup, 2026-07-15)

- **Etykiety wewnątrz SVG clampowane do viewBoxa**: tekst zakotwiczony `middle` przy
  skrajnym punkcie wystaje poza `viewBox` i jest ucinany. Helper `labelAnchor(px)`:
  blisko lewej krawędzi → `x=L, anchor=start`, blisko prawej → `x=R, anchor=end`,
  inaczej `middle`. Dotyczy każdego dynamicznie pozycjonowanego `<text>`.
- **Wiersz podsumowania pomija punkty derywowane**: „Ostatni test: {result}" liczy się
  z `find(p => !p.seed)`, nie z ostatniego punktu — seed to szacunek, a etykieta mówi
  „test"; pokazanie seeda to kłamstwo danych (znalezione na realnym scenariuszu
  graduacji, nie w testach).
- **Wykres danych z `aria-hidden` wymaga tekstowego ekwiwalentu**: dekoracyjny ring z
  liczbą w tekście obok to za mało dla wykresu HISTORII — dodaj `<p class="sr-only">`
  z podsumowaniem per segment (`{variant}: od {from} do {to}`). Klasa `.sr-only` żyje
  w `styles.css`.
- **Modal z jednym fokusowalnym kontrolem: Tab = no-op**: `aria-modal="true"` deklaruje
  tło ukrytym dla SR, ale klawiatura bez trapa wychodzi Tabem na kropki/nav pod spodem
  — widoki się rozjeżdżają. Przy JEDYNYM fokusowalnym przycisku wystarczy
  `if (e.key === 'Tab') e.preventDefault()` w onKeyDown overlaya; komentarz przy
  komponencie musi opisywać ten kontrakt uczciwie.
- **`aria-current="page"` (nie `"true"`) na tabach bottom-nav** — idiom dla nawigacji,
  czytniki ogłaszają „bieżąca strona".
- **Overlay pełnoekranowy renderowany obok stałego bottom-nav musi go jawnie przykryć**:
  `.comeback` = `position: fixed; inset` na pełny viewport + `z-index` wyższy niż nav +
  `max-width` kolumny apki z `left: 50%; translateX(-50%)`.
- **Meta-lekcja review**: dwa findingi tej fazy (puste kropki `aria-hidden`,
  interpunkcja w i18n) to były ISTNIEJĄCE reguły z tego pliku — przed implementacją
  ekranu przeczytaj ponownie sekcje reguł dotyczące podobnych ekranów (tu: F6 Progres
  z Unstuck), nie tylko pisz nowe.

## UI (React) — wzorce z fazy Ustawienia (Showup, 2026-07-15)

- **Jedna unia stanów dla sekcji z wykluczającymi się operacjami**: `DataOp =
  idle | exporting | confirmImport | importing | confirmDelete | deleting | message`
  zamiast osobnych booleanów. „Co najwyżej jeden confirm otwarty" i „operacja w toku
  blokuje wszystko" są wtedy STRUKTURALNE (jeden `setOp`), nie pilnowane ręcznie;
  `busy` to derywacja z fazy.
- **Taniec focusa przy inline-confirmach**: otwarcie confirmu → focus na jego kontener
  (`tabIndex={-1}` na divie); wyjście bez sukcesu („Zostaw" / przejście w błąd) →
  focus wraca na przycisk-trigger; ścieżki sukcesu odmontowują cały ekran i nie
  wymagają obsługi. Implementacja: `prevPhase` ref + `useEffect` po `op.phase` —
  uwaga na przejście `confirm → working`, które NIE może przywracać focusa na trigger
  (warunkuj przywrócenie na fazach spoczynkowych `idle`/`message`). To rozszerzenie
  reguły „sfokusowany element nie znika w body" z fazy TodayScreen na przypadek,
  gdy trigger jest zastępowany confirmem w ternary.
- **Optymistyczny zapis ustawienia z uczciwą porażką**: `handleProfileChange` w App
  ustawia stan/język od razu, ale ZWRACA promise zapisu; ekran awaituje i przy
  odrzuceniu mówi w `role="status"`, że zmiana może nie przetrwać odświeżenia.
  Rozszerzenie reguły „krytyczne zapisy nie failują w ciszy" na zapisy niskiej stawki:
  cichy `void ...catch(console.error)` ukrywałby rozjazd stan-UI vs stan-dysk.
- **Walidacja importu sprawdza niezmienniki aplikacji, nie tylko kształt**: blob
  poprawny strukturalnie, ale bez ukończonego gate-testu, bootuje apkę prosto w crash
  (`computeProgram` rzuca na historii bez testu założycielskiego). Walidator wymaga
  inwariantu (`entries.some(isGateTest)`), a check zależny pomija, gdy wpisy są
  malformed — jeden prawdziwy błąd zamiast echa wtórnych.
- **Przełącznik języka poza onboardingiem reużywa jego elementów**: klucze
  `onb.lang.*` (etykieta w SWOIM języku), klasy `lang-btn`/`lang-btn--selected`,
  atrybut `lang` na przycisku + `aria-pressed` na stan. Nowe kopie tych etykiet
  w `settings.*` byłyby dryfem.

## UI (React) — wzorce z fazy Dziennik (Showup, 2026-07-15)

- **Ekstrakcja modala PRZENOSI kontrakt focusa do środka komponentu**: współdzielony
  bottom-sheet sam łapie `document.activeElement` przy mount i przywraca go w cleanup
  `useEffect` — wywołujący mają ZERO księgowości (żadnych `sheetOpener` refów,
  `onClose` tylko zeruje stan). Reguła F6 „w cleanup useEffect" zawsze znaczyła
  „wewnątrz modala"; wersja z obowiązkiem callera = bliźniacze refy w każdym
  konsumencie i trzeci, który zapomni. Cleanup pokrywa też odmontowania z pominięciem
  `onClose`.
- **Panel zakotwiczony (bottom-sheet) z treścią bez limitu: `max-height` + `overflow-y`**:
  overlay `align-items: flex-end` wypycha za wysoki panel GÓRĄ poza viewport — nagłówek
  z ✕ nieosiągalny, tap w tło zasłonięty, na dotyku (brak Escape) użytkownik uwięziony.
  Każdy taki panel: `max-height: 85dvh; overflow-y: auto` (finding MUST-FIX z review;
  refleksja bez `maxLength` czyni długą treść normalnym przypadkiem, nie edge-casem).
- **Sortowanie dat ISO: `b.date.localeCompare(a.date)`**, nie ternary `<` — komparator,
  który nigdy nie zwraca 0, jest niespójny i polega na niezmienniku spoza pliku
  (unikalność dat z klucza IDB) bez zapisania go.
- **Test niemutowania wejścia dla funkcji domenowych `readonly T[]`**: 2 linie
  (`journalEntries(input); expect(input.map(...)).toEqual(original)`) chronią przed
  refactorem usuwającym `.filter()` sprzed `.sort()` (sort mutuje w miejscu).
- Dziennik nie ocenia wykonania: wpisy `in_progress` bez żadnych etykiet statusu,
  kreska braku refleksji `aria-hidden` (rozszerzenie zasady no-guilt na listy).

## Domena — wzorce z fazy Lejek bloków (Showup, 2026-07-15)

- **Decydent raportuje własny werdykt, nikt go nie rekonstruuje**: funkcja
  podejmująca decyzję (`applyGate`) zwraca `outcome: GateOutcome` obok nowego stanu.
  Heurystyka porównująca stany przed/po (`classifyGateOutcome` diffował ProgramState'y)
  to reverse-engineering decyzji już podjętej — kruchy przy każdej nowej gałęzi bramki.
  Gdy UI potrzebuje „dlaczego", źródłem jest decydent, nie detektyw.
- **Jeden fold po zdarzeniach, wiele widoków-konsumentów**: `replayGates` to JEDYNE
  miejsce iterujące testy bramkowe; `derive` (stan bieżący) i `computeGateLog`
  (historia werdyktów) konsumują ten sam replay. Drugi fold obok = gwarantowany dryf
  semantyki (kolejność, pauzy, seed).
- **Publiczne API derywowane dla UI zwraca `[]`/pusty wynik zamiast throw** na stanie
  pre-founding: ekran renderowany przed testem założycielskim (teoretycznie
  nieosiągalny, ale np. w trakcie importu) nie może crashować renderu — guard
  `gateLog.length > 0` w UI wystarcza. Throw zostaje w `computeProgram`
  (konsument wymaga stanu, nie listy).
- **Wewnętrzne mutatory zwracają fakt, nie ciszę**: `stepDown` zwraca boolean
  („czy było dokąd zejść") — caller mapuje to na uczciwy werdykt (`step-down` vs
  `regen` na dnie drabinki) zamiast zgadywać po stanie.
- **Testy gałęzi decyzyjnych asertują PEŁNY zwrot, nie tylko stan**: test „wall stays
  put" sprawdzał `state.variant`, ale nie `outcome` — review dodał
  `expect(r.outcome).toEqual({ type: 'regen' })`. Każda gałąź decydenta = asercja
  werdyktu, nawet gdy temat testu to stan.
- **Predykat typu na granicy filtra zamiast castów w konsumencie**:
  `isGateTest(e): e is DailyEntry & { testResult: number }` wyeliminował 7 castów
  `as number` w replayu (rozszerzenie reguły F7 „niezmienniki domeny w typach" na
  predykaty współdzielone domena↔walidacja importu).

## UI + domena — wzorce z fazy Dni sesji w Ustawieniach (Showup, 2026-07-16)

- **Lokalna operacja async mrozi wejścia, które ją raportują — nie tylko globalne
  `busy`**: sekcja Dni sesji ma własny `daysOp` obok DataOp; podczas
  `daysOp === 'saving'` disabled muszą być też CHIPY, nie tylko CTA. Inaczej tap w
  chip resetuje `daysOp` na `idle`, a spóźniony promise ogłasza w `role="status"`
  „Zapisane" dla zaznaczenia, którego nikt nie zapisał (review B1). Rozszerzenie F9:
  „operacja w toku blokuje wszystko" znaczy wszystko, o czym operacja raportuje —
  każdy nowy lokalny stan op wymaga mapowania na wejścia, które mrozi.
- **Bramka walidacyjno-kanonizująca wydzielona, nie kopiowana**:
  `canonicalSessionDays(days, caller)` — throw z prefiksem wołającego
  (`'onboarding' | 'settings'`) + sort kanoniczny + cast krotki w JEDNYM miejscu
  z komentarzem WHY („validateSessionDays właśnie dowiódł length === 3"). Wzorzec
  dla każdej pary builder/mutator dzielących walidację.
- **Jawny przycisk „Zapisz", gdy stany pośrednie edycji są nieprawidłowe**: wybór dni
  przechodzi przez 2 zaznaczone / dni sąsiadujące — zapis per tap utrwalałby śmieci.
  Kontrast z przełącznikiem języka (każdy stan poprawny → zapis od razu). Dirty =
  porównanie sorted-join z kanonicznym stanem profilu; po sukcesie prop się odświeża
  i dirty gaśnie samo.
- **Copy błędu przy optymistycznym zapisie nie obiecuje retry, którego nie ma**: po
  odrzuconym zapisie profil w pamięci MA już nowe dni → dirty=false → CTA disabled.
  Komunikat mówi tylko „zmiana może zniknąć po odświeżeniu" — bez „Spróbuj ponownie"
  (istniejący `settings.language.error` z tym „Spróbuj ponownie" to dług, poprawić
  przy okazji).
- **Zmiana `sessionDays` bez historii harmonogramu jest bezpieczna z konstrukcji**:
  derywacja reinterpretuje przeszłe okno nowymi dniami (sloty „przechodzą" niezależnie
  od wykonania — max ±1 slot jitteru pozycji w bloku), a snapshot-wins chroni
  istniejące wpisy (`kind` nigdy nie mutowany) — w tym DZISIEJSZY wpis, jeśli już
  powstał: nowy harmonogram widać na Dziś dopiero od pierwszego dnia bez wpisu.

## Tożsamość wizualna — wzorce z fazy ikony i retheme (2026-07-16)

- **Pipeline ikon jest jednokierunkowy**: edytuj TYLKO `public/icon.svg`, potem
  `npm run generate-pwa-assets` regeneruje wszystkie PNG/favicon. Ręczna edycja
  wygenerowanych plików = nadpisanie przy następnym przebiegu.
- **Pułapka: `--` w komentarzach SVG**: parser XML pwa-assets-generatora odrzuca
  `--` wewnątrz `<!-- ... -->` (spec XML). Nie pisz nazw tokenów jak `--primary`
  w komentarzach SVG — pisz „primary" bez kresek.
- **Kontrast mierzony PRZED wyborem tokenu, wynik w komentarzu przy tokenie**:
  kandydat na `--primary` liczony node one-linerem (luminancja względna → ratio)
  względem KAŻDEGO tła, na którym niesie tekst/ikonę. Wynik zapisany przy tokenie
  (`#0d8478` = dokładnie 4.50:1 AA z `--surface`) — wartości na granicy nie wolno
  „rozjaśnić o włos" bez ponownego pomiaru. Poprzedni pomarańcz miał 2.46:1 i nikt
  o tym nie wiedział, bo nikt nie zmierzył.
- **Retheme = edycja tokenów, audyt konsumentów**: zmiana tożsamości kolorystycznej
  to 2 linie w `tokens.css` (payoff zakazu kolorów inline) + przegląd WSZYSTKICH
  użyć zmienianego tokenu (grep `--primary`) pod kątem ról nie-tekstowych: focus
  outline i inne wskaźniki UI wymagają ≥3:1 z tłem (WCAG 1.4.11), nie 4.5:1.
- **Maskable safe zone**: motyw ikony musi mieścić się w centralnych 80% viewBoxa
  (409.6/512) — weryfikuj numerycznie współrzędne skrajnych elementów, nie na oko.
- **`theme_color` ≠ `--primary`**: kolor paska systemowego to świadoma decyzja
  (u nas krem `#fdf6ec` — spójny z tłem apki); nie podmieniaj automatycznie przy
  retheme.
- **Fork-leftovery brandingu**: przy zmianie tożsamości grep za opisami/nazwami
  poprzedniej apki poza kodem UI — manifest `description` (vite.config), martwe
  SVG w `public/` i `src/assets/`, tytuły w docs. Manifest Showup niósł opis
  Unstuck przez całe MVP.

## Deploy i produkcja (Faza 6)

- **`base: '/showup/'` w vite.config.ts to jedyne miejsce definiujące ścieżkę produkcyjną** — vite-plugin-pwa wyprowadza z niej scope/start_url manifestu i ścieżki service workera; żadnych hardcodowanych `/showup/` w kodzie aplikacji.
- **Pola formularzy (`textarea`, `input`) zawsze z atrybutem `name`** — brak `name`/`id` to issue w DevTools (autofill); `aria-label` nie wystarcza.
- Szczegóły procesu deployu i triki testowe (offline PWA, przechwycenie eksportu) → `.claude/skills/deploy/SKILL.md`.

## Treści statyczne (challenges.json)

- Ręcznie edytowany JSON = dane niezaufane: walidator sprawdza typy w runtime (`typeof`), zbiera WSZYSTKIE błędy w jeden throw, bez cichych fallbacków.
- Bramka builda: `prebuild` uruchamia testy `src/content` — zepsuty katalog nie przechodzi `npm run build`. Nie usuwać tego skryptu.
- W polskich tekstach cudzysłowy typograficzne „…” muszą być domknięte typograficznie — ASCII `"` w środku stringa psuje JSON (błąd znaleziony 2x w Fazie 4).
- Każde wyzwanie musi realizować technikę z listy ZATWIERDZONYCH w `docs/titd-method.{pl,en}.md` (część 4 zawiera techniki odrzucone — ich nie używamy; sprzeczność = zmiana treści albo jawna zmiana dokumentu metody za zgodą użytkownika).
- **Lekcje z cyklu recenzji treści (Feature 8.2, +25 wyzwań):**
  - Nowe wyzwania sprawdzaj pod kątem duplikacji MECHANIZMU (nie tylko słów) z istniejącymi — np. „zgadnij czas i zrób odkładaną rzecz" dublował l1-001/l1-012 mimo innego brzmienia.
  - Refleksja musi być pytaniem naprawdę otwartym: konstrukcje „Czy…?" (tak/nie) są zakazane; używaj „Jak…", „Co…", „Na ile…".
  - Gdy wyzwanie wyższego poziomu ODWRACA radę z niższego (np. „najgorszy kawałek najpierw" vs „najmniejszy opór najpierw"), lekcja musi jawnie zmostkować pozorną sprzeczność.
  - Żadnych płaskich twierdzeń kategorycznych w lekcjach („to, co zauważone, słabnie") — hedgować: „zwykle", „bywa", „może".
  - Mapa technik batcha zawiera noty uczciwości, gdy zadanie wykracza poza literalny zapis techniki (np. „świadomie odpuść" vs priorytetyzacja z części 1 #7).
