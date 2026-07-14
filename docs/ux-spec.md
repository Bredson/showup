# Unstuck — Specyfikacja ekranów MVP (UX)

> Faza 2. Fundament: PRD §4–5, design-direction.md, product-principles.md (wiążące), metoda TITD.
> Zasady przekrojowe: **jeden główny CTA na ekran**, pętla dzienna < 5 min, zero mechanik winy,
> mobile-first (~390px), i18n PL/EN, wszystkie dane lokalnie.
> Status dylematów: **rozstrzygnięcia na końcu dokumentu**.

## Mapa nawigacji

```
[Pierwsze uruchomienie] → Onboarding (język → quiz → gotowe)
[Kolejne uruchomienia]  → Dziś (home)

Dolny pasek (max 4 pozycje, pigułka na aktywnej):
  ☀ Dziś   |   ◔ Progres   |   ✎ Dziennik   |   ⚙ Ustawienia

Pętla dzienna to modalna sekwencja NAD zakładką "Dziś" (fullscreen kroki) —
pasek nawigacji ukryty w trakcie pętli.
```

---

## 1. Onboarding (quiz startowy)

**Cel:** lokalny profil (wyzwalacze, pory dnia, typ unikanych zadań) + język. Ton: „to będzie łagodne", nie „to będzie test".

**Struktura:** ekran powitalny + 5 pytań + ekran zamykający. Każde pytanie = osobny ekran, kropki progresu u góry.

### 1.0 Ekran powitalny
- Ilustracja line-art (styl zenlife)
- Nagłówek: „Cześć! Tu Unstuck."
- Tekst: „Prokrastynacja to nie lenistwo — to emocje. Jedno małe wyzwanie dziennie, bez presji."
- Przełącznik języka PL/EN (tu, bo wszystko dalej zależy od języka)
- **CTA:** „Zacznijmy"

### 1.1–1.5 Pytania quizu
Wzorzec: kropki progresu → pytanie (ciepłe, 2. osoba) → duże karty-przyciski → CTA „Dalej" → link „Wróć".

1. **„Co najczęściej sprawia, że odkładasz?"** *(multi, max 2)* — Strach, że nie wyjdzie / Nuda / Za dużo naraz / „Nie chce mi się" / Nie wiem, od czego zacząć *(mapuje na 5 emocji check-inu)*
2. **„Kiedy najczęściej prokrastynujesz?"** *(single)* — Rano / W środku dnia / Wieczorem / Różnie
3. **„Jakich zadań unikasz najbardziej?"** *(single)* — Praca/nauka / Urzędy i maile / Dom / Zdrowie i ruch / Kontakty z ludźmi
4. **„Co się dzieje, gdy odłożysz coś ważnego?"** *(single)* — Wyrzuty sumienia / Odkładam kolejne / Ostatnia chwila / Czasem wcale *(kalibruje ton self-compassion, Wohl 2010)*
5. **„Ile czasu realnie masz dziennie?"** *(single)* — 2 min / 5 min / 10+ min *(poziom startowy)*

Każde pytanie ma opcję „Trudno powiedzieć" — nigdy nie blokujemy.

### 1.6 Ekran zamykający
- Ilustracja + „Gotowe. Twoja ścieżka czeka."
- Karta podsumowania odzwierciedlająca odpowiedzi (quiz miał sens)
- **CTA:** „Pokaż pierwsze wyzwanie"

**Stany brzegowe:** przerwanie quizu → wznowienie od miejsca przerwania (zapis po każdym pytaniu); ponowny quiz z Ustawień nadpisuje profil, zachowuje progres.

### Ustalenia techniczne (wiążące, Faza 4 / Feature 8)

