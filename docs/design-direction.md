# Showup — Design Direction

> Zaakceptowany kierunek (Faza 2 Unstuck, odziedziczony). Wzorce: `docs/design-samples/` (5 screenshotów).
> Decyzja użytkownika: jasny, bardzo przyjazny, NIE ciemny i techniczny.
> Rewizja tożsamości po MVP (2026-07-16): paleta akcentów zmieniona na kremowo-turkusową —
> turkus jest silniej kojarzony ze sportem/fitnessem i odróżnia Showup od pomarańczowego Unstuck.
> Kremowe tło i ciepły ton pozostają sygnaturą rodziny produktów.

## Nastrój

Ciepły, optymistyczny, bez presji. Aplikacja ma być „życzliwym towarzyszem", nie narzędziem
produktywności. Spójne z regułą product-principles #3 (self-compassion over pressure).

## Paleta (design tokens — do doprecyzowania w implementacji)

| Token | Wartość wyjściowa | Rola |
|---|---|---|
| `--bg` | `#FDF6EC` (kremowy) | Tło główne |
| `--surface` | `#FFFDF9` | Karty |
| `--primary` | `#0D8478` (turkus; AA 4.5:1 z tekstem `--surface`) | Akcje, akcenty, CTA |
| `--primary-soft` | `#2BB3A3` (jaśniejszy turkus) | Dekoracje, focus, kropka „dziś otwarte" |
| `--text` | `#3D3428` (ciepła ciemna czerń) | Tekst główny |
| `--text-muted` | `#8C7F6D` | Tekst drugorzędny |
| `--success` | `#7BB662` (miękka zieleń) | Ukończenia, progres |
| `--surface-alt` | `#FBEED9` | Wyróżnione sekcje |

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
