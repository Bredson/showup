# Showup — Specyfikacja modelu danych i storage

> Zakres: MVP wg `docs/prd.md` · Program: `docs/pushup-program-research.md` §3
> Odziedziczone z Unstuck bez zmian: IndexedDB + `idb`, StorageAdapter (Capacitor-ready),
> migracje na blobie, import = replace, eksport jako jedyny backup, i18n w treściach.
> Ten dokument opisuje różnice i nowe encje.
> Status: po niezależnym review (FIX FIRST → poprawki naniesione, patrz §8).

## 0. Zasada nadrzędna (odziedziczona, rozszerzona)

**`DailyEntry` jest jedynym źródłem prawdy.** Passa, pozycja w programie (wariant, przedział,
tydzień bloku), historia testów — wszystko **wyliczane** z wpisów czystą funkcją
`computeProgram(entries, profile, program)`. Zero persystowanych liczników.

**Wyjątek-snapshot:** raz zapisany wpis (jego `kind`, `variant`) zawsze wygrywa z derywacją —
derywacja wyznacza tylko dni jeszcze nieotwarte. (Rozwiązuje to też onboardingowy test
i dni przesunięte — patrz §4.)

> Ryzyko zapisane w fitness-research.md: jeśli wyliczanie pozycji okaże się kruche
> (szum danych), dopuszczamy persystowany snapshot pozycji — ale dopiero po dowodzie
> z dogfoodingu, nie prewencyjnie.

## 1. Encje (notacja TypeScript)

```ts
type Lang = 'pl' | 'en';
type ISODate = string;
type ISODateTime = string;

/** Drabinka wariantów — kolejność = trudność (pushup-program-research §3) */
type Variant = 'wall' | 'incline-high' | 'incline-low' | 'knee' | 'full';

/** Check przed startem (tylko sesja/test; na dzień łatwy zawsze null) */
type Feel = 'fresh' | 'ok' | 'tired' | 'pain';
//           świeżo    OK     zmęczony/  coś boli → degradacja do dnia
//                            zakwasy → sesja -1 seria     łatwego (downgradedTo)

type DayKind = 'session' | 'easy' | 'test';
type EntryStatus = 'in_progress' | 'completed';
// Brak 'skipped': dzień bez ukończenia = wpis in_progress lub brak wpisu; nie ma
// jawnego "pomiń" w pętli (przesunięcie sesji i degradacja bólowa to osobne mechanizmy).

type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;  // 0 = niedziela (jak Date.getDay())

interface UserProfile {
  id: 'singleton';
  language: Lang;
  startDate: ISODate;
  /** Stałe dni sesji (onboarding); walidacja: żadne dwa nie sąsiadują (mod 7) */
  sessionDays: [Weekday, Weekday, Weekday];
  ifThen: string | null;                    // kotwica: "Kiedy [sygnał], robię sesję"
  disclaimerAcceptedAt: ISODateTime;        // PAR-Q-style, warunek pierwszego testu
  createdAt: ISODateTime;
}

interface DailyEntry {
  date: ISODate;                 // KLUCZ GŁÓWNY — jeden wpis na dzień
  kind: DayKind;                 // snapshot przy otwarciu dnia — NIGDY nie mutowany
  variant: Variant;              // wariant obowiązujący tego dnia (trwały snapshot)
  feelBefore: Feel | null;       // tylko kind='session'|'test'
  /** feel='pain' NIE zmienia kind; zapisuje degradację (sesja/test wykonane jako easy) */
  downgradedTo: 'easy' | null;
  status: EntryStatus;
  /** kind='session' bez degradacji: wykonane powtórzenia per seria */
  sets: number[] | null;
  /** kind='test' bez degradacji: wynik Max Testu (powtórzenia do upadku technicznego) */
  testResult: number | null;
  /** kind='easy' lub downgradedTo='easy': co wykonano jako 2-min minimum */
  easyContent: 'gtg-set' | 'warmup' | null;
  reflection: string | null;     // tylko po sesji/teście
  completedAt: ISODateTime | null;
  updatedAt: ISODateTime;
}

/** Pochodny, NIE persystowany */
interface ProgramState {
  variant: Variant;              // bieżący wariant drabinki
  /** Ostatni testResult na bieżącym wariancie; po awansie wariantu i przy onboardingu
      na wariant nietestowany: SEED = round(variantSeedFactor × lastMT poprzedniego
      wariantu) do czasu pierwszego realnego testu (blocker #1 review) */
  lastMT: number;
  lastMTisSeed: boolean;
  bracket: BracketId;            // ZAWSZE = bracketFor(lastMT) — czysto pochodny (blocker #3)
  blockWeek: 1 | 2 | 3 | 4 | 'regen';  // 'regen' = tydzień regeneracyjny po oblanym teście
  volumeModifier: 1 | 0.9;       // 0.9 = blok powtarzany po regeneracji
  sessionsDoneThisWeek: number;
  consolidations: number;        // ile razy blok powtórzony (framing: normalne)
  failedTestsInRow: number;      // inkrement gdy newMT <= lastMT; 2 → zejście przedział/wariant
  goalReachedAt: ISODate | null; // pierwszy testResult >= 100 na 'full' → ekran celebracji
  currentStreak: number;         // obecność (patrz §3)
  longestStreak: number;
  testHistory: Array<{ date: ISODate; variant: Variant; result: number; seed?: boolean }>;
}
```

