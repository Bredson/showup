// Engine tests against the binding spec: docs/data-model.md §4.
import { describe, expect, it } from 'vitest';
import { program } from '../content/program';
import type { DailyEntry, ISODate, ProgramState, UserProfile, Variant, Weekday } from './types';
import {
  applyGate,
  bracketFor,
  computeGateLog,
  computeProgram,
  dayKindFor,
  easyContentRange,
  longSetOffered,
  longSetRange,
  onboardingNextStep,
  resolveOnboardingResult,
  sessionPlan,
  validateSessionDays,
  withSessionDays,
} from './program';

// --- fixtures ---------------------------------------------------------------

/** Mon/Wed/Fri. 2026-07-06 is a Monday. */
const SESSION_DAYS: [Weekday, Weekday, Weekday] = [1, 3, 5];
const START: ISODate = '2026-07-06';

function profileWith(days: [Weekday, Weekday, Weekday] = SESSION_DAYS): UserProfile {
  return {
    id: 'singleton',
    language: 'pl',
    startDate: START,
    sessionDays: days,
    ifThen: null,
    disclaimerAcceptedAt: `${START}T08:00:00.000Z`,
    createdAt: `${START}T08:00:00.000Z`,
  };
}

function entry(partial: Partial<DailyEntry> & { date: ISODate; kind: DailyEntry['kind'] }): DailyEntry {
  return {
    variant: 'full',
    feelBefore: null,
    downgradedTo: null,
    status: 'completed',
    sets: null,
    testResult: null,
    easyContent: null,
    longSetReps: null,
    reflection: null,
    completedAt: `${partial.date}T18:00:00.000Z`,
    updatedAt: `${partial.date}T18:00:00.000Z`,
    ...partial,
  };
}

function test0(result: number, variant: Variant = 'full'): DailyEntry {
  return entry({ date: START, kind: 'test', variant, testResult: result });
}

function session(date: ISODate, variant: Variant = 'full'): DailyEntry {
  return entry({ date, kind: 'session', variant, sets: [5, 6, 4, 4, 7] });
}

const baseGate = {
  variant: 'full' as Variant,
  lastMT: 20,
  lastMTisSeed: false,
  volumeModifier: 1 as const,
  consolidations: 0,
  failedTestsInRow: 0,
  goalReachedAt: null,
};

function stateFor(entries: DailyEntry[], today: ISODate): ProgramState {
  return computeProgram(entries, profileWith(), program, today);
}

// --- bracketFor ---------------------------------------------------------------

describe('bracketFor', () => {
  it('maps MT into its bracket', () => {
    expect(bracketFor(5, program).id).toBe('b1');
    expect(bracketFor(10, program).id).toBe('b1');
    expect(bracketFor(11, program).id).toBe('b2');
    expect(bracketFor(100, program).id).toBe('b6');
  });

  it('clamps below the floor and above the ceiling', () => {
    expect(bracketFor(1, program).id).toBe('b1'); // ladder floor: wall trains on b1
    expect(bracketFor(140, program).id).toBe('b6');
  });
});

// --- validateSessionDays ------------------------------------------------------

describe('validateSessionDays', () => {
  it('accepts 3 non-adjacent days', () => {
    expect(validateSessionDays([1, 3, 5])).toBe(true);
    expect(validateSessionDays([0, 2, 4])).toBe(true);
  });
  it('rejects adjacency, duplicates and wrong count', () => {
    expect(validateSessionDays([1, 2, 4])).toBe(false);
    expect(validateSessionDays([0, 2, 6])).toBe(false); // 6 and 0 adjacent mod 7
    expect(validateSessionDays([1, 1, 4])).toBe(false);
    expect(validateSessionDays([1, 4] as unknown as Weekday[])).toBe(false);
  });
});

// --- withSessionDays ------------------------------------------------------------

