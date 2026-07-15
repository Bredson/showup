// Polish dictionary — the source of truth for TranslationKey (i18n/index.ts).
// Trimmed to the "under construction" shell; keys return with each rebuilt screen.
export const pl = {
  'app.name': 'Showup',
  'app.tagline': 'Droga do 100 pompek. Liczy się obecność, nie wynik.',
  'app.underConstruction': 'Aplikacja jest w budowie. Wróć wkrótce.',
  'app.loadError': 'Nie udało się wczytać danych. Odśwież stronę — twoje wpisy są bezpieczne.',

  // Onboarding — welcome
  'onb.welcome.cta': 'Zaczynamy',
  'onb.lang.pl': 'Polski',
  'onb.lang.en': 'English',
  'onb.back': 'Wróć',

  // Onboarding — health disclaimer (PAR-Q-style)
  'onb.disclaimer.title': 'Zanim zaczniesz',
  'onb.disclaimer.body':
    'Ten program to trening siłowy. Jeśli masz chorobę serca, czujesz ból w klatce piersiowej przy wysiłku, miewasz zawroty głowy, masz problemy ze stawami nadgarstków, łokci lub barków, jesteś w ciąży albo masz jakiekolwiek wątpliwości zdrowotne — skonsultuj się z lekarzem, zanim zaczniesz.',
  'onb.disclaimer.redFlags':
    'Ostry ból stawu w trakcie ćwiczenia = natychmiast przerwij. Drętwienie lub mrowienie dłoni = skonsultuj się ze specjalistą.',
  'onb.disclaimer.cta': 'Rozumiem i akceptuję',

  // Onboarding — rep standard
  'onb.standard.title': 'Standard powtórzenia',
  'onb.standard.item1': 'Deska od bioder do barków — biodra nie zwisają, nie sterczą.',
  'onb.standard.item2': 'Łokcie ok. 45° od tułowia, nie na boki.',
  'onb.standard.item3': 'Klatka schodzi na wysokość pięści od podłogi (lub do podpory).',
  'onb.standard.item4': 'Pełny wyprost ramion na górze.',
  'onb.standard.note': 'Powtórzenie łamiące formę nie liczy się. Tego standardu pilnujesz też w testach.',
  'onb.standard.cta': 'Rozumiem',

  // Onboarding — first Max Test (cascade)
  'onb.test.title': 'Pierwszy Max Test',
  'onb.test.intro':
    'Zrób jak najwięcej poprawnych powtórzeń bez przerwy — do momentu, gdy forma się łamie. Bez doładowań i odpoczynku w podporze.',
  'onb.test.variantLabel': 'Wariant: {variant}',
  'onb.test.inputLabel': 'Ile poprawnych powtórzeń?',
  'onb.test.cta': 'Zapisz wynik',
  'onb.rest.title': 'Odpocznij',
  'onb.rest.body':
    'Wynik poniżej progu tego wariantu — to zupełnie w porządku, od tego jest test. Odpocznij co najmniej 3–5 minut, potem spróbuj łatwiejszego wariantu: {variant}.',
  'onb.rest.cta': 'Jestem po przerwie',

  // Onboarding — starting point
  'onb.result.title': 'Twój punkt startu',
  'onb.result.body': 'Zaczynasz od wariantu: {variant}. Twój wynik: {mt}.',
  'onb.result.seedNote':
    'Dopasowaliśmy łatwiejszy wariant szacunkowo. Pierwszy test w programie skalibruje go dokładnie — nie musisz nic robić.',
  'onb.result.cta': 'Dalej',

  // Onboarding — session days + IF-THEN
  'onb.days.title': 'Wybierz 3 dni sesji',
  'onb.days.hint': 'Żadne dwa dni obok siebie — mięśnie potrzebują doby przerwy między twardymi sesjami.',
  'onb.days.invalid': 'Wybierz dokładnie 3 dni, żadne dwa nie mogą sąsiadować (wliczając niedzielę z poniedziałkiem).',
  'onb.days.count': 'Wybrano {n} z 3 dni.',
  'onb.saveError': 'Nie udało się zapisać. Spróbuj ponownie — twój wynik testu nie przepadł.',
  'onb.progress': 'Krok {current} z {total}',
  'onb.ifthen.label': 'Kiedy zrobisz sesję? (opcjonalnie)',
  'onb.ifthen.placeholder': 'Kiedy [sygnał], robię sesję — np. „Kiedy wrócę z pracy, robię sesję”.',
  'onb.finish.cta': 'Zaczynam trening',

  // Today — day shell
  'today.title.session': 'Dzień sesji',
  'today.title.test': 'Dzień testu',
  'today.title.easy': 'Dzień lżejszy',
  'today.variantLabel': 'Wariant: {variant}',
  'today.saveError': 'Nie udało się zapisać. Spróbuj ponownie — nic nie przepadło.',
  // User decision 2026-07-15: "dni w rytmie" everywhere — never "z rzędu" (forgiving streak).
  'today.streak': 'Dni w rytmie: {n}',

  // Today — feel check (sessions and tests)
  'today.feel.title': 'Jak się dziś czujesz?',
  'today.feel.hint': 'Odpowiedz szczerze — plan się dostosuje.',
  'today.feel.fresh': 'Świeżo',
  'today.feel.ok': 'W porządku',
  'today.feel.tired': 'Zmęczenie',
  'today.feel.pain': 'Coś boli',

  // Today — pain degradation (day runs as easy; kind snapshot stays)
  'today.pain.title': 'Dziś bez twardej pracy',
  'today.pain.body':
    'Ból to sygnał stop dla ciężkiej sesji. Zrób dziś wersję lekką — to nadal pełnoprawny dzień programu.',

  // Today — session sets
  'today.sets.tiredNote': 'Zmęczenie? Plan jest dziś lżejszy o jedną serię.',
  'today.sets.progress': 'Seria {current} z {total}',
  'today.sets.target': 'Cel: {reps} powtórzeń',
  'today.sets.amrapTarget': 'Cel: maks minus jedno',
  'today.sets.amrapHint': 'Zatrzymaj się jedno powtórzenie przed załamaniem formy — nigdy do upadku.',
  'today.sets.inputLabel': 'Ile powtórzeń?',
  'today.sets.confirm': 'Zapisz serię',
  'today.sets.restHint': 'Między seriami odpocznij 60–120 sekund.',

  // Today — easy day (2-minute minimum)
  'today.easy.title': 'Dwuminutowe minimum',
  'today.easy.hint': 'Wybierz jedno i odhacz. Liczy się obecność, nie objętość.',
  'today.easy.gtg': 'Jedna luźna seria: {min}–{max} powtórzeń',
  'today.easy.warmup': 'Rozgrzewka nadgarstków i barków (2 minuty)',
  'today.easy.cta': 'Zrobione',

  // Today — Max Test (warmup reuses the onboarding safety copy: onb.disclaimer.redFlags)
  'today.test.warmup.title': 'Rozgrzewka przed testem',
  'today.test.warmup.body':
    'Zrób 2 lekkie serie po kilka powtórzeń, potem odpocznij 2–3 minuty. Test to jedna seria do załamania formy — nie do bólu.',
  'today.test.warmup.cta': 'Zaczynam test',
  'today.test.title': 'Max Test',
  'today.test.result': 'Twój wynik: {result}',

  // Today — reflection (sessions and tests)
  'today.reflection.title': 'Jedno zdanie na koniec',
  'today.reflection.placeholder': 'Jak poszło? Co dziś zauważasz?',
  'today.reflection.save': 'Zapisz i zakończ',
  'today.reflection.skip': 'Zakończ bez notatki',

  // Today — done (reinforcement)
  'today.done.session.title': 'Sesja zaliczona',
  'today.done.session.body': 'Kolejna cegiełka położona. Regularność buduje siłę szybciej niż heroizm.',
  'today.done.easy.title': 'Obecność zaliczona',
  'today.done.easy.body': 'Minimum zrobione — dokładnie o to chodzi w dni lżejsze.',
  'today.done.degraded.title': 'Dzień zaliczony',
  'today.done.degraded.body':
    'Wysłuchanie ciała to też trening. Jeśli ból wróci następnym razem, skonsultuj się ze specjalistą.',

  // Test gate outcomes (PRD §4: awans / konsolidacja / regeneracja)
  'gate.goal.title': '100 pompek. Cel osiągnięty!',
  'gate.goal.body':
    'Setka klasycznych pompek — droga przebyta w całości. Program biegnie dalej, jeśli chcesz podnosić poprzeczkę.',
  'gate.advance.title': 'Awans: {variant}',
  'gate.advance.body':
    'Nowy, trudniejszy wariant. Twój max będzie na nim niższy — to normalne, najbliższy test skalibruje plan.',
  'gate.calibrated.title': 'Plan skalibrowany',
  'gate.calibrated.body': 'Pierwszy prawdziwy test na tym wariancie ustawił twój plan. Od teraz liczymy od tego wyniku.',
  'gate.newBlock.title': 'Nowy blok odblokowany',
  'gate.newBlock.body': 'Wyraźny postęp — mocniejszy blok startuje od następnej sesji.',
  'gate.consolidation.title': 'Konsolidacja',
  'gate.consolidation.body':
    'Wynik lekko w górę. Powtarzamy blok z lepszą bazą — to normalna część drogi, nie porażka.',
  'gate.regen.title': 'Tydzień regeneracji',
  'gate.regen.body':
    'Wynik nie podskoczył — organizm prosi o oddech. Tydzień lekkich dni, potem blok raz jeszcze. Progres lubi odpoczynek.',
  'gate.stepDown.title': 'Krok w tył, dwa w przód',
  'gate.stepDown.body':
    'Dwa słabsze testy z rzędu to zwykle zmęczenie, nie regres. Schodzimy o poziom niżej — sprawdź sen i regenerację, wrócisz mocniej.',

  // Comeback interstitial (missed day → self-compassion, never reproach)
  'comeback.oneDay.title': 'Dobrze, że jesteś',
  'comeback.oneDay.body': 'Jeden dzień przerwy zdarza się każdemu. Twoja passa jest bezpieczna — wracamy do ruchu.',
  'comeback.multiDay.title': 'Dobrze, że wracasz',
  'comeback.multiDay.body':
    'Przerwa to nie porażka — to część każdej długiej drogi. Zaczynamy od dziś, reszta nie ma znaczenia.',
  'comeback.cta': 'Wracam',

  // Bottom navigation (2 tabs — the bar grows with future phases)
  'nav.label': 'Nawigacja',
  'nav.today': 'Dziś',
  'nav.progress': 'Progres',

  // Progress — hero (forgiving streak: rhythm, not perfection)
  'progress.title': 'Twój progres',
  'progress.hero.caption': 'dni w rytmie',
  'progress.hero.longest': 'Najwięcej dni w rytmie: {n}',
  'progress.hero.hint': 'Rytm wybacza pojedynczy dzień przerwy. Liczy się obecność.',

  // Progress — 28-day presence calendar (dots = pure presence; details on tap)
  'progress.calendar.title': 'Ostatnie 4 tygodnie',
  'progress.calendar.completed': 'dzień zaliczony',
  'progress.calendar.forgiven': 'dzień wybaczony — rytm trwa',
  'progress.calendar.pending': 'dziś — jeszcze otwarte',
  'progress.calendar.empty': 'bez aktywności',

  // Progress — Max Test curve (segments per variant; hollow points = estimates)
  'progress.curve.title': 'Krzywa Max Testów',
  'progress.curve.empty': 'Tu pojawi się twoja krzywa — pierwszy Max Test ją zacznie.',
  'progress.curve.baseline': 'Twój punkt odniesienia. Kolejne testy dorysują krzywą.',
  'progress.curve.seedNote': 'Puste punkty to szacunki po zmianie wariantu — pierwszy test je kalibruje.',
  'progress.curve.last': 'Ostatni test: {result} ({variant})',
  'progress.curve.srPoint': '{variant}: {value}',
  'progress.curve.srSegment': '{variant}: od {from} do {to}',

  // Progress — current program position
  'progress.position.title': 'Twoja pozycja',
  'progress.position.week': 'Tydzień {n} z 4 bloku',
  'progress.position.regen': 'Tydzień regeneracji',
  'progress.position.sessions': 'Sesje w tym tygodniu: {done} z {total}',

  // Progress — entry preview bottom sheet
  'progress.sheet.close': 'Zamknij',
  'progress.sheet.kindVariant': '{kind} · {variant}',
  'progress.sheet.reflection': '„{text}”',
  'progress.sheet.degraded': 'Dzień wykonany w wersji lekkiej (sygnał bólu).',
  'progress.sheet.sets': 'Serie: {sets}',
  'progress.sheet.easy.gtg-set': 'Luźna seria — minimum dnia',
  'progress.sheet.easy.warmup': 'Rozgrzewka — minimum dnia',

  // Pushup variant names (ladder)
  'variant.wall': 'Pompki przy ścianie',
  'variant.incline-high': 'Pompki na wysokim podwyższeniu',
  'variant.incline-low': 'Pompki na niskim podwyższeniu',
  'variant.knee': 'Pompki na kolanach',
  'variant.full': 'Pompki klasyczne',

  // Weekday chips (0 = Sunday, like Date.getDay())
  'weekday.0': 'Nd',
  'weekday.1': 'Pon',
  'weekday.2': 'Wt',
  'weekday.3': 'Śr',
  'weekday.4': 'Czw',
  'weekday.5': 'Pt',
  'weekday.6': 'Sob',
} as const;
