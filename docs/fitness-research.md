# Research: odnoga fitness Unstuck

> Synteza dwóch niezależnych analiz (2026-07-14): research naukowy (literatura o nawykach
> i treningu) oraz analiza architektury repo Unstuck. Cel: czy metodę TodayIsTheDay
> i infrastrukturę Unstuck da się sensownie przenieść na cele fizyczne
> (100 pompek, codzienny ruch, 30 min yogi).

## Werdykt

**TAK — podejście jest obronne naukowo, a fork appki siostrzanej to rekomendowana
architektura (rozmiar L).** Oba raporty zbiegły się w tym samym wniosku z dwóch stron:
nauka mówi „nawyk = startowanie na sygnał, treść treningu = zmienna", architektura mówi
„pętla dnia zostaje, wymienia się tylko progresję".

---

## Część 1: Nauka

### Formowanie nawyku ćwiczeń

- **Phillips & Gardner 2016** (Health Psychol): nawyk **inicjacji** (automatyczne
  startowanie na sygnał) — nie nawyk **wykonania** — przewiduje częstość ćwiczeń.
  Najważniejsze znalezisko: budujemy nawyk *zaczynania*; trening może rosnąć
  i się zmieniać bez łamania nawyku. Dokładnie mechanika pętli Unstuck.
- **Lally et al. 2010** (Eur J Soc Psychol): mediana automatyzacji 66 dni (18–254);
  ćwiczenia automatyzują się WOLNIEJ niż nawyki jedzeniowe. Pojedyncze opuszczenie
  nie niszczy nawyku → wybaczająca passa jest obowiązkowa.
- **Kaushal & Rhodes 2015** (J Behav Med, n=111): nawyk formuje się w ~6 tygodni
  przy **≥4 sesjach/tydz.**; kluczowe: spójność, stały sygnał, niska złożoność.
  Okno krytyczne churnu = tygodnie 2–6 (nowość mija, pojawia się DOMS).
- **BJ Fogg, Tiny Habits**: kanoniczny przykład to dosłownie „po umyciu zębów
  robię 2 pompki" — kotwica + mikrozachowanie + celebracja.
- **Fresh-start effect** (Dai, Milkman & Riis 2014) i **implementation intentions**
  dla ćwiczeń (Bélanger-Gravel 2013, metaanaliza) — przenoszą się bez zmian.

### Mikro-dawki treningu

- **VILPA — Stamatakis et al. 2022** (Nature Medicine, ~25k osób): 3–4 jednominutowe
  intensywne zrywy dziennie ↔ 26–30% niższa śmiertelność ogólna/CVD.
  Reguła 2 minut ma realną wartość fizjologiczną.
- **Exercise snacks** (Jones et al. 2024, Sports Med; Jenkins/Gibala 2019):
  krótkie rozproszone dawki poprawiają wydolność — minuty się kumulują.
- **Grease the Groove** (Tsatsouline): częste submaksymalne serie (40–60% maxa,
  nigdy do upadku) — praktyka trenerska bez RCT, ale spójna z nauką o uczeniu
  motorycznym. Droga do 100 pompek w ~5 min/dzień: realna, ale w miesiącach.
- **Minimalna skuteczna dawka**: siła rośnie już od 1 ciężkiej serii 2–3x/tydz.
  (Androulakis-Korakakis 2020); wytrzymałość mięśniowa wymaga progresji objętości.

### Motywacja

- **Teixeira et al. 2012** (przegląd 66 badań): motywacja autonomiczna przewiduje
  długoterminową wytrwałość; presja/wina (motywacja kontrolowana) — efekt mieszany
  do negatywnego. Wybaczająca passa + samowspółczucie = przewaga, nie miękkość.
  Copy oparte na winie = błąd projektowy.

### Wzorce sprawdzonych programów

| Program | Struktura | Kluczowa lekcja |
|---|---|---|
| hundredpushups.com | 6 tyg., **3x/tydz.**, progresja bramkowana **max testem**, powtarzalne tygodnie | poziom awansuje test, nie licznik dni |
| Couch to 5K | 9 tyg., **3x/tydz.**, dni odpoczynku integralne | codzienny twardy trening = kontuzje nowicjuszy |
| Yoga with Adriene 30 dni | codziennie, ale intensywność faluje (ciężki dzień → regeneracyjny) | codzienność OK, gdy lekkie dni SĄ regeneracją |

## Część 2: Gdzie fitness łamie model Unstuck

1. **Passa vs dni odpoczynku** — codzienny twardy trening sprzeciwia się fizjologii
   (superkompensacja); codzienna *obecność* nie. Fix: passa liczy „pokazanie się"
   (2-min minimum ruchu), obciążenie treningowe periodyzowane 3–4x/tydz.
2. **Progresja po 7 ukończeniach nie działa** — 7 dni po 5 pompek nie znaczy,
   że 10 jest bezpieczne. Fix: bramkowanie testem zdolności; oblany test →
   „powtórz tydzień" bez wstydu; automatyczne deloady.