describe('withSessionDays', () => {
  it('returns a new profile with the days in canonical sorted order', () => {
    const before = profileWith();
    const after = withSessionDays(before, [6, 2, 4]);
    expect(after).toEqual({ ...before, sessionDays: [2, 4, 6] }); // ONLY the days change
    expect(after).not.toBe(before);
  });

  it('does not mutate the input profile or the days argument', () => {
    const before = profileWith();
    const days: Weekday[] = [6, 2, 4];
    withSessionDays(before, days);
    expect(before.sessionDays).toEqual([1, 3, 5]);
    expect(days).toEqual([6, 2, 4]); // sort works on a copy
  });

  it('throws on invalid days (final gate mirrors the onboarding builder)', () => {
    expect(() => withSessionDays(profileWith(), [1, 2, 4])).toThrow(/invalid session days/);
    expect(() => withSessionDays(profileWith(), [1, 3])).toThrow(/invalid session days/);
  });
});

// --- onboarding ---------------------------------------------------------------

describe('onboarding cascade', () => {
  it('starts with a full attempt; enough reps → train full for real', () => {
    expect(onboardingNextStep([], program)).toEqual({ kind: 'attempt', variant: 'full' });
    expect(onboardingNextStep([{ variant: 'full', result: 8 }], program)).toEqual({
      kind: 'done',
      variant: 'full',
      lastMT: 8,
      lastMTisSeed: false,
    });
  });

  it('below the full threshold → ONE more real attempt, one step easier (knee)', () => {
    expect(onboardingNextStep([{ variant: 'full', result: 3 }], program)).toEqual({
      kind: 'attempt',
      variant: 'knee',
    });
  });

  it('second attempt clears its bar → train it with a real MT', () => {
    const step = onboardingNextStep(
      [
        { variant: 'full', result: 3 },
        { variant: 'knee', result: 9 },
      ],
      program,
    );
    expect(step).toEqual({ kind: 'done', variant: 'knee', lastMT: 9, lastMTisSeed: false });
  });

  it('second attempt also fails → estimates down the ladder (max 2 real attempts)', () => {
    // knee=3 → incline-low est round(3/0.4)=8 >= 6 → train incline-low, seeded
    const step = onboardingNextStep(
      [
        { variant: 'full', result: 1 },
        { variant: 'knee', result: 3 },
      ],
      program,
    );
    expect(step).toEqual({ kind: 'done', variant: 'incline-low', lastMT: 8, lastMTisSeed: true });
  });

  it('ladder floor: everything estimated below threshold ends on wall anyway', () => {
    const r = resolveOnboardingResult('knee', 0, program);
    expect(r.variant).toBe('wall');
    expect(r.lastMT).toBeGreaterThanOrEqual(1);
    expect(r.lastMTisSeed).toBe(true);
  });
});

// --- gate -----------------------------------------------------------------------

