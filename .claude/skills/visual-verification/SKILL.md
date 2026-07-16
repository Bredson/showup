---
name: visual-verification
description: Techniki weryfikacji wizualnej ekranów Showup zależnych od stanu IndexedDB (kalendarz, streak, stany zaznaczenia z auto-advance). Używaj w kroku "weryfikacja wizualna" feature-workflow, gdy screenshot wymaga konkretnego stanu danych lub zatrzymania animacji/timera.
---

# Weryfikacja wizualna ekranów stanowych

Ekrany Showup (Dziś, Progres, pętla) renderują się z IndexedDB. Żeby zobaczyć
konkretny stan (np. dzień wybaczony 🌿, passa 4 dni, zaznaczona emocja przed
auto-advance), trzeba tymczasowo zmienić dane lub zatrzymać timer — **zawsze
z planem powrotu do stanu wyjściowego**.

## Baza dev

- Baza `showup` **v2** (schema storage v2), story: `entries`, `meta`, `profile`.
- Klucz `entries` jest **in-line** (pole `date`, format `YYYY-MM-DD` z
  `toLocaleDateString('sv-SE')`) → `store.put(obj)` bez drugiego argumentu.
- Dostęp przez `chrome-devtools_evaluate_script` (raw IndexedDB API, bez `idb`).
- **Po `indexedDB.deleteDatabase('showup')` ZAWSZE reload** — delete przy otwartym
  połączeniu appki daje `InvalidStateError: database connection is closing` przy
  późniejszym zapisie.

## Live smoke po deployu — pułapka SW precache

- Pierwsza wizyta na produkcji po deployu serwuje STARĄ wersję z precache workboxa
  (nowy SW dopiero się instaluje) — brak nowych elementów UI to zwykle stale cache,
  nie zepsuty deploy. Wymuś: `navigator.serviceWorker.getRegistrations()` →
  `r.update()` → odczekaj → **2× reload** → dopiero wtedy oceniaj.
- **Wspólny origin `bredson.github.io` z Unstuck i realnymi danymi użytkownika**:
  na produkcji NIGDY `deleteDatabase` ani zapisów testowych — tylko sondy read-only
  (`count()` na store) i asercje na renderze.

## Zanim zaczniesz: JEDNA karta na origin

Przed sianiem/chirurgią wywołaj `list_pages` i **zamknij zbędne karty z tym samym
originem** (`close_page`). Druga karta apki dzieli IndexedDB i jej boot effect
potrafi w trakcie weryfikacji dopisać/zmutować wpis dnia (np. wpis `pain→easy
completed`, którego nikt nie wyklikał) — objaw wygląda jak bug apki, a to
skażenie danych przez osieroconą kartę z poprzedniej sesji.

## Technika 1: chirurgiczna edycja wpisu Z BACKUPEM

Zasada: **odczytaj i zwróć stary obiekt w wyniku narzędzia ZANIM go nadpiszesz**.
Backup ląduje w transkrypcie rozmowy — przetrwa nawet crash sesji przeglądarki.

```js
async () => {
  const db = await new Promise((res, rej) => {
    const o = indexedDB.open('showup', 1);
    o.onsuccess = () => res(o.result); o.onerror = () => rej(o.error);
  });
  const tx = db.transaction('entries', 'readwrite');
  const store = tx.objectStore('entries');
  const backup = await new Promise((res) => {
    const g = store.get('2026-07-14'); g.onsuccess = () => res(g.result);
  });
  store.put({ ...backup, status: 'skipped' }); // modyfikacja
  await new Promise((res) => { tx.oncomplete = res; });
  db.close();
  return { backup }; // ← backup w wyniku narzędzia = plan powrotu
}
```

Po screenshocie: przywróć backup (`store.put(backup)`) i **potwierdź snapshotem**,
że UI wrócił do stanu wyjściowego.

## Technika 2: sianie tymczasowych wpisów (stany kalendarza / passy)

Do pokazania ✓/🍃/legendy dosiej wpisy `status: 'completed'` na wybrane daty
(np. luka 1-dniowa = dzień wybaczony). Kształt wpisu Showup: `{ date, kind:
'session'|'easy'|'test', variant, feelBefore, downgradedTo, status, sets,
testResult, easyContent, reflection, completedAt, updatedAt }` — pola nieużywane
jako `null`, NIE pomijane. Pamiętaj: historia MUSI zaczynać się testem
założycielskim (`kind:'test'` z `testResult`), inaczej `computeProgram` rzuca.
**Zapisz listę dosianych dat** — sprzątanie to `store.delete(date)` dla każdej
albo `indexedDB.deleteDatabase('showup')` + reload, gdy baza dev ma być pusta.

## Technika 3: zamrożenie auto-advance do screenshota

