# Unstuck — Design Direction

> Zaakceptowany kierunek (Faza 2). Wzorce: `docs/design-samples/` (5 screenshotów).
> Decyzja użytkownika: jasny, bardzo przyjazny, NIE ciemny i techniczny. Paleta: kremowo-pomarańczowa (wzorzec „zenlife").

## Nastrój

Ciepły, optymistyczny, bez presji. Aplikacja ma być „życzliwym towarzyszem", nie narzędziem
produktywności. Spójne z regułą product-principles #3 (self-compassion over pressure).

## Paleta (design tokens — do doprecyzowania w implementacji)

| Token | Wartość wyjściowa | Rola |
|---|---|---|
| `--bg` | `#FDF6EC` (kremowy) | Tło główne |
| `--surface` | `#FFFDF9` | Karty |
| `--primary` | `#F5A623` → `#F08A3C` (ciepły pomarańcz) | Akcje, akcenty, CTA |
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
- **Progres:** miękkie ringi/paski, ciepła zieleń; kalendarz ukończeń w stylu łagodnych kropek

## Zasady layoutu

- Mobile-first (viewport bazowy ~390px), skaluje się do desktopu przez wycentrowaną kolumnę
- Jeden główny element na ekran (reguła „one challenge per day")
- Duży oddech: min. 16px gap między kartami, 24px padding ekranu
- Pełna pętla dzienna bez scrollowania tam, gdzie to możliwe

## Ton komunikatów (copy)

- Ciepły, po imieniu, bez rozkazów („Może spróbujesz…", nie „Musisz…")
- Po pominiętym dniu: zero winy, normalizacja („Zdarza się każdemu. Dziś jest nowy dzień.")
- Po ukończeniu: konkretna, krótka celebracja małego kroku (progress principle, Amabile)