describe('applyGate', () => {
  it('>= +15% → new block per bracketFor(newMT), counters reset', () => {
    const r = applyGate(24, '2026-08-01', { ...baseGate, consolidations: 2 }, program);
    expect(r.state.lastMT).toBe(24);
    expect(r.state.consolidations).toBe(0);
    expect(r.state.volumeModifier).toBe(1);
    expect(r.regenUntil).toBeNull();
    expect(r.blockAnchor).toBe('2026-08-02');
  });

  it('small improvement in the same bracket → consolidation', () => {
    const r = applyGate(16, '2026-08-01', { ...baseGate, lastMT: 15 }, program);
    expect(r.state.lastMT).toBe(16);
    expect(r.state.consolidations).toBe(1);
    expect(r.regenUntil).toBeNull();
  });

  it('big drop re-seats into the lower bracket instead of failing (spec branch order)', () => {
    const r = applyGate(9, '2026-08-01', baseGate, program); // 20 → 9: b2 → b1
    expect(r.state.lastMT).toBe(9);
    expect(r.state.failedTestsInRow).toBe(0);
  });

  it('failed test → regen week, then the same block at 0.9; lastMT untouched', () => {
    const r = applyGate(19, '2026-08-01', baseGate, program); // same bracket, no improvement
    expect(r.state.lastMT).toBe(20);
    expect(r.state.failedTestsInRow).toBe(1);
    expect(r.state.volumeModifier).toBe(0.9);
    expect(r.regenUntil).toBe('2026-08-08');
    expect(r.blockAnchor).toBe('2026-08-09');
  });

  it('second failed test → step down a bracket (lastMT = prev bracket maxMT, as a seed)', () => {
    const r = applyGate(18, '2026-08-01', { ...baseGate, failedTestsInRow: 1 }, program);
    expect(r.state.lastMT).toBe(10); // b1.maxMT
    expect(r.state.lastMTisSeed).toBe(true); // synthetic value → next test calibrates
    expect(r.state.failedTestsInRow).toBe(0);
    expect(r.state.volumeModifier).toBe(1);
    expect(r.regenUntil).toBe('2026-08-08');
  });

  it('second failed test on the lowest bracket → step down a variant with a seed', () => {
    const r = applyGate(
      5,
      '2026-08-01',
      { ...baseGate, variant: 'knee', lastMT: 7, failedTestsInRow: 1 },
      program,
    );
    expect(r.state.variant).toBe('incline-low');
    expect(r.state.lastMT).toBe(Math.round(5 / program.variantSeedFactor));
    expect(r.state.lastMTisSeed).toBe(true);
  });

  it('wall on the lowest bracket has nowhere to go — stays put', () => {
    const r = applyGate(
      4,
      '2026-08-01',
      { ...baseGate, variant: 'wall', lastMT: 6, failedTestsInRow: 1 },
      program,
    );
    expect(r.state.variant).toBe('wall');
    expect(r.state.lastMT).toBe(6);
    expect(r.outcome).toEqual({ type: 'regen' }); // the honest verdict at the ladder floor
  });

  it('graduation: MT >= 20 on a non-full variant → next variant with a seeded lastMT', () => {
    const r = applyGate(22, '2026-08-01', { ...baseGate, variant: 'knee', lastMT: 18 }, program);
    expect(r.state.variant).toBe('full');
    expect(r.state.lastMT).toBe(Math.round(program.variantSeedFactor * 22));
    expect(r.state.lastMTisSeed).toBe(true);
    expect(r.regenUntil).toBeNull();
  });

  it('first real test on a seeded variant = fresh calibration, no counters touched', () => {
    const r = applyGate(
      6,
      '2026-08-01',
      { ...baseGate, lastMT: 9, lastMTisSeed: true, failedTestsInRow: 1 },
      program,
    ); // 6 < 9 would normally be a fail — but the 9 was only a seed
    expect(r.state.lastMT).toBe(6);
    expect(r.state.lastMTisSeed).toBe(false);
    expect(r.state.failedTestsInRow).toBe(1); // untouched, not incremented
    expect(r.regenUntil).toBeNull();
  });

  it('100+ on full sets goalReachedAt once', () => {
    const r = applyGate(102, '2026-08-01', { ...baseGate, lastMT: 90 }, program);
    expect(r.state.goalReachedAt).toBe('2026-08-01');
    const r2 = applyGate(105, '2026-09-01', r.state, program);
    expect(r2.state.goalReachedAt).toBe('2026-08-01'); // first time only
  });
});

// --- computeGateLog (funnel, PRD §6) --------------------------------------------

describe('computeGateLog', () => {
  function gateTest(date: ISODate, testResult: number, variant: Variant = 'full'): DailyEntry {
    return entry({ date, kind: 'test', variant, testResult });
  }

  it('returns [] before the founding test (screens render pre-founding states gracefully)', () => {
    expect(computeGateLog([], program)).toEqual([]);
    expect(computeGateLog([session('2026-07-08')], program)).toEqual([]);
  });

  it('the founding test opens the log as calibrated — or goal at 100+ on full (PRD §3)', () => {
    expect(computeGateLog([test0(12)], program)).toEqual([
      { date: START, variant: 'full', result: 12, outcome: { type: 'calibrated' } },
    ]);
    expect(computeGateLog([test0(104)], program)[0]?.outcome).toEqual({ type: 'goal' });
  });

  it('chronological rows carry the verdict the gate reported at the time', () => {
    // 12 → 14 (+15% → new block) → 15 (consolidation) → 14 (regen) → 13 (2nd fail → step-down).
    // All gaps ≤ 14 days, so the pause rule never rewrites a fail into a calibration.
    const entries = [
      test0(12),
      gateTest('2026-07-15', 14),
      gateTest('2026-07-25', 15),
      gateTest('2026-08-04', 14),
      gateTest('2026-08-14', 13),
    ];
    expect(computeGateLog(entries, program).map((i) => [i.date, i.result, i.outcome.type])).toEqual([
      [START, 12, 'calibrated'],
      ['2026-07-15', 14, 'new-block'],
      ['2026-07-25', 15, 'consolidation'],
      ['2026-08-04', 14, 'regen'],
      ['2026-08-14', 13, 'step-down'],
    ]);
  });

  it('graduation shows as variant-advance with the new variant', () => {
    const entries = [
      test0(10, 'knee'),
      session('2026-07-13', 'knee'), // keep-alive: gap ≤ 14 days
      gateTest('2026-07-25', 22, 'knee'),
    ];
    expect(computeGateLog(entries, program)[1]).toEqual({
      date: '2026-07-25',
      variant: 'knee',
      result: 22,
      outcome: { type: 'variant-advance', variant: 'full' },
    });
  });

  it('goal wins over the branch verdict (100+ on full mid-program)', () => {
    const log = computeGateLog([test0(90), gateTest('2026-07-15', 102)], program);
    expect(log[1]?.outcome).toEqual({ type: 'goal' });
  });

  it('a retest after a >14-day pause is a calibration, not a fail (§4 pause rule)', () => {
    const log = computeGateLog([test0(12), gateTest('2026-09-01', 8)], program);
    expect(log[1]?.outcome).toEqual({ type: 'calibrated' });
  });

  it('sorts a copy — unordered input is handled and never mutated', () => {
    const entries = [gateTest('2026-07-15', 14), test0(12)];
    const snapshot = [...entries];
    expect(computeGateLog(entries, program).map((i) => i.date)).toEqual([START, '2026-07-15']);
    expect(entries).toEqual(snapshot);
  });
});

