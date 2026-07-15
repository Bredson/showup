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

  // Today — day shell
  'today.title.session': 'Session day',
  'today.title.test': 'Test day',
  'today.title.easy': 'Easy day',
  'today.variantLabel': 'Variant: {variant}',
  'today.saveError': 'Could not save. Try again — nothing was lost.',
  'today.streak': 'Days showing up in a row: {n}',

  // Today — feel check (sessions and tests)
  'today.feel.title': 'How do you feel today?',
  'today.feel.hint': 'Answer honestly — the plan will adapt.',
  'today.feel.fresh': 'Fresh',
  'today.feel.ok': 'Okay',
  'today.feel.tired': 'Tired',
  'today.feel.pain': 'Something hurts',

  // Today — pain degradation (day runs as easy; kind snapshot stays)
  'today.pain.title': 'No hard work today',
  'today.pain.body':
    'Pain is a stop signal for a hard session. Do the light version today — it still counts as a full program day.',

  // Today — session sets
  'today.sets.tiredNote': 'Tired? Today\u2019s plan is one set lighter.',
  'today.sets.progress': 'Set {current} of {total}',
  'today.sets.target': 'Target: {reps} reps',
  'today.sets.amrapTarget': 'Target: max minus one',
  'today.sets.amrapHint': 'Stop one rep before your form breaks — never to failure.',
  'today.sets.inputLabel': 'How many reps?',
  'today.sets.confirm': 'Save set',
  'today.sets.restHint': 'Rest 60–120 seconds between sets.',

  // Today — easy day (2-minute minimum)
  'today.easy.title': 'The two-minute minimum',
  'today.easy.hint': 'Pick one and check it off. Showing up counts, not volume.',
  'today.easy.gtg': 'One relaxed set: {min}–{max} reps',
  'today.easy.warmup': 'Wrist and shoulder warm-up (2 minutes)',
  'today.easy.cta': 'Done',

  // Today — Max Test (warmup reuses the onboarding safety copy: onb.disclaimer.redFlags)
  'today.test.warmup.title': 'Warm-up before the test',
  'today.test.warmup.body':
    'Do 2 light sets of a few reps, then rest 2–3 minutes. The test is one set until your form breaks — not until it hurts.',
  'today.test.warmup.cta': 'Start the test',
  'today.test.title': 'Max Test',
  'today.test.result': 'Your result: {result}',

  // Today — reflection (sessions and tests)
  'today.reflection.title': 'One sentence to finish',
  'today.reflection.placeholder': 'How did it go? What do you notice today?',
  'today.reflection.save': 'Save and finish',
  'today.reflection.skip': 'Finish without a note',

  // Today — done (reinforcement)
  'today.done.session.title': 'Session done',
  'today.done.session.body': 'Another brick laid. Consistency builds strength faster than heroics.',
  'today.done.easy.title': 'Showed up',
  'today.done.easy.body': 'Minimum done — that is exactly what easy days are about.',
  'today.done.degraded.title': 'Day complete',
  'today.done.degraded.body':
    'Listening to your body is training too. If the pain returns next time, see a specialist.',

  // Test gate outcomes (PRD §4: advance / consolidation / regeneration)
  'gate.goal.title': '100 pushups. Goal reached!',
  'gate.goal.body':
    'One hundred full pushups — the whole road travelled. The program keeps going if you want to raise the bar.',
  'gate.advance.title': 'Advance: {variant}',
  'gate.advance.body':
    'A new, harder variant. Your max will be lower on it — that is normal; the next test will calibrate the plan.',
  'gate.calibrated.title': 'Plan calibrated',
  'gate.calibrated.body': 'Your first real test on this variant set your plan. From now on we count from this result.',
  'gate.newBlock.title': 'New block unlocked',
  'gate.newBlock.body': 'Clear progress — a stronger block starts with your next session.',
  'gate.consolidation.title': 'Consolidation',
  'gate.consolidation.body':
    'A small step up. We repeat the block with a better base — a normal part of the road, not a failure.',
  'gate.regen.title': 'Regeneration week',
  'gate.regen.body':
    'The result did not jump — your body is asking for a breather. A week of easy days, then the block once more. Progress loves rest.',
  'gate.stepDown.title': 'One step back, two forward',
  'gate.stepDown.body':
    'Two weaker tests in a row usually mean fatigue, not regression. We step down one level — check your sleep and recovery, you will come back stronger.',

  // Comeback interstitial (missed day → self-compassion, never reproach)
  'comeback.oneDay.title': 'Good to see you',
  'comeback.oneDay.body': 'A one-day break happens to everyone. Your streak is safe — back to moving.',
  'comeback.multiDay.title': 'Good to have you back',
  'comeback.multiDay.body':
    'A break is not a failure — it is part of every long road. We start from today; the rest does not matter.',
  'comeback.cta': "I'm back",

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
