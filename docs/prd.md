# PRD — Unstuck (aplikacja anty-prokrastynacyjna)

> Dokument roboczy (PL). Fundament merytoryczny: [`titd-method.en.md`](./titd-method.en.md) / [`titd-method.pl.md`](./titd-method.pl.md)
> Status: **zaakceptowany** (Faza 1, decyzje użytkownika: nazwa „Unstuck", zakres MVP bez zmian)

## 1. Wizja

Aplikacja pomagająca skutecznie walczyć z prokrastynacją przez **stopniowe budowanie dobrych
nawyków** — jedno krótkie wyzwanie dziennie. Filozofia jak TodayIsTheDay: CBT +
micro-self-management, bez presji, z naciskiem na konsekwencję i samowspółczucie.
Efekt długoterminowy: realna zmiana komfortu życia użytkownika.

**Zasada nadrzędna:** prokrastynacja to problem regulacji emocji, nie zarządzania czasem
(Sirois & Pychyl 2013). Każda funkcja musi to respektować.

## 2. Decyzje produktowe (Faza 0 — zaakceptowane)

| Decyzja | Wybór | Konsekwencja |
|---|---|---|
| Platforma | PWA (webowa) | Działa w przeglądarce i na telefonie, bez sklepów |
| Dane | Lokalnie w przeglądarce | Zero backendu i logowania; pełna prywatność danych o emocjach; brak sync między urządzeniami (świadomie) |
| Odbiorca | Najpierw autor (personal tool) | Szybka pętla feedbacku; brak onboardingu wielu użytkowników |
| Język UI | Dwujęzyczny PL/EN od startu | Architektura i18n od pierwszego commita; treści wyzwań w obu językach |

## 3. Mapowanie metody na funkcje

| Zasada metody (titd-method) | Funkcja w aplikacji | MVP? |
|---|---|---|
| Personalizacja na starcie | Krótki quiz startowy (wyzwalacze, wzorce) → dobór ścieżki | ✅ (uproszczony) |
| Jedno wyzwanie dziennie | Ekran główny = dzisiejsze wyzwanie, nic więcej | ✅ |
| Progresywna trudność | Wyzwania w poziomach; kolejne odblokowywane progresem | ✅ |
| Małe kroki | Treść wyzwań uczy dzielenia zadań | ✅ (przez treści) |
| Zasada 2 minut | Stały element pętli dziennej („zrób pierwszy 2-min krok teraz") | ✅ |
| Cele SMART | Formularz celu prowadzony pytaniami | ⬜ po MVP |
| Priorytetyzacja / planner | Dzienny planner zadań | ❌ świadomie poza zakresem (komplikuje; appka ≠ todo-lista) |
| Pozytywne wzmocnienie | Komunikat po ukończeniu + wizualny progres | ✅ |
| Journaling / refleksja | 1 pytanie refleksyjne po wyzwaniu, zapis lokalny | ✅ |
| Progress tracker | Streak + kalendarz ukończeń | ✅ |
| Społeczność / accountability | Forum | ❌ poza zakresem (personal tool, brak backendu) |
| **Ulepszenie 1: IF-THEN** | Pole „Kiedy [sytuacja], zrobię [akcja]" przy wyzwaniu | ✅ |
| **Ulepszenie 2: check emocji** | 1 pytanie przed startem: „Co czujesz wobec tego zadania?" (5 emocji do wyboru) | ✅ |
| **Ulepszenie 3: self-compassion po wpadce** | Po opuszczonym dniu: komunikat bez oceniania, streak „wybaczający" (1 dzień przerwy nie zeruje) | ✅ |

## 4. Pętla dzienna (serce produktu — szczegóły w Fazie 2)

```
Otwarcie appki
  → check emocji (1 dotknięcie)
  → dzisiejsze wyzwanie (krótka lekcja + zadanie)
  → zdanie IF-THEN (opcjonalne, 1 pole)
  → wykonanie (z podpowiedzią zasady 2 minut)
  → refleksja (1 pytanie)
  → wzmocnienie + progres
[dzień opuszczony] → komunikat self-compassion, bez kary
```

## 5. Zakres MVP

**W MVP:**
1. Quiz startowy (uproszczony, ~5 pytań) → profil lokalny
2. Pętla dzienna (pkt 4) — kompletna
3. Baza wyzwań: min. 30 wyzwań w 3 poziomach trudności, PL+EN
4. Progress: streak wybaczający + kalendarz
5. Journaling: zapis emocji i refleksji, prosty podgląd historii
6. i18n PL/EN, przełącznik języka
7. PWA: instalowalna, działa offline

**Poza MVP (świadomie):**
- konta, backend, synchronizacja
- powiadomienia push (rozważymy po MVP — w PWA ograniczone na iOS)
- cele SMART, planner, statystyki zaawansowane
- społeczność, AI-personalizacja, temptation bundling, environmental design

## 6. Kryteria sukcesu MVP

- Autor używa appki codziennie przez 14 dni (dogfooding)
- Pełna pętla dzienna zajmuje < 5 minut
- Appka działa offline i po ponownym otwarciu pamięta stan
- Zero danych opuszczających urządzenie

## 7. Ścieżka rozwoju: sklepy z aplikacjami

Decyzja użytkownika: appka ma mieć w przyszłości możliwość publikacji w sklepach.

- **Google Play:** TWA (Trusted Web Activity) — oficjalna ścieżka publikacji PWA, prawie zero zmian w kodzie
- **App Store:** wrapper Capacitor — natywna powłoka iOS wokół appki webowej

**Konsekwencje architektoniczne (wiążące od Fazy 3):**
- Stack w pełni kompatybilny z Capacitorem (dowolny nowoczesny framework webowy)
- Czysta separacja logiki domenowej od UI i od warstwy storage
- Brak zależności od API dostępnych wyłącznie w przeglądarce desktopowej

## 8. Design UI/UX

Wzorce dostarczone przez użytkownika: `docs/design-samples/`. Kierunek zaakceptowany:
**jasny, ciepły, bardzo przyjazny — NIE ciemny i techniczny**. Paleta kremowo-pomarańczowa
(wzorzec „zenlife"), przyjazne ilustracje, duże zaokrąglone karty.
Szczegóły: [`design-direction.md`](./design-direction.md).

## 9. Wymagania niefunkcjonalne

- **Prywatność:** 100% danych w localStorage/IndexedDB; brak analityki zewnętrznej w MVP
- **Prostota:** ekran główny = jedno wyzwanie; każdy dodatkowy element wymaga uzasadnienia
- **Dostępność:** czytelne na telefonie (mobile-first), jasny ciepły motyw (patrz design-direction.md)
- **Języki:** wszystkie teksty przez system i18n, nigdy hardcode
