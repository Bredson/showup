// Polish dictionary — the reference language (every key must exist here).
export const pl = {
  'app.name': 'Unstuck',
  'app.tagline': 'Jedno małe wyzwanie dziennie, bez presji.',
  'app.loadError': 'Nie udało się wczytać danych. Odśwież stronę — twoje wpisy są bezpieczne.',

  // Bottom navigation (ux-spec: mapa nawigacji)
  'nav.today': 'Dziś',
  'nav.progress': 'Progres',
  'nav.journal': 'Dziennik',
  'nav.settings': 'Ustawienia',

  // Today screen (ux-spec §2)
  'today.greeting.morning': 'Dzień dobry!',
  'today.greeting.midday': 'Cześć!',
  'today.greeting.evening': 'Dobry wieczór!',
  'today.streak': '{days} dni w rytmie',
  'today.firstTime': 'Twoje pierwsze wyzwanie 🌱',
  'today.level': 'Poziom {level}',
  'today.start': 'Zacznij (≈3 min)',
  'today.resume': 'Dokończ (zostało ~2 min)',
  'today.done.title': 'Zrobione na dziś ✓',
  'today.done.body': 'Do zobaczenia jutra.',
  'today.done.journalLink': 'Zobacz swój wpis',
  'today.missingContent': 'Dzisiejszy wpis jest zapisany w dzienniku.',

  // Loop step 3.1 — emotion check-in (mandatory, Dylemat 1)
  'loop.emotion.question': 'Co czujesz, myśląc o dzisiejszym wyzwaniu?',
  'loop.emotion.firstTime': 'Nazwanie emocji to połowa roboty.',
  'loop.emotion.anxiety': 'Lęk',
  'loop.emotion.boredom': 'Nuda',
  'loop.emotion.overwhelm': 'Przytłoczenie',
  'loop.emotion.aversion': 'Niechęć',
  'loop.emotion.confusion': 'Niejasność',
  'loop.emotion.ack.anxiety': 'Lęk jest OK. Zaraz go zmniejszymy.',
  'loop.emotion.ack.boredom': 'Nuda też jest informacją.',
  'loop.emotion.ack.overwhelm': 'Dużo naraz? Zaraz to zmniejszymy.',
  'loop.emotion.ack.aversion': 'Niechęć to normalka. Damy radę.',
  'loop.emotion.ack.confusion': 'Niejasność? Zaraz będzie konkret.',

  // Loop step 3.2 — challenge content
  'loop.challenge.taskHeading': 'Twoje zadanie',
  'loop.challenge.adapt.anxiety': 'Nie musi wyjść idealnie — ma tylko być zaczęte.',
  'loop.challenge.adapt.boredom': 'Nudne? Tym łatwiej — to tylko chwila.',
  'loop.challenge.adapt.overwhelm': 'Tylko ten jeden mały kawałek. Reszta może poczekać.',
  'loop.challenge.adapt.aversion': 'Nie musisz tego lubić. Wystarczy zacząć.',
  'loop.challenge.adapt.confusion': 'Zadanie poniżej jest konkretne — nic więcej nie trzeba wiedzieć.',
  'loop.next': 'Dalej',

  // Loop step 3.3 — if-then (optional to fill, Gollwitzer)
  'loop.ifthen.question': 'Kiedy i gdzie to zrobisz?',
  'loop.ifthen.why': 'Jedno zdanie podnosi szansę wykonania ~2×. Ale to opcja.',
  'loop.ifthen.template.when': 'Kiedy…',
  'loop.ifthen.placeholder': 'Kiedy zrobię kawę, otworzę dokument.',
  'loop.ifthen.chip1': 'po śniadaniu',
  'loop.ifthen.chip2': 'po powrocie do domu',
  'loop.ifthen.chip3': 'przed wieczorem',
  'loop.ifthen.save': 'Zapisz i dalej',
  'loop.ifthen.skip': 'Pomiń ten krok',

  // Loop step 3.4 — execution (2-minute rule)
  'loop.exec.heading': 'Teraz tylko pierwsze 2 minuty.',
  'loop.exec.body': 'Nie musisz kończyć. Zacznij — i możesz przestać po 2 minutach.',
  'loop.exec.yourPlan': 'Twój plan:',
  'loop.exec.timerStart': 'Włącz timer 2:00',
  'loop.exec.timerDone': '2 minuty za tobą. Chcesz jeszcze chwilę, czy klikasz Zrobione?',
  'loop.exec.done': 'Zrobione ✓',
  'loop.exec.later': 'Wrócę później',

  // Loop step 3.5 — reflection (mandatory with chips, Dylemat 2)
  'loop.reflect.placeholder': 'Wystarczy jedno zdanie…',
  'loop.reflect.chip1': 'Start był najtrudniejszy',
  'loop.reflect.chip2': 'Poszło lepiej niż myślałem',
  'loop.reflect.chip3': 'Nadal było ciężko',
  'loop.reflect.save': 'Zapisz',

  // Loop step 3.6 — reinforcement
  'loop.reinforce.message': 'Zrobione mimo: {emotion}. Tak buduje się zmianę.',
  'loop.reinforce.messageNoEmotion': 'Zrobione. Tak buduje się zmianę.',
  'loop.reinforce.firstDay': 'Pierwszy krok za tobą. To był ten najtrudniejszy.',
  'loop.reinforce.progress': 'Dzień {streak} · Poziom {level}',
  'loop.reinforce.bye': 'Do jutra 👋',
  'loop.reinforce.seeProgress': 'Zobacz progres',

  // Loop chrome
  'loop.close': 'Zamknij pętlę',
  'loop.stepOf': 'Krok {n} z 6',

  // Challenge category labels (card titles)
  'category.small-steps': 'Małe kroki',
  'category.two-minute': 'Zasada 2 minut',
  'category.emotion': 'Emocje pod lupą',
  'category.starting': 'Sztuka startu',

  // Stub screens (filled by later features)
  'stub.progress': 'Twoja droga pojawi się tutaj.',
  'stub.journal': 'Tu pojawią się twoje refleksje po pierwszym wyzwaniu.',
  'stub.settings': 'Ustawienia pojawią się wkrótce.',
} as const;