// --- position: slots, blockWeek, pause ------------------------------------------

describe('computeProgram position', () => {
  it('fresh onboarding → week 1, slot 0', () => {
    const s = stateFor([test0(12)], START);
    expect(s.variant).toBe('full');
    expect(s.lastMT).toBe(12);
    expect(s.bracket).toBe('b2');
    expect(s.blockWeek).toBe(1);
    expect(s.sessionsDoneThisWeek).toBe(0);
  });

  it('slots pass even when sessions lapse — the program flows forward', () => {
    // Onboarding Mon 07-06; scheduled Wed/Fri lapse; next Mon 07-13 → 2 slots passed, week 1.
    expect(stateFor([test0(12)], '2026-07-13').blockWeek).toBe(1);
    // 5 lapsed slots by Mon 07-20 → week 2; 6 by Wed 07-22 → week 3.
    // (An off-day easy entry keeps the >14-day pause freeze out of these assertions.)
    const alive22 = [test0(12), entry({ date: '2026-07-19', kind: 'easy', easyContent: 'gtg-set' })];
    expect(stateFor([test0(12)], '2026-07-20').blockWeek).toBe(2);
    expect(stateFor(alive22, '2026-07-22').blockWeek).toBe(3);
    // 12 slots passed by 08-05 → blockWeek caps at 4 (week 4 stretches until the test happens).
    // An off-day easy entry on 07-26 keeps the pause freeze out of the picture.
    const alive = [test0(12), entry({ date: '2026-07-26', kind: 'easy', easyContent: 'gtg-set' })];
    expect(stateFor(alive, '2026-08-05').blockWeek).toBe(4);
  });

  it('counts completed sessions in the current week window', () => {
    const s = stateFor([test0(12), session('2026-07-08')], '2026-07-09');
    expect(s.blockWeek).toBe(1);
    expect(s.sessionsDoneThisWeek).toBe(1);
  });

  it('onboarding entry on a non-full variant resolves the cascade', () => {
    const s = stateFor([test0(3, 'knee')], START);
    expect(s.variant).toBe('incline-low');
    expect(s.lastMT).toBe(8);
    expect(s.lastMTisSeed).toBe(true);
    expect(s.bracket).toBe('b1');
  });

  it('throws without the onboarding test entry', () => {
    expect(() => stateFor([], START)).toThrow(/onboarding/);
  });

  it('regen week after a failed test, then the block resumes', () => {
    // session 07-24 keeps the gap ≤ 14 days — otherwise the pause rule turns the fail into a calibration
    const entries = [
      test0(12),
      session('2026-07-24'),
      entry({ date: '2026-08-03', kind: 'test', testResult: 11 }),
    ];
    expect(stateFor(entries, '2026-08-05').blockWeek).toBe('regen');
    expect(stateFor(entries, '2026-08-10').blockWeek).toBe('regen'); // regenUntil = 08-10
    const after = stateFor(entries, '2026-08-12');
    expect(after.blockWeek).toBe(1);
    expect(after.volumeModifier).toBe(0.9);
  });

  it('pause > 14 days freezes the position', () => {
    const entries = [test0(12), session('2026-07-08')];
    const frozen = stateFor(entries, '2026-09-01');
    const atFreeze = stateFor(entries, '2026-07-22'); // exactly 14 days after last completed
    expect(frozen.blockWeek).toBe(atFreeze.blockWeek);
    // …and the day opens as a retest, wherever the frozen slot pointer sits:
    expect(dayKindFor(entries, profileWith(), program, '2026-09-01')).toBe('test');
  });

  it('retest after a pause calibrates instead of failing (seats the new block)', () => {
    // 12 → pause → 8: gating 8 against 12 would be a fail, but the 12 is stale (§4).
    const entries = [test0(12), entry({ date: '2026-09-01', kind: 'test', testResult: 8 })];
    const s = stateFor(entries, '2026-09-02');
    expect(s.lastMT).toBe(8);
    expect(s.lastMTisSeed).toBe(false);
    expect(s.failedTestsInRow).toBe(0);
    expect(s.volumeModifier).toBe(1);
    expect(s.blockWeek).toBe(1);
  });

  it('testHistory records synthetic seed points next to the real results (minor #5)', () => {
    // knee 10 → keep-alive session → knee 22 = graduation to full with a seeded MT of 9.
    const entries = [
      test0(10, 'knee'),
      session('2026-07-24', 'knee'),
      entry({ date: '2026-08-03', kind: 'test', variant: 'knee', testResult: 22 }),
    ];
    expect(stateFor(entries, '2026-08-04').testHistory).toEqual([
      { date: START, variant: 'knee', result: 10 },
      { date: '2026-08-03', variant: 'knee', result: 22 },
      { date: '2026-08-03', variant: 'full', result: 9, seed: true }, // round(0.4 × 22)
    ]);
  });

  it('a pain-downgraded test never gates — it wanders to the next scheduled day', () => {
    const downgraded = entry({
      date: '2026-08-03',
      kind: 'test',
      feelBefore: 'pain',
      downgradedTo: 'easy',
      easyContent: 'warmup',
    });
    const e = [test0(12), session('2026-07-24'), downgraded];
    expect(stateFor(e, '2026-08-04').lastMT).toBe(12); // gate untouched
    expect(dayKindFor(e, profileWith(), program, '2026-08-05')).toBe('test'); // next slot = Wed
  });
});

