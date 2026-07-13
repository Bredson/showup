# Unstuck — Architektura (ADR)

> Faza 3. Decyzje użytkownika: React + TypeScript + Vite; czysty CSS z design tokens.

## Stack

| Warstwa | Wybór | Uzasadnienie |
|---|---|---|
| Framework | React 18 + TypeScript | Największy ekosystem, najlepsze wsparcie Capacitora; typy z data-model.md wprost do kodu |
| Build | Vite | Standard, szybki, oficjalne wsparcie vite-plugin-pwa |
| PWA | vite-plugin-pwa | Service worker + manifest + offline z jednej konfiguracji |
| Storage | IndexedDB przez `idb` (~1 KB) | Decyzja z data-model.md §2 |
| Styl | Czysty CSS + custom properties | Tokeny z design-direction.md 1:1; czytelność dla projektu szkoleniowego |
| i18n | Własny lekki moduł (bez biblioteki) | 2 języki, płaskie klucze — biblioteka to overkill; ~40 linii kodu |
| Stan | React state + context | Appka ma 1 użytkownika i prostą pętlę — bez Redux/Zustand |
| Testy | Vitest + Testing Library | Natywne dla Vite; testy domeny (streak, dobór wyzwań) to czyste funkcje |

## Struktura katalogów (separacja wymagana przez PRD §7 — Capacitor-ready)

```
src/
  domain/      # czysta logika, ZERO importów z React i storage
    types.ts       # typy z data-model.md
    streak.ts      # computeStreak, computeProgress
    challenge.ts   # getTodaysChallenge (przyjmuje adapter jako argument)
  storage/     # StorageAdapter + IndexedDbAdapter (jedyne miejsce dotykające idb)
  content/     # challenges.json (statyczne, bundlowane)
  i18n/        # słowniki pl.ts / en.ts + hook useT()
  ui/          # komponenty i ekrany (jedyne miejsce z JSX)
    screens/       # Today, Loop (6 kroków), Progress, Journal, Settings, Onboarding, Compassion
    components/    # Card, PillButton, EmotionPicker, DotsCalendar...
  App.tsx      # routing (prosty state-based lub react-router)
  tokens.css   # design tokens z design-direction.md
```

## Zasady (wiążące)

1. **`domain/` nie importuje niczego z React ani storage** — czyste funkcje, w pełni testowalne.
2. Wszystkie stringi UI przez `i18n/` — hardcode = bug (product-principles §6).
3. Kolory wyłącznie przez tokeny CSS — żadnych hex w komponentach.
4. Jeden ekran = jeden plik w `ui/screens/`.

## Repozytorium

- Git od Fazy 3; `.gitignore` obejmuje `node_modules`, `dist`, `CLAUDE.local.md`,
  `.claude/settings.local.json`.
- Commity per feature (Faza 4), format: krótki opis po angielsku.
