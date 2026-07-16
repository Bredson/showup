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
  // User decision 2026-07-15: "days in rhythm" everywhere — never "in a row" (forgiving streak).
  'today.streak': 'Days in rhythm: {n}',

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

  // Bottom navigation (3 tabs — the bar grows with future phases)
  'nav.label': 'Navigation',
  'nav.today': 'Today',
  'nav.progress': 'Progress',
  'nav.journal': 'Journal',
  'nav.settings': 'Settings',

  // Settings (PRD §5.6)
  'settings.title': 'Settings',
  'settings.language': 'Language',
  'settings.language.error': 'Could not save the language — the change may not survive a refresh. Please try again.',
  'settings.days.title': 'Session days',
  'settings.days.save': 'Save days',
  'settings.days.saving': 'Saving…',
  'settings.days.saved': 'Saved — your plan follows the new days right away.',
  'settings.days.error': 'Could not save the days — the change may not survive a refresh.',
  'settings.how.title': 'How Showup works',
  'settings.how.show': 'Show how the method works',
  'settings.how.hide': 'Hide how the method works',
  'settings.how.p1':
    'Showup walks you up a ladder of variants: wall push-ups, high and low incline, knees, all the way to full push-ups. You train the variant matched to your result — difficulty only rises once a test shows you are ready for it.',
  'settings.how.p2':
    'The plan is 3 sessions a week, always with a rest day in between — muscles tend to grow on the days off. The remaining days are easy: a warm-up or one loose set. If you report pain, the app does not negotiate — the day turns into its easy version.',
  'settings.how.p3':
    'Every few weeks you take a Max Test — one set to your limit. The result decides whether you move up, stay to consolidate, or get a lighter week. The plan is never stored anywhere: it is always derived from your entry history.',
  'settings.how.p4':
    'The streak counts showing up, not results. An easy day keeps it alive just like a session, and a single missed day is forgiven. After a longer break you come back without guilt — sometimes with a retest, so the plan catches up with reality.',
  'settings.how.p5':
    'The program follows common strength-progression guidelines and tends to work, but it is not medical advice. If you feel pain, dizziness or have health concerns, consult a professional.',
  'settings.data': 'Your data',
  'settings.export.cta': 'Export data',
  'settings.export.working': 'Exporting…',
  'settings.export.error': 'Could not prepare the export. Please try again.',
  'settings.import.cta': 'Import data',
  'settings.import.working': 'Importing…',
  'settings.import.confirmBody':
    'Backup from {date}, entries: {count}. Importing will replace all current data in the app.',
  'settings.import.confirmCta': 'Replace data with backup',
  'settings.import.invalid': 'This file does not look like a Showup backup.',
  'settings.import.newer': 'This backup comes from a newer app version. Update the app and try again.',
  'settings.import.error': 'The import failed. Your current data was left untouched.',
  'settings.delete.cta': 'Delete all data',
  'settings.delete.working': 'Deleting…',
  'settings.delete.confirmBody':
    'Your whole journal, profile and progress will be gone — without a backup they cannot be recovered. You can export your data first.',
  'settings.delete.confirmCta': 'Delete forever',
  'settings.delete.error': 'Could not delete the data. Please try again.',
  'settings.confirm.keep': 'Keep it',
  'settings.privacy': 'Everything stays on this device. No accounts, no cloud, no tracking.',
  'settings.about': 'About',
  'settings.version': 'Showup {version}',

  // Progress — hero (forgiving streak: rhythm, not perfection)
  'progress.title': 'Your progress',
  'progress.hero.caption': 'days in rhythm',
  'progress.hero.longest': 'Most days in rhythm: {n}',
  'progress.hero.hint': 'The rhythm forgives a single day off. Showing up is what counts.',

  // Progress — 28-day presence calendar (dots = pure presence; details on tap)
  'progress.calendar.title': 'Last 4 weeks',
  'progress.calendar.completed': 'day done',
  'progress.calendar.forgiven': 'day forgiven — the rhythm holds',
  'progress.calendar.pending': 'today — still open',
  'progress.calendar.empty': 'no activity',

  // Progress — Max Test curve (segments per variant; hollow points = estimates)
  'progress.curve.title': 'Max Test curve',
  'progress.curve.empty': 'Your curve will appear here — the first Max Test starts it.',
  'progress.curve.baseline': 'Your baseline. Future tests will draw the curve.',
  'progress.curve.seedNote': 'Hollow points are estimates after a variant change — the first test calibrates them.',
  'progress.curve.last': 'Last test: {result} ({variant})',
  'progress.curve.srPoint': '{variant}: {value}',
  'progress.curve.srSegment': '{variant}: from {from} to {to}',

  // Progress — block history funnel (PRD §6; short no-guilt labels — the gate's own verdicts)
  'progress.blocks.title': 'Block history',
  'progress.blocks.result': '{result} ({variant})',
  'progress.blocks.goal': 'Goal: 100 push-ups',
  'progress.blocks.advance': 'Advance: {variant}',
  'progress.blocks.calibrated': 'Calibration',
  'progress.blocks.newBlock': 'New block',
  'progress.blocks.consolidation': 'Consolidation',
  'progress.blocks.regen': 'Regeneration',
  'progress.blocks.stepDown': 'Easier level',

  // Progress — current program position
  'progress.position.title': 'Where you are',
  'progress.position.week': 'Week {n} of 4 in the block',
  'progress.position.regen': 'Regeneration week',
  'progress.position.sessions': 'Sessions this week: {done} of {total}',

  // Entry preview bottom sheet (shared: Progress calendar + Journal)
  'sheet.close': 'Close',
  'sheet.kindVariant': '{kind} · {variant}',
  'sheet.feel': 'Feeling: {feel}',
  'sheet.reflection': '“{text}”',
  'sheet.degraded': 'Day done as the light version (pain signal).',
  'sheet.sets': 'Sets: {sets}',
  'sheet.easy.gtg-set': 'One relaxed set — the daily minimum',
  'sheet.easy.warmup': 'Warm-up — the daily minimum',

  // Journal (ux-spec §5) — reverse-chronological feed; never judges execution
  'journal.title': 'Journal',
  'journal.empty': 'Your reflections will appear here after your first session.',
  'journal.date.today': 'Today',
  'journal.date.yesterday': 'Yesterday',
  'journal.noReflection': '—',

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
