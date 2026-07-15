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