3. **Silnik „zawsze więcej" + presja passy** → trenowanie przez ból. Fix: check
   ciała/bólu przed startem (soreness → auto-obniżenie), cap na eskalację.

### Co się przenosi / co trzeba zmienić

| Mechanika Unstuck | Przenosi się? | Wymagana zmiana |
|---|---|---|
| Jedno małe wyzwanie dziennie | TAK — buduje nawyk inicjacji | codziennie = „pokaż się"; twardy trening 3–4x/tydz. |
| Reguła 2 minut | TAK (Fogg, VILPA) | stałe minimum, także w dni odpoczynku |
| Implementation intentions (IF-THEN) | TAK | bez zmian |
| Emotion check przed startem | TAK | + check ciała/bólu |
| Samowspółczucie po potknięciu | TAK | rozszerzyć na „oblany test poziomu" |
| Wybaczająca passa | TAK — wręcz obowiązkowa | passa liczy obecność; dzień odpoczynku ≠ opuszczenie |
| Progresja poziomami | CZĘŚCIOWO | bramkowanie testami zdolności + deloady |

## Część 3: Architektura

### Opcje

- **(a) Treści ruchowe w tej samej puli — S.** Jedna linia w `ChallengeCategory` +
  wpisy w `challenges.json`. Tanie, ale **nie realizuje celu**: brak drogi do 100
  pompek, brak progresji zdolnościowej. To „lekcje CBT o ruchu".
- **(b) Tryb goal/track w Unstuck — XL.** Druga maszyna stanów progresji, dualne
  ekrany, migracje schematu, `DailyEntry.performance`. Najwyższe reużycie na papierze
  (~60–70%), ale łamie zasadę PRD („główny ekran = jedno wyzwanie"), rozmywa
  tożsamość produktu i niesie największe ryzyko regresji działającej appki.
- **(c) Fork — appka siostrzana — L. ✅ WYBRANA (decyzja użytkownika 2026-07-14).**

### Plan forka (opcja c)

Zostaje niemal bez zmian (~50–60% kodu):
`dailyLoop.ts`, `comeback.ts` (**soft restart ≈ deload!**), `calendar.ts`,
`journal.ts`, `export/import.ts`, cały `src/storage/` (adapter + idb + memory twin),
`src/i18n/`, powłoka UI i ekrany pętli, PWA.

Do podmiany (małe, czyste moduły z gotowymi suitami testów jako szablonami):

- `streak.ts` progresja → awans zdolnościowy (rung advancement: awans gdy cel
  osiągnięty przy niskim wysiłku, nie po 7 dniach)
- `challenge.ts` wybór z puli → `program.ts` z uporządkowaną pozycją w drabince
  (bez hash-picka i LRU)
- `challenges.json` → `program.json` (szczeble, sesje, planowane dni odpoczynku,
  tygodnie deload)
- Nowe: `SessionEntry.performance` (reps/minutes), ocena wysiłku (RPE), wpisy
  testów zdolności — pozycja w programie **wyprowadzalna z wpisów** (zachowana
  zasada single-source-of-truth)

Forkowalność jest wysoka dzięki decyzjom z Faz 0–3: `src/domain/` bez importów
React/storage, czas wstrzykiwany, storage za `StorageAdapter`, treść jako JSON
z walidacją buildową. Koszt: dywergencja wspólnych fixów — monorepo z pakietem
`core` rozwiązałoby to za +M; odkładamy, aż drugi rozjeżdżający się fix
naprawdę zaboli.

## Największe ryzyka projektowe

1. **Kolizja passy z dniem odpoczynku** — passa wymagająca codziennego treningu =
   kontuzja albo churn po pierwszym opuszczeniu. Passa musi mieć trzeci stan:
   „planowany odpoczynek" (i nie stracić semantyki samowspółczucia).
2. **Awans po liczbie ukończeń** — spirala porażek i kontuzje. Testy zdolności
   bramkują poziomy; szum RPE może wymusić persystowanie pozycji programu
   (zamiast wyprowadzania z wpisów).
3. **Dryf w motywację kontrolowaną** — presja passy/winy podkopuje autonomiczną
   motywację (Teixeira 2012). Copy autonomiczne, cele wybierane przez użytkownika,
   celebrowanie wygranych wewnętrznych (energia, nastrój).
4. **Treść wrażliwa na bezpieczeństwo** — bezpieczna drabinka 0→100 pompek
   z deloadami w PL+EN może zdominować wycenę (to nie jest katalog wyzwań CBT).

## Decyzje (2026-07-14)

- Architektura: **fork — appka siostrzana** (opcja c)
- Timing: **start od razu, równolegle z dogfoodingiem Unstuck** (osobne repo,
  Unstuck nietknięty)

## Uczciwe luki researchu

Grease the Groove bez RCT (dowody praktyczne); dane o churnie appek fitness =
źródła branżowe, nie recenzowane; timing formowania nawyku ćwiczeń u Lally 2010 =
inferencja z różnic między typami zachowań; szczegóły programów (hundredpushups /
C25K / YWA) z dokumentacji programów.