Uwagi:
- `variant` i `kind` są **snapshotem w momencie przydziału**: restart appki, awans ani
  degradacja bólowa nie zmieniają już otwartego dnia (degradacja żyje w `downgradedTo`).
- Dzień bez wpisu = opuszczony; nie tworzymy wpisów wstecz (odziedziczone).
- `sets` = wykonane powtórzenia; plan z tabeli jest wyliczalny, więc niepersystowany.
- Pierwszy Max Test (onboarding) zapisuje się jako normalny `DailyEntry` `kind='test'`
  z datą `startDate` — dzięki regule snapshotu z §0 nie koliduje z derywacją typu dnia,
  a `testHistory` widzi test #1.

## 2. Storage

Bez zmian koncepcyjnych vs Unstuck. Różnice:

```
Baza "showup" (⚠ WIĄŻĄCE: wspólny origin bredson.github.io z Unstuck — nazwa musi być inna)
  store "profile" — keyPath "id"
  store "entries" — keyPath "date"
  store "meta"    — keyPath "id"
```

`StorageAdapter` — interfejs odziedziczony 1:1 (getEntry/putEntry/getEntriesInRange/…).

## 3. Passa obecności (streak)

**Odziedziczone bez zmian są FUNKCJE `computeStreak` / `computeLongestStreak` /
`daysBetween`** (dotykają tylko `status` i `date` — zweryfikowane w review). Reszta modułu
`streak.ts` (`levelFromChallengeId`, `currentLevel`, `computeProgress`,
`COMPLETIONS_TO_ADVANCE`) jest sprzężona z modelem wyzwań Unstuck i zostaje **zastąpiona**
przez nowy `program.ts`. ⚠ `src/domain/types.ts` po forku wciąż ma kształt Unstuck —
migracja typów to pierwszy krok prac silnika, przed jakimkolwiek feature'em.

Semantyka „ukończenia":
- dzień liczy się do passy, gdy `status='completed'` **niezależnie od `kind`** —
  odhaczony dzień łatwy (2-min minimum) = pełnoprawny dzień passy;
- passa NIGDY nie zależy od liczby powtórzeń ani wyniku testu;
- dzień łatwy z samą rozgrzewką nadgarstków = też `completed`;
- dzień zdegradowany bólem (`downgradedTo='easy'`) ukończony = też `completed`.

## 4. Silnik programu (zastępuje dobór wyzwania z puli)

### Pozycja w bloku (derywacja — blocker #4)

Pozycja liczona w **slotach zaplanowanych sesji** (3 sloty = 1 tydzień bloku), nie
w tygodniach kalendarzowych:

```
slot zaliczony = zaplanowany dzień sesji, który minął (completed LUB przepadł)
blockWeek = 1 + (sloty od startu bloku) div 3   (cap: patrz test poniżej)
```

- Sesja przepada bez kary, ale **slot mija** — program płynie do przodu; tydzień się nie „psuje".
- **Pauza:** jeżeli od ostatniego `completed` (dowolnego kind) minęło > 14 dni, pozycja
  zamarza, a pierwszym dniem po powrocie jest **retest** (`kind='test'`) — dopiero jego
  wynik osadza nowy blok. (Reguła „przerwa > 2 tyg. → najpierw retest" działa przy
  otwarciu dnia, w `dayKind`, nie w bramce.)

