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

- Baza `showup` v1, story: `entries`, `meta`, `profile`.
- Klucz `entries` jest **in-line** (pole `date`, format `YYYY-MM-DD` z
  `toLocaleDateString('sv-SE')`) → `store.put(obj)` bez drugiego argumentu.
- Dostęp przez `chrome-devtools_evaluate_script` (raw IndexedDB API, bez `idb`).

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

Do pokazania ✓/🌿/legendy dosiej wpisy `status: 'completed'` na wybrane daty
(np. luka 1-dniowa = dzień wybaczony). Użyj neutralnego `challengeId` (`l1-001`).
**Zapisz listę dosianych dat** — sprzątanie to `store.delete(date)` dla każdej.

## Technika 3: zamrożenie auto-advance do screenshota

Stany przejściowe (zaznaczona emocja + dymek, przed 900 ms auto-advance) znikają
za szybko na screenshot. Monkey-patch przed kliknięciem:

```js
() => { window.setTimeout = () => 0; return 'frozen'; }
```

- Znika samoczynnie po `reload` — nie wymaga sprzątania w kodzie.
- Patchuj **tylko na czas jednego screenshota**, potem od razu reload.

## Checklist sprzątania (obowiązkowy)

1. Usuń/przywróć wszystkie zmienione wpisy (porównaj z backupem z wyniku narzędzia).
2. Przywróć język (PL to język referencyjny — Ustawienia → Polski).
3. `reload` strony (zdejmuje monkey-patche, odświeża stan Reacta).
4. Snapshot potwierdzający stan wyjściowy + czysta konsola.