// --- dayKindFor -------------------------------------------------------------------

describe('dayKindFor', () => {
  const p = profileWith();

  it('snapshot wins over any derivation', () => {
    const e = [test0(12), entry({ date: '2026-07-08', kind: 'easy', easyContent: 'gtg-set' })];
    expect(dayKindFor(e, p, program, '2026-07-08')).toBe('easy'); // Wed is scheduled, entry says easy
  });

  it('scheduled day → session; off day → easy', () => {
    const e = [test0(12)];
    expect(dayKindFor(e, p, program, '2026-07-08')).toBe('session'); // Wed
    expect(dayKindFor(e, p, program, '2026-07-09')).toBe('easy'); // Thu
  });

  it('pause > 14 days → retest, even on an off day', () => {
    const e = [test0(12)];
    expect(dayKindFor(e, p, program, '2026-09-01')).toBe('test');
  });

  it('regen week → easy even on scheduled days', () => {
    const e = [
      test0(12),
      session('2026-07-24'), // keep-alive: without it the pause rule masks the failed test
      entry({ date: '2026-08-03', kind: 'test', testResult: 11 }),
    ];
    expect(dayKindFor(e, p, program, '2026-08-05')).toBe('easy'); // Wed inside regen
  });

  it('slot 11 (3rd slot of week 4) opens as a test', () => {
    // Slots 0..10 (Wed 07-08 … Fri 07-31) pass by Mon 08-03 → slot index 11 → test.
    // Session on 07-24 keeps the pause rule out of the picture.
    const e = [test0(12), session('2026-07-24')];
    expect(dayKindFor(e, p, program, '2026-08-03')).toBe('test');
  });

  it('a missed test wanders to the NEXT scheduled day, never to a shifted one', () => {
    const e = [test0(12), session('2026-07-24')];
    // Test slot Mon 08-03 lapsed → Tuesday is NOT a shifted session/test…
    expect(dayKindFor(e, p, program, '2026-08-04')).toBe('easy');
    // …the next scheduled day (Wed 08-05) opens as the test instead (week 4 stretches).
    expect(dayKindFor(e, p, program, '2026-08-05')).toBe('test');
  });
});

