# Research: system progresji do 100 pompek (Showup v1)

> Web research (2026-07-14) porównujący systemy dojścia od niskiej bazy (5–15 pompek)
> do 100 z rzędu, pod kątem skuteczności, szans wytrwania i dopasowania do mechanik
> Showup (passa = obecność, progresja bramkowana testem, deloady, samowspółczucie).
> Kontekst metodyczny: `fitness-research.md` (odziedziczony z Unstuck).

## Porównanie kandydatów

| System | Struktura | Czas/tydz. | Ryzyko kontuzji | Realny czas od 10 pompek | Fit z Showup |
|---|---|---|---|---|---|
| **hundredpushups.com** (Speirs) | 3x/tydz., 5–8 serii wg tabel, bramkowanie max testem, „powtórz tydzień" | 15–30 min | umiarkowane (AMRAP do blisko upadku 3x/tydz.) | 10–20 tyg. (marketing „6 tyg." nierealny) | **4/5** — już test-gated, już z dniami odpoczynku |
| **Grease the Groove** (Tsatsouline) | częste submaksymalne serie 40–60% maxa dziennie, nigdy do upadku | 10–20 min (rozproszone) | najniższe | szybko do 30–40, potem plateau; samo w sobie 6–12+ mies. | 3/5 — idealne jako 2-min floor, słabe jako jedyny silnik (brak mety i testów) |
| **r/bodyweightfitness RR** | 3x/tydz. full-body; progresja WARIANTAMI (ściana→skos→kolana→pełne) przy 3×8 | 3×40–60 min | nisko-umiarkowane | zły cel: optymalizuje trudność, nie 100 powtórzeń | 2/5 jako system, **5/5 jako on-ramp** dla bazy <10 |
| **Liniowe drabinki/piramidy** („+1 dziennie") | codzienny przyrost, bez zarządzania zmęczeniem | 5–20 min/dzień | umiarkowanie-wysokie | teoria 90 dni; praktyka: załamanie przy 30–50 | **1/5** — progresja po dniach (u nas zakazana), zero odpoczynku |
| **Hybrydy trenerskie** (Trainerize 20 tyg. itp.) | 3 twarde sesje + łatwa objętość GtG + testy + regresje wariantów + lżejsze tygodnie | 30–60 min | nisko-umiarkowane | 12–24 tyg. | **5/5** — to niemal opis naszych wymagań |

## Rekomendacja: hybryda „Speirs-core"

Szkielet Speirsa (3x/tydz., tabele serii, bramkowanie max testem, „powtórz tydzień bez
wstydu" — to zdanie jest w oryginale) + trzy poprawki naprawiające jego znane słabości:

1. **Drabinka wariantów BWF pod spodem** (ściana → wysoki skos → niski skos → kolana →
   pełne) — wejście wg wyniku testu, więc silnik obsługuje też bazę 0–5 pompek.
2. **Dni łatwe w stylu GtG jako klej passy**: w dni nietreningowe 2-min minimum =
   jedna perfekcyjna seria 40–50% maxa (nigdy do upadku) LUB sama rozgrzewka
   nadgarstków/barków. GtG przestaje być konkurencyjnym systemem, staje się treścią
   codziennego minimum.
3. **Prawdziwa periodyzacja**: awans TYLKO przez zdany test zdolności, deload co
   4. tydzień, jasna reguła oblanego testu.

Dlaczego nie alternatywy solo: GtG nie ma mety i nie trenuje długich serii; RR
optymalizuje złą zmienną; drabinki liniowe łamią wprost nasze ograniczenia.
Program Speirsa jako jedyny jest już test-gated, już 3x/tydz., ma 17+ lat masowego
użycia — a jego wady (fantazyjne 6 tygodni, cienki on-ramp, nadużywanie AMRAP)
naprawiają dokładnie poprawki 1–3.

## Szkielet progresji

**Pojęcia**
- **Max Test (MT)**: jedna seria bieżącego wariantu do upadku technicznego
  (łamie się forma = koniec serii). Na świeżo, po dniu odpoczynku. ~3 min.
- **Twarda sesja (HS)**: 5 serii, 60–120 s przerwy, powtórzenia z tabeli wg
  ostatniego MT. Ostatnia seria = „AMRAP minus 1–2" (stop, gdy następne
  powtórzenie byłoby brzydkie), nie prawdziwy upadek.
- **Dzień łatwy (ED)**: 2-min minimum passy — jedna seria 40–50% MT idealną formą
  albo sama mobilność/rozgrzewka. Wszystko ponad minimum zawsze opcjonalne.

**Drabinka wariantów** (test decyduje o wejściu)
- MT 0–4 pełnych pompek → trenuj najtrudniejszy wariant z MT ≥ 6:
  ściana / wysoki skos (stół) / niski skos (ławka) / kolana.
- Awans wariantu przy MT ≥ 20 na nim → przejście na trudniejszy (nowy MT ≈ 30–50%
  starego — komunikować z góry, żeby nie wyglądało jak regres).
- MT ≥ 5 pełnych → trenuj pełne pompki.

**Szablon tygodnia**
- Pn / Śr / Pt (dowolne 3 nienastępujące po sobie dni): twarda sesja.
- Pozostałe dni: dzień łatwy (2-min floor trzyma passę; seria GtG zachęcana,
  nigdy wymagana).
- Nigdy dwie twarde sesje dzień po dniu.

**Struktura bloku** (powtarzać do celu)
- Tyg. 1–3: sesje wg tabeli dla bieżącego przedziału MT; serie ~60/70/50/50%/AMRAP-1
  w tyg. 1, eskalacja objętości ~10–15%/tydz. (odbicie tabel Speirsa: objętość
  sesji dochodzi do ~2,5–3× testowanego maxa).
- Tydz. 4: **DELOAD** — dwie sesje na 60% objętości tyg. 3, bez AMRAP; trzecia
  sesja zastąpiona Max Testem na końcu tygodnia.
- Kadencja testów: co 4. tydzień.

**Reguły bramki testowej**
- MT +≥15% lub nowy przedział → następny blok. Tabela ZAWSZE wg przedziału z nowego MT
  (`bracketFor(newMT)`) — „wyższa tabela" to skutek, nie osobna akcja awansu.
  [doprecyzowanie po review 2026-07-15; wiążąca wersja reguł: data-model.md §4]
- MT +<15% ale >0 → powtórz blok („blok konsolidacyjny" — normalne, większość
  potrzebuje 1–2 powtórek na przedział; to „powtórz tydzień bez wstydu" w skali bloku).
- MT płaski lub NIŻSZY → wymuszona regeneracja: pełny łatwy tydzień (tylko ED,
  passa nietknięta), potem poprzedni blok na 90% objętości. Dwa oblane testy
  z rzędu → zejście o przedział (lub wariant) + prompty o śnie/bolesności.
- Choroba/przerwa → passa wybacza (mechanika appki); trening: wróć do tygodnia,
  w którym stanąłeś; przerwa >2 tyg. → najpierw retest.

**Mapa kamieni milowych** (od MT = 10; uczciwe widełki)
- Blok 1 (tyg. 1–4): 10 → 16–22
- Blok 2 (tyg. 5–8): → 25–35
- Blok 3 (tyg. 9–12): → 35–50
- Bloki 4–5 (tyg. 13–20): → 50–75 (spowolnienie; dodać 1x/tydz. „long set practice" —
  jedna wolna, nieprzerwana seria 60–70% maxa, bo seria 100 to też umiejętność
  pacingu i oddechu)
- Bloki 6–7 (tyg. 21–28): → 100.
- Razem: **~5–7 miesięcy** dla medianowego nietrenującego dorosłego (8–12 mies.
  dla cięższych/starszych). Komunikat produktowy: „decyduje twój test, nie kalendarz".

## Bezpieczeństwo

- **Standard powtórzenia** (definicja repa, egzekwowana w testach): sztywna deska
  biodra–barki, dłonie pod barkami, łokcie ~45° od tułowia (nie 90°), klatka na
  pięść od podłogi, pełny wyprost łokci u góry. Powtórzenia łamiące standard nie
  liczą się w MT — to zarazem mechanika anty-oszukiwania bramki.
- **Nadgarstki** (najczęstsza skarga przy wysokiej częstotliwości): pompki na
  pięściach / uchwytach / lekka rotacja dłoni jako równoważne warianty; rozgrzewka
  nadgarstków 60–90 s jako pełnoprawna treść 2-min minimum; warianty na skosie
  odciążają nadgarstki początkujących.
- **Barki/łokcie**: rampa ~30 → 150+ powt./sesję to strefa tendinopatii
  przeciążeniowych. Mitygacje w szkielecie: 48 h między HS, deload co 4. tydzień,
  AMRAP-1 zamiast mielenia do upadku, wymuszony tydzień regeneracji po oblanym
  teście. Mocno zalecane (opcjonalny nudge „balans"): 1–2 serie wiosłowania /
  band pull-apart tygodniowo na ~2000 powtórzeń pchania/mies. + scapular pushups.
- **Copy czerwonych flag**: ostry ból stawu (vs pieczenie mięśni) = stop, niżej
  wariant albo odpoczynek; drętwienie/mrowienie dłoni = specjalista. Dorośli >45
  lub z ryzykiem sercowo-naczyniowym: disclaimer typu PAR-Q przed max testami
  (wysiłek maksymalny podbija ciśnienie).
- **Nie gamifikować codziennych prób maxa.** Passa nagradza obecność, nigdy
  testowanie; testy zamknięte w harmonogramie.

## Uczciwe luki

- Dla ŻADNEGO kandydata nie istnieją opublikowane dane o ukończalności;
  przewaga hybrydy to wniosek z zasad projektowania programów + community
  post-mortems, nie zmierzone wyniki. Showup powinien mierzyć własny lejek
  (zdawalność testów per blok, tydzień odpadnięcia) — byłby to realnie najlepszy
  istniejący zbiór danych w tym temacie.
- Widełki czasowe (5–7 mies. od 10 powt.) zsyntetyzowane z twierdzeń trenerskich;
  brak danych recenzowanych o time-to-100; duża wariancja wg masy, wieku, płci.
- Progi 15% poprawy testu, 60% objętości deloadu, 40–50% intensywności GtG to
  obronne konwencje, nie zwalidowane stałe — traktować jako parametry strojone.
- Faza 50→100 jest najsłabiej udokumentowana gdziekolwiek (prawie wszystko dotyczy
  0→50); „long set practice" to standardowa logika trenowania wytrzymałości,
  ale najbardziej spekulatywny element.
- Czy codzienne łatwe serie GtG realnie przyspieszają rdzeń 3x/tydz. (vs tylko
  obsługują passę) — nieudowodnione; w najgorszym razie neutralne dla regeneracji
  przy 40–50%, dlatego są ograniczone i opcjonalne.