### Typ dnia
```
dayKind(today, entries, profile, state):
    if istnieje wpis(today): return jego kind                 # snapshot wygrywa (§0)
    if pauza > 14 dni: return 'test'                          # retest po przerwie
    if state.blockWeek == 'regen': return 'easy'              # tydzień regeneracyjny
    if today ∈ sessionDays(profile) or dziś_dozwolone_przesunięcie(entries):
        if blockWeek == 4 and slot == 3. slot tygodnia: return 'test'
        #  test opuszczony/zdegradowany → wędruje na NASTĘPNY zaplanowany dzień sesji
        #  (tydzień 4 się wydłuża; bramka czeka na wynik) — major #7
        return 'session'
    return 'easy'
```

**Przesunięcie o 1 (major #6):** opuszczona sesja w stały dzień może być wykonana
następnego dnia TYLKO gdy przesunięty dzień jest ≥ 48 h od poprzedniej twardej sesji
**i** ≥ 48 h przed następnym zaplanowanym dniem sesji. Inaczej sesja przepada — **bez
kaskady** (kaskadowe przesuwanie niszczy stały sygnał nawykowy, Kaushal & Rhodes).
Detekcja: wczorajszy zaplanowany slot bez wpisu `completed` + warunki 48 h.

### Plan sesji (minor #11 — kolejność: baza → deload → feel)
```
sessionPlan(state, program, feel):
    week = state.blockWeek == 4 ? tydzień 3 : state.blockWeek
    base = program.brackets[state.bracket].weeks[week].sets
    plan = base.map(pct => round(pct * state.lastMT * state.volumeModifier))
           ostatni element "A" → AMRAP-1
    if state.blockWeek == 4: plan = plan × deloadVolumeFactor, "A" → zwykła seria  # deload
    if feel == 'tired': usuń jedną środkową serię z planu
    if feel == 'pain':  downgradedTo='easy' (kind bez zmian) + copy czerwonych flag
                        # dotyczy też kind='test' — test wędruje na następny slot
```

### Bramka testowa (po każdym ukończonym teście)
```
gate(newMT, state):
    if newMT >= 100 and variant == 'full': goalReached                    # minor #16
    if newMT >= 1.15 * lastMT or bracketFor(newMT) != bracketFor(lastMT):
        nowy blok; tabela ZAWSZE wg bracketFor(newMT)                     # blocker #3
    elif newMT > lastMT:  powtórz blok (konsolidacja), volumeModifier = 1
    else:                 failedTestsInRow += 1                           # minor #14
                          tydzień 'regen' (same easy, passa nietknięta),
                          potem POPRZEDNI blok z volumeModifier = 0.9
    if failedTestsInRow == 2: zejście o przedział lub wariant + prompt o śnie/bolesności
    if variant != 'full' and newMT >= variantGraduateMT:
        awans wariantu; lastMT = round(variantSeedFactor × newMT), lastMTisSeed = true
        # seed do pierwszego realnego testu na nowym wariancie (blocker #1);
        # komunikat do użytkownika: "nowy max będzie niższy — to normalne"
```

### Onboarding: pierwszy Max Test (major #10)

Kaskada z góry: start od `full`; wynik < `fullEntryMinMT` (5) → po przerwie **jedna** próba
na łatwiejszym wariancie; maksymalnie **2 realne próby** w onboardingu — jeżeli druga też
poniżej progu wejścia (`variantEntryMinMT` = 6), pozostałe warianty **estymowane** seedem
(`variantSeedFactor` w drugą stronę) i trening zaczyna się na najłatwiejszym dopasowanym.
Podłoga drabinki: `wall` z MT < 6 → mimo wszystko trenuj `wall` na najniższym przedziale
(nic łatwiejszego nie istnieje). Wynik = `DailyEntry` `kind='test'` na `startDate`.

## 5. Wersjonowanie + eksport

Mechanizm odziedziczony (migracje na blobie, replace, walidacja). Różnice:

```ts
interface ExportBlob {
  app: 'showup';               // ⚠ celowo niekompatybilne z 'unstuck' — appki nie mieszają danych
  schemaVersion: number;
  exportedAt: ISODateTime;
  profile: UserProfile;
  entries: DailyEntry[];
}
```
Eksport: `showup-export-YYYY-MM-DD.json`.

## 6. Parametry programu: `program.json`

Odpowiednik `challenges.json`, ale to **plik parametrów, nie katalog treści** — tabele
i progi są strojone bez zmian kodu (research: progi to konwencje, nie stałe).
Teksty instruktażowe (opisy wariantów, standard formy, copy bezpieczeństwa) mieszkają
w i18n, nie tutaj.

```jsonc
{
  "programVersion": 1,
  "variants": ["wall", "incline-high", "incline-low", "knee", "full"],
  "variantEntryMinMT": 6,        // trenuj najtrudniejszy wariant z MT >= 6…
  "fullEntryMinMT": 5,           // …ale pełne pompki już od MT >= 5 (major #5)
  "variantGraduateMT": 20,       // MT >= 20 → następny wariant
  "variantSeedFactor": 0.4,      // seed lastMT po awansie wariantu (blocker #1)
  "testGateImprovement": 0.15,
  "deloadVolumeFactor": 0.6,
  "easySetFactor": [0.4, 0.5],   // widełki serii GtG dnia łatwego (× lastMT, seed też OK)
  "brackets": [
    {
      "id": "b1", "minMT": 5, "maxMT": 10,
      "weeks": [                  // % lastMT per seria; "A" = AMRAP-1 (tylko ostatnia)
        { "sets": [0.6, 0.7, 0.5, 0.5, "A"] },
        { "sets": [0.65, 0.75, 0.55, 0.55, "A"] },
        { "sets": [0.7, 0.8, 0.6, 0.6, "A"] },
        { "deload": true }
      ]
    }
    // kolejne przedziały: 11–20, 21–35, 36–50, 51–75, 76–100
  ]
}
```

Walidacja builda (wzorzec `src/content/index.ts`, rozszerzona wg minor #15):
- przedziały posortowane, przylegające, pokrywają `min(fullEntryMinMT, …)`–100 bez dziur
  i nakładek; `min(bracket.minMT) <= min(progi wejścia)` (łapie rozjazd 6-vs-5);
- 4 tygodnie per przedział, czwarty = `deload`; dokładnie 5 elementów `sets`
  w tygodniach 1–3; `"A"` wyłącznie jako ostatni element;
- mnożniki niemalejące tydzień 1→3 **per pozycja serii** (slot `"A"` pomijany);
- `0 < testGateImprovement < 1`, `0 < variantSeedFactor < 1`, `deloadVolumeFactor < 1`.

## 7. Decyzje i trade-offy

| # | Decyzja | Odrzucone | Dlaczego |
|---|---|---|---|
| 1–8 | odziedziczone z Unstuck | — | patrz historia gita: data-model.md Unstuck §7 |
| 9 | Pozycja programu wyliczana z wpisów | persystowany stan programu | ta sama zasada co ProgressState; snapshot dopuszczalny dopiero po dowodzie z dogfoodingu |
| 10 | Baza `showup`, eksport `app:'showup'` | współdzielenie z Unstuck | wspólny origin github.io; appki muszą być izolowane danymi |
| 11 | Tabele jako % maxa w `program.json` | sztywne tabele Speirsa | jeden plik parametrów zamiast setek wierszy; progi strojone bez kodu |
| 12 | `variant`+`kind` snapshotowane, degradacja w `downgradedTo` | mutowalny `kind` | niezmienny snapshot = derywacja stabilna; przypadek „test pominięty przez ból" reprezentowalny |
| 13 | Plan sesji niepersystowany, tylko wykonanie | plan+wykonanie | plan wyliczalny; mniej stanu = mniej desynchronizacji |
| 14 | Passa liczy `completed` każdego rodzaju dnia | passa tylko za sesje | nawyk = obecność; sesje wymusza harmonogram, nie passa |
| 15 | `bracket` czysto pochodny z `lastMT` | awans przedziału jako akcja bramki | tabela zawsze skalibrowana do realnej zdolności (bezpieczeństwo) |
| 16 | Pozycja bloku w slotach sesji, nie tygodniach kalendarza | tygodnie kalendarzowe | pauza nie przesuwa programu za test; „wróć do tygodnia, w którym stanąłeś" |
| 17 | Seed `lastMT` po awansie wariantu (0.4×) | natychmiastowy retest | retest łamie „MT na świeżo"; seed strojony parametrem, koryguje go pierwszy realny test |
| 18 | Bez `skipped` w statusach | enum z Unstuck | martwy stan: nie ma jawnego „pomiń"; przesunięcie i degradacja to osobne mechanizmy |

## 8. Review

Niezależny review (2026-07-15): werdykt FIX FIRST — 4 blockery (seed lastMT po awansie
wariantu; mutacja `kind` przy bólu; `bracket` definiowany dwuznacznie; niederywowalny
`blockWeek` + brak stanów regen/90%), 6 majorów, 6 minorów. Wszystkie naniesione w tej
wersji. Poprawka do research §3 („awans przedziału" → tabela zawsze wg `bracketFor(newMT)`)
odnotowana w pushup-program-research.md.