Stany przejściowe (zaznaczona emocja + dymek, przed 900 ms auto-advance) znikają
za szybko na screenshot. Monkey-patch przed kliknięciem:

```js
() => { window.setTimeout = () => 0; return 'frozen'; }
```

- Znika samoczynnie po `reload` — nie wymaga sprzątania w kodzie.
- Patchuj **tylko na czas jednego screenshota**, potem od razu reload.

## Technika 4: upload pliku przez ukryty input (import danych)

`chrome-devtools_upload_file` przyjmuje uid **widocznego przycisku, który otwiera
picker** („Importuj dane") — narzędzie samo trafia w ukryty `<input type="file">`
wyzwalany przez `ref.click()`. Nie szukaj uida ukrytego inputa (hidden = brak w
snapshocie a11y).

- Plik-atrapa do ścieżki negatywnej: `{"hello":"world"}` w pliku `.json`.
- Poprawny blob do ścieżki pozytywnej buduj z ŻYWEJ bazy (`getAll` na stores) —
  ręczne klecenie wpisów rozjedzie się z walidatorem inwariantów (gate-test).
- Import przez confirm wykonany do końca remountuje Shell (`key={importGeneration}`)
  i ląduje na tabie „Dziś" — to oczekiwany dowód sukcesu, nie regresja nawigacji.
- Przechwycenie EKSPORTU (download) → `.claude/skills/deploy/SKILL.md` (patch
  `HTMLAnchorElement.prototype.click`).

## Technika 5: obserwacja rederywacji „dziś" (pułapka snapshot-wins)

Zmiana ustawień wpływających na harmonogram (np. `sessionDays`) NIE zmieni ekranu
Dziś, jeśli dzisiejszy wpis już istnieje — `dayKindFor` zwraca `existing.kind`
(snapshot wins, `kind` nigdy nie mutowany). To poprawne zachowanie domenowe,
nie stale props i nie bug — reload niczego nie zmieni.

Żeby zobaczyć świeżą derywację pod nowymi ustawieniami:

1. Backup + `store.delete(dzisiejsza_data)` (Technika 1 — backup w wyniku narzędzia).
2. Reload → Dziś derywuje od zera (uwaga: samo wejście na Dziś **odtwarza** wpis
   in_progress z nowym `kind`).
3. Sprzątanie: `store.put(backup)` nadpisuje odtworzony wpis, reload, snapshot
   potwierdzający stan wyjściowy.

Diagnoza „stale props vs domena" w jednym kroku: reload strony — jeśli po reloadzie
widok się nie zmienia, przyczyna jest w derywacji/danych, nie w propagacji propsów.

## Scenariusz obowiązkowy: dzień założycielski

Zawsze sprawdź ekran ZARAZ po świeżym onboardingu (pusta baza → onboarding →
finisz): wpis testu założycielskiego jest wtedy JEDYNYM wpisem i dzisiejszym
wpisem naraz — minimalna historia wywala derywacje, których testy domenowe nie
pokrywają (crash „świat bez dziś" żył tylko w renderze UI).

**Pułapka wzbogaconego seeda**: onboarding zapisuje test założycielski z
`feelBefore: null` (feel check istnieje tylko w pętli dziennej) — realny stan
po onboardingu to np. PUSTY Dziennik. Seed dev, który „upiększa" wpis
założycielski (feel na teście), maskuje ten stan; weryfikuj też stan o
kształcie DOKŁADNIE takim, jaki produkuje `onboarding.ts` (finding z live
smoke fazy Dziennik: pusty stan okazał się stanem domyślnym produkcji, nie
przypadkiem defensywnym).

## Klikanie w przepływach wielokrokowych — uid churn

Po edycjach plików (HMR) uidy ze snapshotu chrome-devtools dezaktualizują się
natychmiast (`Element uid not found`). W przepływach wielokrokowych klikaj przez
`evaluate_script` po tekście przycisku:

```js
() => { const b = [...document.querySelectorAll('button')]
  .find(x => x.textContent?.trim() === 'Dalej' && !x.disabled);
  if (b) b.click(); return { clicked: !!b }; }
```

Wartość kontrolowanego inputa ustawiaj przez natywny setter + `dispatchEvent(new
Event('input', { bubbles: true }))` — zwykłe `input.value =` nie budzi Reacta.

## Checklist sprzątania (obowiązkowy)

1. Usuń/przywróć wszystkie zmienione wpisy (porównaj z backupem z wyniku narzędzia).
2. Przywróć język (PL to język referencyjny — Ustawienia → Polski).
3. `reload` strony (zdejmuje monkey-patche, odświeża stan Reacta).
4. Snapshot potwierdzający stan wyjściowy + czysta konsola.
