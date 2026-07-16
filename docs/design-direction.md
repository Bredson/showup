# Showup — Design Direction

> Zaakceptowany kierunek (Faza 2 Unstuck, odziedziczony). Wzorce: `docs/design-samples/` (5 screenshotów).
> Decyzja użytkownika: jasny, bardzo przyjazny, NIE ciemny i techniczny.
> Rewizja tożsamości po MVP (2026-07-16): paleta akcentów zmieniona na kremowo-turkusową —
> turkus jest silniej kojarzony ze sportem/fitnessem i odróżnia Showup od pomarańczowego Unstuck.
> Rewizja 2 (2026-07-16, ta sama doba): decyzją użytkownika CAŁE wnętrze apki przechodzi na
> turkus — wariant „T1 Mgiełka" (miętowe tło, czysto białe karty) wybrany z 3 mockupów natężeń.
> Kremowa pozostaje IKONA (`public/icon.svg`) — łącznik z rodziną Unstuck obok bursztynowej kropki.

## Nastrój

Ciepły, optymistyczny, bez presji. Aplikacja ma być „życzliwym towarzyszem", nie narzędziem
produktywności. Spójne z regułą product-principles #3 (self-compassion over pressure).

## Paleta (design tokens — do doprecyzowania w implementacji)

| Token | Wartość wyjściowa | Rola |
|---|---|---|
| `--bg` | `#EAF6F3` (jasna mięta) | Tło główne |
| `--surface` | `#FFFFFF` | Karty |
| `--primary` | `#0D8478` (turkus; 4.58:1 z białym tekstem) | Akcje, akcenty, CTA |
| `--primary-soft` | `#2BB3A3` (jaśniejszy turkus) | Dekoracje, focus, kropka „dziś otwarte" |
| `--text` | `#1E3733` (ciemny turkusowy grafit) | Tekst główny |
| `--text-muted` | `#4E6C67` (4.73:1 na `--surface-alt`) | Tekst drugorzędny |
| `--success` | `#5F9D4A` (zieleń; tylko glify/wypełnienia, nigdy tekst; SC 1.4.11: 3.28:1; wyjątek: wypełnienie level-bar vs tor 2.71:1 — pasek aria-hidden, dubluje sąsiedni tekst) | Ukończenia, progres |
| `--surface-alt` | `#D8EEEA` | Wyróżnione sekcje |

Zakaz: czerwieni alarmowych i „karzących" (reguła self-compassion). Błędy/pominięcia
komunikujemy ciepłym neutralnym tonem, nie kolorem ostrzegawczym.

## Komponenty (z wzorców)

- **Karty:** duże zaokrąglenia (radius ~24px), miękkie cienie, dużo paddingu
- **Przyciski:** pill-shape, pełny kolor primary dla głównego CTA (jeden na ekran)
- **Typografia:** zaokrąglony sans-serif (np. Nunito / Quicksand); duże nagłówki, krótkie teksty
- **Ilustracje:** przyjazne postaci w stylu line-art z akcentem koloru (jak zenlife); używane
  na ekranach onboardingu, pustych stanach i komunikatach self-compassion
- **Nawigacja:** dolny pasek, max 4 pozycje, aktywna pozycja wyróżniona pigułką
- **Progres:** miękkie ringi/paski (ring w kolorze primary, wypełnienia ukończeń w miękkiej
  zieleni `--success`); kalendarz ukończeń w stylu łagodnych kropek
- **Ikona aplikacji:** `public/icon.svg` — schodki (turkusowa rampa `#6FD0C5` → `#2BB3A3`
  → `#0D8478`) + bursztynowa kropka obecności ze śladem skoków; bursztyn `#F5A623` to
  łącznik z ciepłą paletą Unstuck. Po zmianie: `npm run generate-pwa-assets`

## Zasady layoutu

- Mobile-first (viewport bazowy ~390px), skaluje się do desktopu przez wycentrowaną kolumnę
- Jeden główny element na ekran (reguła „one challenge per day")
- Duży oddech: min. 16px gap między kartami, 24px padding ekranu
- Pełna pętla dzienna bez scrollowania tam, gdzie to możliwe

## Ton komunikatów (copy)

- Ciepły, po imieniu, bez rozkazów („Może spróbujesz…", nie „Musisz…")
- Po pominiętym dniu: zero winy, normalizacja („Zdarza się każdemu. Dziś jest nowy dzień.")
- Po ukończeniu: konkretna, krótka celebracja małego kroku (progress principle, Amabile)
