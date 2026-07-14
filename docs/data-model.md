# Unstuck — Specyfikacja modelu danych i storage

> Faza 2 · Zakres: MVP wg `docs/prd.md` · Zasady wiążące: `.claude/rules/product-principles.md`, `.claude/rules/data-model.md`
> Konteksty: 100% danych lokalnie, zero backendu, Capacitor-ready, streak wybaczający.

## 0. Zasada nadrzędna

**`DailyEntry` jest jedynym źródłem prawdy o postępie.** Streak, licznik ukończeń, poziom
trudności i lista użytych wyzwań są **wyliczane** z wpisów (czysta funkcja
`computeProgress(entries)`), nie przechowywane jako liczniki. Skala: ~3650 rekordów po 10 latach —
przeliczenie przy starcie to milisekundy; eliminuje klasę bugów desynchronizacji.

## 1. Encje (notacja TypeScript)

```ts
type Lang = 'pl' | 'en';
type ISODate = string;      // YYYY-MM-DD, strefa lokalna; granica dnia = lokalna północ
type ISODateTime = string;  // pełny ISO 8601
type DifficultyLevel = 1 | 2 | 3;

/** Klucze techniczne EN, etykiety zawsze przez i18n */
type Emotion = 'anxiety' | 'boredom' | 'overwhelm' | 'aversion' | 'confusion';
type ChallengeStatus = 'in_progress' | 'completed' | 'skipped';

interface UserProfile {
  id: 'singleton';
  language: Lang;
  startDate: ISODate;
  quiz: QuizResult;
  createdAt: ISODateTime;
}

interface QuizResult {
  answers: Record<string, string>;   // surowe odpowiedzi (przeliczalne po zmianie quizu)
  dominantTriggers: Emotion[];       // pochodna; w MVP wpływa na ton, nie na dobór wyzwań
  completedAt: ISODateTime;
}

type ChallengeCategory = 'small-steps' | 'two-minute' | 'emotion' | 'starting';

interface Challenge {
  id: string;                        // "l1-007" — NIEZMIENNE NA ZAWSZE
  level: DifficultyLevel;
  category: ChallengeCategory;
  i18n: Record<Lang, ChallengeContent>;
}

interface ChallengeContent {
  lesson: string;      // 2–4 zdania
  task: string;        // konkretne zadanie
  reflection: string;  // pytanie refleksyjne
}

interface DailyEntry {
  date: ISODate;                    // KLUCZ GŁÓWNY — jeden wpis na dzień
  challengeId: string;              // przydzielony raz, trwały
  emotionBefore: Emotion | null;
  ifThen: string | null;
  status: ChallengeStatus;          // 'in_progress' od przydzielenia
  reflection: string | null;
  completedAt: ISODateTime | null;
  updatedAt: ISODateTime;
}

/** Pochodny, NIE persystowany — wyliczany przy starcie */
interface ProgressState {
  currentStreak: number;
  longestStreak: number;
  totalCompleted: number;
  completedByLevel: Record<DifficultyLevel, number>;
  currentLevel: DifficultyLevel;
  usedChallengeIds: Set<string>;
  lastCompletedDate: ISODate | null;
}
```

Uwagi:
- Wpis powstaje przy przydzieleniu wyzwania (status `in_progress`) — „otwarty nieukończony" ≠ „appka nieotwarta".
- Dzień bez wpisu = opuszczony; nie tworzymy wpisów wstecz.
- `skipped` = świadome odłożenie; dla streaka jak brak wpisu, w UI bez kary.

## 2. Storage: **IndexedDB** (wrapper `idb`)

| Kryterium | localStorage | IndexedDB |
|---|---|---|
| Rozmiar (nasze ~180 KB/rok) | mieści się | bez znaczenia |
| Model | synchroniczny, cały JSON naraz | rekordy + zakresy po kluczu (kalendarz!) |
| Ryzyko utraty | jeden uszkodzony JSON = cały dziennik | punktowe, per-rekord |
| Capacitor webview | historycznie czyszczony w WKWebView | trwały w kontenerze appki |

**Decyzja: IndexedDB.** Dziennik emocji jest cenny i rośnie latami — atomowość i trwałość > prostota.
Dodatkowo `navigator.storage.persist()` przy pierwszym uruchomieniu.

### Adapter (Capacitor-ready — wiążące)

Domena nigdy nie dotyka IndexedDB bezpośrednio:

```ts
interface StorageAdapter {
  getProfile(): Promise<UserProfile | null>;
  saveProfile(p: UserProfile): Promise<void>;
  getEntry(date: ISODate): Promise<DailyEntry | null>;
  putEntry(e: DailyEntry): Promise<void>;
  getEntriesInRange(from: ISODate, to: ISODate): Promise<DailyEntry[]>;
  getAllEntries(): Promise<DailyEntry[]>;
  getMeta(): Promise<Meta>;
  saveMeta(m: Meta): Promise<void>;
  clearAll(): Promise<void>;
}
```

Ewentualna przyszła podmiana na `@capacitor-community/sqlite` bez dotykania domeny.

### Schemat bazy

```
Baza "unstuck" (version = schemaVersion)
  store "profile" — keyPath "id"   (singleton)
  store "entries" — keyPath "date" (YYYY-MM-DD sortuje się leksykograficznie = chronologicznie)
  store "meta"    — keyPath "id"
```

Bez dodatkowych indeksów w MVP.

## 3. Streak wybaczający