// --- shift 48h rules (via dayKindFor) ------------------------------------------------

describe('shift-by-1 (48 h clearance, no cascade)', () => {
  it('rejects a shift landing < 48 h before the next scheduled day', () => {
    // Wed 07-08 missed → Thu 07-09 is 1 day before Fri 07-10 → no shift, easy day.
    const e = [test0(12)];
    expect(dayKindFor(e, profileWith(), program, '2026-07-09')).toBe('easy');
  });

  it('allows a shift with clearance on both sides', () => {
    // Fri 07-10 missed → Sat 07-11: 3 days after Wed-done ✓, 2 days before Mon 07-13 ✓.
    const e = [test0(12), session('2026-07-08')];
    expect(dayKindFor(e, profileWith(), program, '2026-07-11')).toBe('session');
  });

  it('rest behind is not enough — the 48 h gap BEFORE the next session must hold too', () => {
    // Days Mon/Thu/Sat (1,4,6): off-day session Fri 07-10, Sat 07-11 missed → Sun 07-12:
    // prev hard 07-10 → 2 days ✓ (boundary), but next Mon 07-13 → only 1 day ✗ → no shift.
    const p = profileWith([1, 4, 6]);
    const e = [test0(12), session('2026-07-10')];
    expect(dayKindFor(e, p, program, '2026-07-12')).toBe('easy');
  });

  it('no cascade: two days after the missed slot is an easy day again', () => {
    const p = profileWith([1, 3, 6]);
    const e = [test0(12)];
    expect(dayKindFor(e, p, program, '2026-07-13')).toBe('session'); // Mon — scheduled, not shift
    expect(dayKindFor(e, p, program, '2026-07-14')).toBe('easy'); // Tue — no cascading shifts
  });
});

// --- sessionPlan ------------------------------------------------------------------

describe('sessionPlan', () => {
  const state = (over: Partial<ProgramState>): ProgramState => ({
    variant: 'full',
    lastMT: 10,
    lastMTisSeed: false,
    bracket: 'b1',
    blockWeek: 1,
    volumeModifier: 1,
    sessionsDoneThisWeek: 0,
    consolidations: 0,
    failedTestsInRow: 0,
    goalReachedAt: null,
    currentStreak: 0,
    longestStreak: 0,
    testHistory: [],
    ...over,
  });

  it('week 1: percentages × lastMT, AMRAP last', () => {
    const plan = sessionPlan(state({}), program, 'ok');
    expect(plan).toEqual({
      kind: 'plan',
      sets: [
        { type: 'reps', reps: 6 },
        { type: 'reps', reps: 7 },
        { type: 'reps', reps: 5 },
        { type: 'reps', reps: 5 },
        { type: 'amrap' },
      ],
    });
  });

  it('applies the 0.9 volume modifier after a regen week', () => {
    const plan = sessionPlan(state({ volumeModifier: 0.9 }), program, 'ok');
    if (plan.kind !== 'plan') throw new Error('expected a plan');
    expect(plan.sets[0]).toEqual({ type: 'reps', reps: Math.round(0.6 * 10 * 0.9) });
  });

  it('deload week 4: week-3 sets × deloadVolumeFactor, AMRAP becomes a regular set', () => {
    const plan = sessionPlan(state({ blockWeek: 4 }), program, 'ok');
    if (plan.kind !== 'plan') throw new Error('expected a plan');
    expect(plan.sets).toHaveLength(5);
    expect(plan.sets.every((s) => s.type === 'reps')).toBe(true);
    // week 3 of b1 starts at 0.7 → 0.7 × 10 × 0.6 = 4.2 → 4
    expect(plan.sets[0]).toEqual({ type: 'reps', reps: 4 });
  });

  it('tired removes one middle set', () => {
    const plan = sessionPlan(state({}), program, 'tired');
    if (plan.kind !== 'plan') throw new Error('expected a plan');
    expect(plan.sets).toHaveLength(4);
    expect(plan.sets[plan.sets.length - 1]).toEqual({ type: 'amrap' }); // AMRAP survives
  });

  it('pain downgrades the day to easy without touching the kind', () => {
    expect(sessionPlan(state({}), program, 'pain')).toEqual({ kind: 'downgraded-easy' });
  });

  it('never prescribes a 0-rep set, and refuses to plan during regen', () => {
    const plan = sessionPlan(state({ lastMT: 1 }), program, 'ok');
    if (plan.kind !== 'plan') throw new Error('expected a plan');
    for (const s of plan.sets) if (s.type === 'reps') expect(s.reps).toBeGreaterThanOrEqual(1);
    expect(() => sessionPlan(state({ blockWeek: 'regen' }), program, 'ok')).toThrow(/regen/);
  });
});

