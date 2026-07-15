// English dictionary — must cover every TranslationKey from pl.ts.
import type { pl } from './pl';

export const en: Record<keyof typeof pl, string> = {
  'app.name': 'Showup',
  'app.tagline': 'The road to 100 pushups. Showing up counts, not the score.',
  'app.underConstruction': 'The app is under construction. Come back soon.',
  'app.loadError': 'Could not load your data. Refresh the page — your entries are safe.',

  // Onboarding — welcome
  'onb.welcome.cta': "Let's start",
  'onb.lang.pl': 'Polski',
  'onb.lang.en': 'English',
  'onb.back': 'Back',

  // Onboarding — health disclaimer (PAR-Q-style)
  'onb.disclaimer.title': 'Before you start',
  'onb.disclaimer.body':
    'This program is strength training. If you have a heart condition, feel chest pain during exertion, experience dizziness, have wrist, elbow or shoulder problems, are pregnant, or have any health doubts — talk to a doctor before you begin.',
  'onb.disclaimer.redFlags':
    'Sharp joint pain during an exercise = stop immediately. Numbness or tingling in your hands = see a specialist.',
  'onb.disclaimer.cta': 'I understand and accept',

  // Onboarding — rep standard
  'onb.standard.title': 'The rep standard',
  'onb.standard.item1': 'Plank from hips to shoulders — hips neither sagging nor piked.',
  'onb.standard.item2': 'Elbows at ~45° to the torso, not flared out.',
  'onb.standard.item3': 'Chest lowers to a fist-height from the floor (or to the support).',
  'onb.standard.item4': 'Full arm lockout at the top.',
  'onb.standard.note': 'A rep that breaks form does not count. You hold this standard in tests too.',
  'onb.standard.cta': 'Got it',

  // Onboarding — first Max Test (cascade)
  'onb.test.title': 'First Max Test',
  'onb.test.intro':
    'Do as many clean reps as you can without stopping — until your form breaks. No bouncing, no resting in the plank.',
  'onb.test.variantLabel': 'Variant: {variant}',
  'onb.test.inputLabel': 'How many clean reps?',
  'onb.test.cta': 'Save result',
  'onb.rest.title': 'Take a break',
  'onb.rest.body':
    "Below this variant's entry bar — that is completely fine, that's what the test is for. Rest at least 3–5 minutes, then try an easier variant: {variant}.",
  'onb.rest.cta': "I've rested",

  // Onboarding — starting point
  'onb.result.title': 'Your starting point',
  'onb.result.body': 'You start with: {variant}. Your score: {mt}.',
  'onb.result.seedNote':
    'We matched an easier variant by estimate. Your first in-program test will calibrate it precisely — nothing to do on your end.',
  'onb.result.cta': 'Next',

  // Onboarding — session days + IF-THEN
  'onb.days.title': 'Pick 3 session days',
  'onb.days.hint': 'No two days next to each other — muscles need a day between hard sessions.',
  'onb.days.invalid': 'Pick exactly 3 days, no two adjacent (Sunday and Monday count as neighbours).',
  'onb.days.count': '{n} of 3 days picked.',
  'onb.saveError': 'Saving failed. Try again — your test result is not lost.',
  'onb.progress': 'Step {current} of {total}',
  'onb.ifthen.label': 'When will you do your session? (optional)',
  'onb.ifthen.placeholder': 'When [signal], I do my session — e.g. "When I get home from work, I do my session."',
  'onb.finish.cta': 'Start training',

  // Pushup variant names (ladder)
  'variant.wall': 'Wall pushups',
  'variant.incline-high': 'High incline pushups',
  'variant.incline-low': 'Low incline pushups',
  'variant.knee': 'Knee pushups',
  'variant.full': 'Full pushups',

  // Weekday chips (0 = Sunday, like Date.getDay())
  'weekday.0': 'Sun',
  'weekday.1': 'Mon',
  'weekday.2': 'Tue',
  'weekday.3': 'Wed',
  'weekday.4': 'Thu',
  'weekday.5': 'Fri',
  'weekday.6': 'Sat',
} as const;