Definicja (wiążąca):
- Streak = liczba **ukończonych** dni w bieżącej serii (dzień wybaczony nie dodaje +1, nie kasuje).
- Grace **odnawialny**: każda pojedyncza 1-dniowa przerwa wybaczona; 2+ kolejnych dni → seria od nowa.
- Dzień dzisiejszy „pending" do lokalnej północy — nigdy nie łamie streaka.
- `skipped` = jak brak wpisu (bez kary w UI).

```
computeStreak(entries, today):
    completed = daty wpisów status=='completed', malejąco
    if pusta: return 0
    anchor = completed[0]
    if daysBetween(anchor, today) > 2: return 0
    streak = 1; prev = anchor
    for d in completed[1:]:
        diff = daysBetween(d, prev)
        if diff <= 2: streak += 1; prev = d   # diff==2: 1 dzień wybaczony
        else: break                            # diff>=3: koniec serii
    return streak
```

Przykłady: `✓✓✓[pending]`→3 · `✓✓·[pending]`→2 · `✓✓··[pending]`→0 · `✓·✓·✓✓`→4 · `✓··✓✓`→2

## 4. Dobór wyzwania dnia

### Progresja
```
currentLevel: L1 dopóki <7 ukończeń L1; potem L2 dopóki <7 ukończeń L2; potem L3
```
Awans po 7/10 (nie trzeba „zaliczyć wszystkiego"). Quiz NIE wpływa na dobór w MVP.

### Algorytm (deterministyczny, bez powtórek)
```
getTodaysChallenge(today):
    entry = storage.getEntry(today)
    if entry: return challengeById(entry.challengeId)     # trwałość przydziału

    level = currentLevel(computeProgress(all))
    pool = nieużyte wyzwania poziomu level, sortBy(id)
    if pool puste and level < 3: pool = nieużyte z level+1     # fallback 1
    if pool puste: challenge = LRU z poziomu level              # fallback 2 (powtórki)
    else: challenge = pool[fnv1aHash(today) % pool.length]

    storage.putEntry({date: today, challengeId, status: 'in_progress', ...})
```

Decyzja: dzień `skipped`/opuszczony **zużywa** wyzwanie (unika „appka męczy mnie tym samym").
Zmiana = jeden filtr, jeśli dogfooding pokaże inaczej.

## 5. Wersjonowanie + eksport

```ts
interface Meta { id: 'meta'; schemaVersion: number; installedAt: ISODateTime; }

interface Migration {
  from: number; to: number;                  // zawsze from+1
  migrate(data: ExportBlob): ExportBlob;     // czysta funkcja NA BLOBIE, nie na DB
}

interface ExportBlob {
  app: 'unstuck';
  schemaVersion: number;
  exportedAt: ISODateTime;
  profile: UserProfile;
  entries: DailyEntry[];
}
```

- Migracje operują na formacie eksportu: `load → toBlob → applyMigrations → replaceAll`.
  Jedna ścieżka dla upgrade'u appki i importu starego pliku.
- Eksport: `unstuck-export-YYYY-MM-DD.json` (Blob + `<a download>`). Bez treści wyzwań.
- Import = **replace** (nie merge); walidacja `app` + `schemaVersion <= CURRENT`.
  Zaimplementowane (F8.1): `validateExportBlob` w `src/domain/import.ts` (result type,
  zbiera wszystkie błędy; `schemaVersion > CURRENT` → osobny powód `newer`),
  `replaceAll` w adapterach (jedna transakcja: profil+wpisy zastąpione, `meta`
  zachowane — `installedAt` opisuje to urządzenie, `quizDraft` czyszczony),
  UI w Ustawieniach (file picker → inline confirm z datą i liczbą wpisów).
  Po imporcie App remountuje Shell — boot czyta stan na nowo z IndexedDB.
- Eksport = jedyny backup; delikatne przypomnienie co ~30 dni.

## 6. Treści: `challenges.json`

Plik statyczny bundlowany z appką (nigdy w IndexedDB). Aktualizacja treści = deploy.

```jsonc
{
  "contentVersion": 1,
  "challenges": [
    {
      "id": "l1-001", "level": 1, "category": "two-minute",
      "i18n": {
        "pl": { "lesson": "…", "task": "…", "reflection": "…" },
        "en": { "lesson": "…", "task": "…", "reflection": "…" }
      }
    }
  ]
}
```

- Oba języki w jednym rekordzie — brak `en` = błąd walidacji builda, nie cichy fallback.
- Walidacja: unikalne id `l{level}-{nnn}`, komplet pl+en, min. 10 wyzwań/poziom.
- Usuwanie wyzwania dozwolone (dziennik pokaże wpis bez treści); zmiana id **zabroniona**.

## 7. Decyzje i trade-offy

| # | Decyzja | Odrzucone | Dlaczego |
|---|---|---|---|
| 1 | IndexedDB + `idb` | localStorage | trwałość wieloletniego dziennika, atomowość per-rekord |
| 2 | ProgressState wyliczany | persystowane liczniki | zero desynchronizacji |
| 3 | Grace odnawialny | jednorazowy | self-compassion > gamifikacyjna „uczciwość" |
| 4 | Przydział wyzwania trwały | czysto obliczeniowy | restart appki nie zmienia wyzwania |
| 5 | Migracje na blobie | na surowym IndexedDB | jedna ścieżka: upgrade + import |
| 6 | Import = replace | merge | merge to pole minowe; brak sync jest świadomy |
| 7 | Treści poza DB, id niezmienne | wyzwania w DB | deploy = aktualizacja treści, zero migracji |
| 8 | StorageAdapter | bezpośrednie wywołania | Capacitor-ready, podmiana na SQLite bez zmian w domenie |
