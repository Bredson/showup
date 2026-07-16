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
  'today.sets.timerLabel': 'Odliczanie przerwy',
  'today.sets.timerDone': 'Przerwa za tobą. Chcesz jeszcze chwilę, czy robisz kolejną serię?',

  // Today — easy day (2-minute minimum)
  'today.easy.title': 'Dwuminutowe minimum',
  'today.easy.hint': 'Wybierz jedno i odhacz. Liczy się obecność, nie objętość.',
  'today.easy.gtg': 'Jedna luźna seria: {min}–{max} powtórzeń',
  'today.easy.warmup': 'Rozgrzewka nadgarstków i barków (2 minuty)',
  'today.easy.longSet': 'Jedna długa seria: {min}–{max} powtórzeń',
  'today.easy.longSetHint':
    'Powoli i bez przerwy — to trening tempa i oddechu, nie rekord. Przerwij, gdy forma siada.',
  'today.easy.longSetReps': 'Ile powtórzeń wyszło? (opcjonalnie)',
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

  // Today — muscle-balance nudge (1x/tydz. na ekranie done; PRD §5 „Zrealizowane z backlogu")
  'today.nudge.title': 'Coś dla pleców?',
  'today.nudge.body':
    'Ten tydzień przyniesie sporo pchania. Jeśli masz ochotę, 1–2 luźne serie wiosłowania albo band pull-apart w dowolnym momencie tygodnia pomogą barkom zachować równowagę. Zero obowiązku — to tylko życzliwa podpowiedź.',

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

  // Bottom navigation (3 tabs — the bar grows with future phases)
  'nav.label': 'Nawigacja',
  'nav.today': 'Dziś',
  'nav.progress': 'Progres',
  'nav.journal': 'Dziennik',
  'nav.settings': 'Ustawienia',

  // Settings (PRD §5.6)
  'settings.title': 'Ustawienia',
  'settings.language': 'Język',
  'settings.language.error': 'Nie udało się zapisać języka — zmiana może zniknąć po odświeżeniu.',
  'settings.days.title': 'Dni sesji',
  'settings.days.save': 'Zapisz dni',
  'settings.days.saving': 'Zapisuję…',
  'settings.days.saved': 'Zapisane — plan od razu uwzględnia nowe dni.',
  'settings.days.error': 'Nie udało się zapisać dni — zmiana może zniknąć po odświeżeniu.',
  'settings.how.title': 'Jak działa Showup',
  'settings.how.show': 'Pokaż opis metody',
  'settings.how.hide': 'Zwiń opis metody',
  'settings.how.p1':
    'Showup prowadzi cię drabiną wariantów: pompki przy ścianie, na wysokim i niskim podwyższeniu, na kolanach, aż do klasycznych. Trenujesz wariant dopasowany do swojego wyniku — trudność rośnie dopiero wtedy, gdy test pokaże, że jesteś na to gotowy.',
  'settings.how.p2':
    'Plan to 3 sesje w tygodniu, zawsze z dniem przerwy pomiędzy — mięśnie zwykle rosną w dni odpoczynku. Pozostałe dni są lekkie: rozgrzewka albo jedna luźna seria. Gdy zgłosisz ból, apka nie negocjuje — dzień zamienia się w wersję lekką.',
  'settings.how.p3':
    'Co kilka tygodni robisz Max Test — jedną serię do granic. Wynik decyduje, czy przechodzisz wyżej, zostajesz na konsolidację, czy dostajesz lżejszy tydzień. Plan nie jest nigdzie zapisany na sztywno: zawsze wynika z twojej historii wpisów.',
  'settings.how.p4':
    'Passa liczy obecność, nie wynik. Dzień lekki podtrzymuje ją tak samo jak sesja, a pojedynczy dzień przerwy jest wybaczony. Po dłuższej przerwie wracasz bez wyrzutów — czasem z retestem, żeby plan dogonił rzeczywistość.',
  'settings.how.p5':
    'Program opiera się na typowych zaleceniach progresji siłowej i bywa skuteczny, ale nie jest poradą medyczną. Przy bólu, zawrotach głowy lub wątpliwościach zdrowotnych skonsultuj się ze specjalistą.',
  'settings.data': 'Twoje dane',
  'settings.export.cta': 'Eksportuj dane',
  'settings.export.working': 'Eksportuję…',
  'settings.export.error': 'Nie udało się przygotować eksportu. Spróbuj ponownie.',
  'settings.import.cta': 'Importuj dane',
  'settings.import.working': 'Importuję…',
  'settings.import.confirmBody':
    'Kopia z dnia: {date}, wpisów: {count}. Import zastąpi wszystkie obecne dane w aplikacji.',
  'settings.import.confirmCta': 'Zastąp dane kopią',
  'settings.import.invalid': 'Ten plik nie wygląda na kopię danych Showup.',
  'settings.import.newer': 'Ta kopia pochodzi z nowszej wersji aplikacji. Zaktualizuj aplikację i spróbuj ponownie.',
  'settings.import.error': 'Import się nie powiódł. Twoje obecne dane pozostały nietknięte.',
  'settings.delete.cta': 'Usuń wszystkie dane',
  'settings.delete.working': 'Usuwam…',
  'settings.delete.confirmBody':
    'Zniknie cały dziennik, profil i progres — bez kopii nie da się ich odzyskać. Możesz najpierw wyeksportować dane.',
  'settings.delete.confirmCta': 'Usuń na zawsze',
  'settings.delete.error': 'Nie udało się usunąć danych. Spróbuj ponownie.',
  'settings.confirm.keep': 'Zostaw',
  'settings.privacy': 'Wszystko zostaje na tym urządzeniu. Zero kont, zero chmury, zero śledzenia.',
  'settings.about': 'O aplikacji',
  'settings.version': 'Showup {version}',

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

  // Progress — block history funnel (PRD §6; short no-guilt labels — the gate's own verdicts)
  'progress.blocks.title': 'Historia bloków',
  'progress.blocks.result': '{result} ({variant})',
  'progress.blocks.goal': 'Cel: 100 pompek',
  'progress.blocks.advance': 'Awans: {variant}',
  'progress.blocks.calibrated': 'Kalibracja',
  'progress.blocks.newBlock': 'Nowy blok',
  'progress.blocks.consolidation': 'Konsolidacja',
  'progress.blocks.regen': 'Regeneracja',
  'progress.blocks.stepDown': 'Lżejszy poziom',

  // Progress — current program position
  'progress.position.title': 'Twoja pozycja',
  'progress.position.week': 'Tydzień {n} z 4 bloku',
  'progress.position.regen': 'Tydzień regeneracji',
  'progress.position.sessions': 'Sesje w tym tygodniu: {done} z {total}',

  // Entry preview bottom sheet (shared: Progress calendar + Journal)
  'sheet.close': 'Zamknij',
  'sheet.kindVariant': '{kind} · {variant}',
  'sheet.feel': 'Samopoczucie: {feel}',
  'sheet.reflection': '„{text}”',
  'sheet.degraded': 'Dzień wykonany w wersji lekkiej (sygnał bólu).',
  'sheet.sets': 'Serie: {sets}',
  'sheet.easy.gtg-set': 'Luźna seria — minimum dnia',
  'sheet.easy.warmup': 'Rozgrzewka — minimum dnia',
  'sheet.easy.long-set': 'Długa seria — minimum dnia',
  'sheet.easy.longSetReps': 'Wynik długiej serii: {n}',

  // Journal (ux-spec §5) — reverse-chronological feed; never judges execution
  'journal.title': 'Dziennik',
  'journal.empty': 'Tu pojawią się twoje refleksje po pierwszej sesji.',
  'journal.date.today': 'Dziś',
  'journal.date.yesterday': 'Wczoraj',
  'journal.noReflection': '—',

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