// --- easyContentRange ----------------------------------------------------------------

describe('easyContentRange', () => {
  it('scales easySetFactor by lastMT with a floor of 1', () => {
    const s = { lastMT: 10 } as ProgramState;
    expect(easyContentRange(s, program)).toEqual([4, 5]);
    expect(easyContentRange({ lastMT: 1 } as ProgramState, program)).toEqual([1, 1]);
  });
});

// --- long-set practice (PRD §5) -------------------------------------------------------

describe('longSetRange', () => {
  it('scales longSetFactor (60–70%) by lastMT', () => {
    expect(longSetRange({ lastMT: 50 } as ProgramState, program)).toEqual([30, 35]);
    expect(longSetRange({ lastMT: 64 } as ProgramState, program)).toEqual([38, 45]);
  });
});

describe('longSetOffered', () => {
  // 2026-07-16 is a Thursday; the Mon–Sun week starts 2026-07-13.
  const TODAY: ISODate = '2026-07-16';
  const stateAt = (lastMT: number, lastMTisSeed = false): ProgramState =>
    ({ lastMT, lastMTisSeed }) as ProgramState;

  function easyDone(date: ISODate, easyContent: DailyEntry['easyContent']): DailyEntry {
    return entry({ date, kind: 'easy', easyContent });
  }

  it('requires lastMT >= longSetMinMT (50)', () => {
    expect(longSetOffered([], stateAt(49), program, TODAY)).toBe(false);
    expect(longSetOffered([], stateAt(50), program, TODAY)).toBe(true);
  });

  it('never offers on a seeded MT — a % of an estimate is a guess', () => {
    expect(longSetOffered([], stateAt(60, true), program, TODAY)).toBe(false);
  });

  it('hides after a completed long-set earlier the same Mon–Sun week', () => {
    const monThisWeek = easyDone('2026-07-13', 'long-set');
    expect(longSetOffered([monThisWeek], stateAt(60), program, TODAY)).toBe(false);
    // Last week's long-set does not count — the cadence resets on Monday.
    const friLastWeek = easyDone('2026-07-10', 'long-set');
    expect(longSetOffered([friLastWeek], stateAt(60), program, TODAY)).toBe(true);
  });

  it('ignores this week\'s non-long-set and non-completed entries', () => {
    const gtg = easyDone('2026-07-14', 'gtg-set');
    const abandonedLongSet = entry({
      date: '2026-07-14',
      kind: 'easy',
      easyContent: 'long-set',
      status: 'in_progress',
      completedAt: null,
    });
    expect(longSetOffered([gtg, abandonedLongSet], stateAt(60), program, TODAY)).toBe(true);
  });

  it('counts today\'s own completed long-set as still offered (date < today guard)', () => {
    // The option must not vanish mid-flow when today's entry is being completed.
    const todays = easyDone(TODAY, 'long-set');
    expect(longSetOffered([todays], stateAt(60), program, TODAY)).toBe(true);
  });

  it('never offers on a pain-degraded day', () => {
    const degraded = entry({
      date: TODAY,
      kind: 'session',
      downgradedTo: 'easy',
      status: 'in_progress',
      completedAt: null,
    });
    expect(longSetOffered([degraded], stateAt(60), program, TODAY)).toBe(false);
  });
});