- **ID pytań:** `triggers`, `timeOfDay`, `taskType`, `aftermath`, `dailyTime`. **ID opcji** po angielsku, stałe na zawsze (surowe odpowiedzi w `QuizResult.answers` mają być przeliczalne po zmianie quizu).
- **Mapowanie pyt. 1 → emocje check-inu:** `fear→anxiety`, `boredom→boredom`, `too-much→overwhelm`, `no-energy→aversion`, `dont-know-where→confusion`. `dominantTriggers` = zmapowane odpowiedzi z pyt. 1 (0–2 emocji; „Trudno powiedzieć" → pusta lista).
- **„Trudno powiedzieć"** = opcja `unsure` w każdym pytaniu; w pyt. 1 wyklucza się z innymi wyborami.
- **Poziom startowy (Dylemat 5 = NIE):** pyt. 5 nie zmienia poziomu — zapis wyłącznie w `answers.dailyTime`.
- **Draft quizu** (wznowienie po przerwaniu) trzymany przez StorageAdapter w store `meta` (rekord `quizDraft`), czyszczony po ukończeniu quizu.
- Onboarding pokazywany, gdy `getProfile()` zwraca `null`; wybór języka na ekranie powitalnym działa natychmiast (całego quizu dotyczy).

---

## 2. Ekran główny „Dziś"

**Cel:** dokładnie jedno wyzwanie i zaproszenie do pętli.

| Element | Opis |
|---|---|
| Powitanie | Zależne od pory dnia; bez daty-kalendarza (to nie planner) |
| Mikro-status streaka | 1 linia tekstu, tylko gdy streak ≥ 2 („3 dni w rytmie"); nie widget |
| **Karta wyzwania** (bohater) | Plakietka poziomu, tytuł, 1 zdanie zajawki. Bez pełnej treści |
| **CTA** | „Zacznij (≈3 min)" — pill, pełna szerokość; estymata obniża próg wejścia (Fogg) |
| Dolny pasek | Dziś / Progres / Dziennik / Ustawienia |

**Interakcje:** tap CTA lub karta → pętla. Brak listy wyzwań, brak podglądu jutra.

**Stany brzegowe:**
- Pierwszy raz: „Twoje pierwsze wyzwanie 🌱"
- Ukończone dziś: karta „zrobione" (zieleń, ✓, „Do zobaczenia jutra"), CTA znika; link „Zobacz swój wpis" → Dziennik
- Pętla przerwana: CTA „Dokończ (zostało ~2 min)"
- Powrót po przerwie ≥ 2 dni: najpierw interstitial self-compassion (§7)

---

## 3. Pętla dzienna (6 kroków)

Wspólne: fullscreen, nawigacja ukryta, wskaźnik 6 kropek + „×" (wyjście z zachowaniem stanu). Cel: < 5 min, typowo ~3.

### 3.1 Check emocji — **OBOWIĄZKOWY (decyzja: Dylemat 1 = wariant A)**
- Pytanie: „Co czujesz, myśląc o dzisiejszym wyzwaniu?"
- 5 kart: 😰 Lęk / 😑 Nuda / 🌊 Przytłoczenie / 😤 Niechęć / 🌫 Niejasność
- Tap = akcja (bez osobnego CTA); mikro-walidacja 1 zdanie → auto-advance
- Bez opcji „pomiń" — wentyl bezpieczeństwa to „×" całej pętli
- Pierwszy raz: dopisek „Nazwanie emocji to połowa roboty"

### 3.2 Treść wyzwania
- Plakietka poziomu + tytuł; mini-lekcja (max 3–4 zdania, jedna myśl CBT)
- Blok „Twoje zadanie" (surface-alt): 1–2 zdania konkretnej akcji
- Opcjonalny 1-zdaniowy dopisek adaptowany do emocji z 3.1
- **CTA:** „Dalej"

### 3.3 IF-THEN (opcjonalne w wypełnieniu, stałe w obecności)
- „Kiedy i gdzie to zrobisz?" + 1 zdanie: „Jedno zdanie podnosi szansę wykonania ~2×. Ale to opcja."
- Szablon: „Kiedy **[sytuacja]**, zrobię **[akcja]**." + 3 chipy podpowiedzi dla [sytuacji]
- **CTA:** „Zapisz i dalej"; link muted „Pomiń ten krok" (bez dark-patternu winy)
- Po 3× pominięciu z rzędu: znika tekst edukacyjny (krok zostaje)

### 3.4 Wykonanie (zasada 2 minut)
- „Teraz tylko pierwsze 2 minuty." + „Nie musisz kończyć. Zacznij — i możesz przestać po 2 minutach."
- Opcjonalny timer 2:00 (miękki ring, nie alarm); timer to pomoc, nie bramka
- Przypomnienie IF-THEN jeśli wypełnione
- **CTA:** „Zrobione ✓"; link „Wrócę później" (stan zachowany)
- Po upływie timera: „2 minuty za tobą. Chcesz jeszcze chwilę, czy klikasz Zrobione?" Zero auto-fail

### 3.5 Refleksja — **OBOWIĄZKOWA Z CHIPAMI (decyzja: Dylemat 2 = wariant A)**
- 1 pytanie dobrane do wyzwania/emocji; pole tekstowe „Wystarczy jedno zdanie…"
- 3 chipy szybkiej odpowiedzi 1-tap („Start był najtrudniejszy" / „Poszło lepiej niż myślałem" / „Nadal było ciężko")
- Nie da się zamknąć pętli bez odpowiedzi, ale chip = jedno tapnięcie
- **CTA:** „Zapisz"

### 3.6 Wzmocnienie
- Krótka ciepła animacja (~1,5 s; nie konfetti-fajerwerki)
- Komunikat konkretny: „Zrobił_ś dziś krok mimo [emocja]. Tak buduje się zmianę."
- Mały pasek progresu: „Dzień 4 · Poziom 1: ●●●○○"
- **CTA:** „Do jutra 👋"; link „Zobacz progres"
- Warianty: odblokowanie poziomu / pierwszy dzień w ogóle

---

## 4. Ekran „Progres"

**Cel:** „patrz, co już masz", nie „czego ci brakuje".

- Nagłówek „Twoja droga"
- **Karta streaka:** duża liczba + „dni w rytmie" (nie „z rzędu"), miękki ring
- Karta kalendarza: kropki (zieleń = ukończony, kremowa = brak, **bez czerwieni i X**);
  **dzień wybaczony = jawny marker** (pusta zielona obwódka + tooltip „dzień odpoczynku — passa trwa")
  — **decyzja: Dylemat 3 = wariant A**
- Karta poziomu: „Poziom 2 · 4 z 7 na tym poziomie" (awans po 7 ukończeniach — data-model §4)
- CTA kontekstowy „Wróć do dzisiejszego wyzwania" (tylko gdy nieukończone)
- Tap w kropkę ukończoną → bottom-sheet z podglądem; tap w pustą → nic
- **Bez** historycznego rekordu streaka (porównanie z rekordem = ukryta mechanika winy)
- Po długiej przerwie: „Wracasz — to się liczy najbardziej."

---

## 5. Ekran „Dziennik"

- **Zakres (decyzja: Dylemat 4 = wariant A):** widoczny jest każdy wpis z zapisaną emocją —
  także dni rozpoczęte i niedokończone (check emocji jest obowiązkowy, więc taki dzień ma emocję, ale nie refleksję).
  Dziennik NIE ocenia wykonania (od tego jest Progres): bez etykiet „niedokończone", bez markerów statusu.
- Lista odwrotnie chronologiczna: data relatywna („dziś" / „wczoraj", starsze — pełna data), ikona emocji, tytuł wyzwania, 2 linie refleksji
- Tap → rozwinięcie/bottom-sheet z pełnym wpisem (emocja + IF-THEN + refleksja)
- Bez edycji/usuwania pojedynczych wpisów, bez wyszukiwarki, bez przycisku „nowy wpis" (scope creep)
- Pusty stan: ilustracja + „Tu pojawią się twoje refleksje po pierwszym wyzwaniu."
- Wpis bez refleksji: „—" (nie „brak refleksji")

---

## 6. Ekran „Ustawienia"

- **Język:** segmentowany PL/EN, zmiana natychmiastowa
- **Moja ścieżka:** „Dostosuj moją ścieżkę" → ponowny quiz (zachowuje progres)
- **Twoje dane:** „Eksportuj dane" (JSON); „Usuń wszystkie dane" (dwustopniowe potwierdzenie, bez alarmowej czerwieni)
- Notka prywatności: „Wszystko zostaje na tym urządzeniu. Zero kont, zero chmury, zero śledzenia."
- **O aplikacji:** wersja + krótka strona „Jak działa Unstuck"

**Ustalenia techniczne (Feature 9):**

- Zmiana języka zapisuje `profile.language` natychmiast (fire-and-forget) i przełącza cały UI bez restartu.
- Ponowny quiz (dylemat 6): OnboardingScreen w trybie `retake` — start od pytania 1, świeże odpowiedzi (bez prefillu — stare zostają w profilu do momentu ukończenia), „Wróć" na pytaniu 1 = anuluj; ukończenie nadpisuje `quiz` i zachowuje `startDate`/`createdAt` (progres nietknięty — wpisy bez zmian). Draft ponownego quizu NIE jest persystowany (przerwanie = anulowanie).
- Eksport: `ExportBlob` z data-model §5 (`app:'unstuck'`, `schemaVersion`, `exportedAt`, `profile`, `entries`), plik `unstuck-export-YYYY-MM-DD.json` przez Blob + `<a download>`. Bez importu w MVP (§6 go nie wymienia).
- Usunięcie danych (dylemat 7): krok 1 „Usuń wszystkie dane" → inline potwierdzenie (opis konsekwencji + „Usuń na zawsze" / „Zostaw"); po `clearAll()` powrót do onboardingu.
- Wersja z `package.json` wstrzykiwana w build (Vite `define`), nie hardkodowana.

---

## 7. Stan „dzień pominięty" (self-compassion)

Pełnoekranowy interstitial przy pierwszym otwarciu po przerwie, PRZED ekranem Dziś (raz na powrót).

- Ilustracja ciepła, spokojna (dominanta)
- „Hej, dobrze, że jesteś."
- Przerwa 1 dzień: „Wczoraj się nie złożyło — zdarza się każdemu. Twoja passa jest bezpieczna. Dziś jest nowy dzień." — **tylko gdy passa faktycznie trwa** (dylemat 9); inaczej wariant 2+ dni
- Przerwa 2+ dni: „Trochę cię nie było — i to jest OK. Badania są jasne: wybaczenie sobie działa lepiej niż wyrzuty." (**bez liczby opuszczonych dni** — liczba = wyrzut)
- **CTA:** „Pokaż dzisiejsze wyzwanie". Bez linku drugorzędnego — jedna droga: naprzód
- Przerwa 30+ dni: dodatkowo wyzwanie o poziom łagodniejsze („miękki restart")

**Ustalenia techniczne (Feature 10):**

- „Przerwa" = liczba dni pominiętych, czyli dni bez ŻADNEGO wpisu między ostatnim wpisem a dziś
  (`daysBetween(ostatniWpis, dziś) - 1`). Wpis dnia powstaje przy każdym otwarciu appki, więc
  „otwarcie bez ukończenia" nie liczy się jako przerwa. To spina §2 („powrót po przerwie ≥ 2 dni"
  między otwarciami) z wariantami §7 (1 dzień pominięty / 2+ pominięte).
- „Raz na powrót" jest WYLICZANE, nie persystowane: interstitial pokazuje się tylko, gdy wpis
  dzisiejszy właśnie powstał (pierwsze otwarcie dnia) i liczba dni pominiętych ≥ 1. Ponowne
  otwarcie tego samego dnia → wpis już istnieje → brak interstitialu; kolejny dzień → przerwa 0.
- Miękki restart (30+ dni pominiętych): poziom wyzwania obniżony o 1 (minimum 1) w momencie
  przydziału w `getTodaysChallenge` — przydział jest trwały, więc restart appki go nie zmienia.
  Obniżka dotyczy tylko dnia powrotu; progres poziomów (completedByLevel) liczony bez zmian.
- Brak historii wpisów (świeży profil) → brak interstitialu (nie ma „powrotu").
- Wariant „1 dzień" wymaga dodatkowo żywej passy (`computeStreak > 0`): po „otwarciu bez
  ukończenia" + 1 dniu przerwy passa jest już wyzerowana, a komunikat „Twoja passa jest
  bezpieczna" nie może kłamać (dylemat 9). Wariant 2+ dni jest prawdziwy zawsze.

---

## Checklist zgodności z product-principles

| Zasada | Realizacja |
|---|---|
| One challenge per day | Dziś = 1 karta; po ukończeniu brak „następnego" |
| Not a todo-list | Brak plannera, własnych zadań, przycisku „nowy wpis" |
| Self-compassion | Interstitial, brak czerwieni, brak liczby dni, brak rekordu, kalendarz bez X |
| Pętla < 5 min | 3.1 = 1 tap, 3.3 pomijalny, 3.5 chipy 1-tap |
| Privacy first | Notka, eksport JSON, zero analityki |
| i18n | Przełącznik 1.0 + Ustawienia; treści dwujęzyczne |
| Jeden CTA na ekran | Maks. jeden primary na ekran (Ustawienia celowo nie mają żadnego — brak „tej jednej akcji") |

---

## Rozstrzygnięcia dylematów (decyzje użytkownika, Faza 2)

| # | Dylemat | Decyzja użytkownika |
|---|---|---|
| 1 | Check emocji pomijalny? | **Obowiązkowy, bez „pomiń"** — 1 tap, auto-advance; wentyl = „×" całej pętli |
| 2 | Refleksja obowiązkowa? | **Obowiązkowa z chipami 1-tap** — chip = pełnoprawna odpowiedź |
| 3 | Marker dnia wybaczonego? | **Jawny ciepły marker** — pusta zielona obwódka + „dzień odpoczynku — passa trwa" |
| 4 | Zakres Dziennika | **Wariant A** — każdy wpis z zapisaną emocją, także dni niedokończone; bez oceniania wykonania |
| 5 | Poziom startowy z quizu (pyt. 5)? | **Nie** — wszyscy startują z poziomu 1 (progresja tylko z ukończeń, data-model §4); odpowiedź zapisana w surowych danych na przyszłość |
| 6 | Przebieg ponownego quizu („Dostosuj moją ścieżkę") | **Od pytania 1, z anulowaniem** — bez powitania (język zmienia się w Ustawieniach); „Wróć" na pytaniu 1 wraca do Ustawień bez zapisu; podsumowanie zostaje; profil nadpisany dopiero na końcowym CTA |
| 7 | Co po „Usuń wszystkie dane"? | **Powrót do onboardingu** — jak świeża instalacja, bez dodatkowego ekranu pożegnalnego |
| 8 | „Jak działa Unstuck" | **Rozwijana sekcja w Ustawieniach** — tap rozwija treść na miejscu, bez pod-ekranu |
| 9 | Komunikat „passa bezpieczna" przy martwej passie? | **Sprawdzać passę przed komunikatem** — wariant „1 dzień" tylko gdy `computeStreak > 0`; inaczej zawsze prawdziwy wariant 2+ dni (aplikacja nigdy nie kłamie) |
