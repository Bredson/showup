// Showup — program engine. Binding spec: docs/data-model.md §4 (rules), §6 (parameters).
// RULE: pure functions only; no React/storage imports; dates passed in, never read from the clock.
//
// Everything here is DERIVED from DailyEntry[] + UserProfile + ProgramConfig (§0: entries are
// the single source of truth; an entry's kind/variant snapshot always wins over derivation).

import type {
  DailyEntry,
  DayKind,
  Feel,
  ISODate,
  ProgramBracket,
  ProgramConfig,
  ProgramSet,
  ProgramState,
  UserProfile,
  Variant,
  Weekday,
} from './types';
import { addDays } from './calendar';
import { computeLongestStreak, computeStreak, daysBetween, toUtcMs } from './streak';

/** Pause longer than this (days since last completed entry, any kind) freezes the program → retest. */
export const PAUSE_RETEST_DAYS = 14;
/** Regeneration week after a failed test: calendar days of 'easy' before the block resumes. */
export const REGEN_DAYS = 7;
/** Scheduled session slots per block week (3 sessions/week). */
export const SLOTS_PER_WEEK = 3;
/** 0-based slot index at which the day opens as a Max Test (3rd slot of week 4 = slot 11). */
const TEST_SLOT_INDEX = 11;
/** Minimum days of rest around a shifted session (≥48 h on both sides, major #6). */
const SHIFT_REST_DAYS = 2;

// ---------------------------------------------------------------------------
// Brackets & session-day validation
// ---------------------------------------------------------------------------

/**
 * Bracket for a Max Test result. Clamps below the first bracket (ladder floor: wall with
 * MT < entry threshold still trains on the lowest bracket) and above the last (MT > 100).
 */
export function bracketFor(mt: number, program: ProgramConfig): ProgramBracket {
  const brackets = program.brackets;
  const first = brackets[0];
  const last = brackets[brackets.length - 1];
  if (first === undefined || last === undefined) throw new Error('program has no brackets');
  if (mt <= first.maxMT) return first;
  if (mt >= last.minMT) return last;
  const hit = brackets.find((b) => mt >= b.minMT && mt <= b.maxMT);
  return hit ?? last; // unreachable with a validated (adjacent, gapless) config
}

/** Onboarding rule: exactly 3 fixed session days, distinct, no two adjacent (mod 7). */
export function validateSessionDays(days: readonly Weekday[]): boolean {
  if (days.length !== 3 || new Set(days).size !== 3) return false;
  for (const a of days) {
    for (const b of days) {
      if (a === b) continue;
      const gap = (b - a + 7) % 7;
      if (gap === 1 || gap === 6) return false;
    }
  }
  return true;
}

/**
 * Validate-and-canonicalize gate shared by the onboarding builder and Settings (extract,
 * don't copy). Throws because each caller's UI disables its CTA until the days validate —
 * reaching here with bad days is a bug, not a user error. Canonical sorted order keeps
 * exports/diffs stable regardless of click order.
 */
export function canonicalSessionDays(
  days: readonly Weekday[],
  caller: 'onboarding' | 'settings',
): [Weekday, Weekday, Weekday] {
  if (!validateSessionDays(days)) {
    throw new Error(`${caller}: invalid session days (need 3 distinct, non-adjacent)`);
  }
  // Tuple cast is safe: validateSessionDays just proved length === 3.
  return [...days].sort((a, b) => a - b) as [Weekday, Weekday, Weekday];
}

/**
 * Profile with changed session days (Settings, PRD §2 "requiz"). No schedule history is
 * persisted — derivation reinterprets the past window with the new days, which moves the
 * in-block position by at most ±1 slot (slots pass whether completed or lapsed) while
 * entry snapshots stay untouched.
 */
export function withSessionDays(profile: UserProfile, days: readonly Weekday[]): UserProfile {
  return { ...profile, sessionDays: canonicalSessionDays(days, 'settings') };
}

function weekdayOf(date: ISODate): Weekday {
  return new Date(toUtcMs(date)).getUTCDay() as Weekday;
}

// ---------------------------------------------------------------------------
// Onboarding: first Max Test (data-model §4, major #10)
// ---------------------------------------------------------------------------

export interface OnboardingAttempt {
  variant: Variant;
  result: number;
}

export type OnboardingStep =
  | { kind: 'attempt'; variant: Variant }
  | { kind: 'done'; variant: Variant; lastMT: number; lastMTisSeed: boolean };

/** Entry threshold for training a variant ('full' has its own, lower bar — major #5). */
function entryMinMT(variant: Variant, program: ProgramConfig): number {
  return variant === 'full' ? program.fullEntryMinMT : program.variantEntryMinMT;
}

function easierVariant(variant: Variant, program: ProgramConfig): Variant | null {
  const i = program.variants.indexOf(variant);
  const easier = program.variants[i - 1];
  return easier ?? null;
}

function harderVariant(variant: Variant, program: ProgramConfig): Variant | null {
  const i = program.variants.indexOf(variant);
  if (i === -1) return null;
  const harder = program.variants[i + 1];
  return harder ?? null;
}

/**
 * Top-down cascade: start at 'full'; below its threshold → ONE more real attempt, one step
 * easier; at most 2 real attempts total. If the second is also below threshold, the remaining
 * variants are ESTIMATED (seed factor applied downwards) via resolveOnboardingResult.
 */
export function onboardingNextStep(
  attempts: readonly OnboardingAttempt[],
  program: ProgramConfig,
): OnboardingStep {
  const last = attempts[attempts.length - 1];
  if (last === undefined) return { kind: 'attempt', variant: 'full' };
  if (attempts.length === 1 && last.result < entryMinMT(last.variant, program)) {
    const easier = easierVariant(last.variant, program);
    if (easier !== null) return { kind: 'attempt', variant: easier };
  }
  return { kind: 'done', ...resolveOnboardingResult(last.variant, last.result, program) };
}

/**
 * Resolves the SINGLE stored onboarding test entry (variant + result of the last real attempt)
 * into the starting program position. Below threshold → walk down the ladder estimating
 * MT = round(result / variantSeedFactor) per step (seed factor in reverse); first variant that
 * clears the bar wins. Ladder floor: 'wall' trains regardless (bracketFor clamps the bracket).
 */
export function resolveOnboardingResult(
  variant: Variant,
  result: number,
  program: ProgramConfig,
): { variant: Variant; lastMT: number; lastMTisSeed: boolean } {
  if (result >= entryMinMT(variant, program)) {
    return { variant, lastMT: result, lastMTisSeed: false };
  }
  let v = variant;
  let mt = result;
  for (;;) {
    const easier = easierVariant(v, program);
    if (easier === null) return { variant: v, lastMT: Math.max(1, mt), lastMTisSeed: v !== variant };
    v = easier;
    mt = Math.round(mt / program.variantSeedFactor);
    if (mt >= entryMinMT(v, program)) return { variant: v, lastMT: mt, lastMTisSeed: true };
  }
}

// ---------------------------------------------------------------------------
// Test gate (data-model §4 — applied after every completed, non-downgraded test)
// ---------------------------------------------------------------------------

/** Slice of ProgramState the gate folds over (position fields are derived separately). */
interface GateState {
  variant: Variant;
  lastMT: number;
  lastMTisSeed: boolean;
  volumeModifier: 1 | 0.9;
  consolidations: number;
  failedTestsInRow: number;
  goalReachedAt: ISODate | null;
}

/**
 * Gate verdict, reported by the gate itself at the moment it runs — the SINGLE source
 * of truth for the done-screen copy and the block-history funnel (PRD §6). Priority:
 * goal > variant-advance > branch outcome (a graduation overrides the block it seated).
 */
export type GateOutcome =
  | { type: 'goal' } // first 100+ on full — celebration (program continues)
  | { type: 'variant-advance'; variant: Variant } // graduate to a harder variant (seeded MT)
  | { type: 'calibrated' } // first real test on a seeded variant — block seated, no judgement
  | { type: 'step-down' } // 2nd failed test → easier bracket/variant + regen week
  | { type: 'regen' } // failed test → regeneration week, then repeat at 0.9
  | { type: 'consolidation' } // small improvement → repeat block with better MT (framing: normal)
  | { type: 'new-block' }; // clear improvement → next block

interface GateResult {
  state: GateState;
  /** First day of the new block (day after the test, or after the regen week). */
  blockAnchor: ISODate;
  /** Last day of the regen week ('easy' days), or null when no regen was triggered. */
  regenUntil: ISODate | null;
  outcome: GateOutcome;
}

export function applyGate(
  newMT: number,
  date: ISODate,
  prev: GateState,
  program: ProgramConfig,
): GateResult {
  const s: GateState = { ...prev };
  let regenUntil: ISODate | null = null;
  let blockAnchor = addDays(date, 1);
  let outcome: GateOutcome;

  const goalNow = s.variant === 'full' && newMT >= 100 && s.goalReachedAt === null;
  if (goalNow) {
    s.goalReachedAt = date; // minor #16 — program continues past the goal
  }

  if (s.lastMTisSeed) {
    // Fresh calibration: the first real test on a seeded variant just seats the block —
    // no consolidation/failure accounting (the seed was an estimate, not a result).
    s.lastMT = newMT;
    s.lastMTisSeed = false;
    s.volumeModifier = 1;
    outcome = { type: 'calibrated' };
  } else if (
    newMT >= (1 + program.testGateImprovement) * s.lastMT ||
    bracketFor(newMT, program).id !== bracketFor(s.lastMT, program).id
  ) {
    // New block, table ALWAYS per bracketFor(newMT) (blocker #3) — this branch also
    // re-seats a big drop into its real (lower) bracket instead of punishing it.
    s.lastMT = newMT;
    s.volumeModifier = 1;
    s.consolidations = 0;
    s.failedTestsInRow = 0;
    outcome = { type: 'new-block' };
  } else if (newMT > s.lastMT) {
    // Consolidation: repeat the block with the slightly better MT (framing: normal).
    s.lastMT = newMT;
    s.volumeModifier = 1;
    s.consolidations += 1;
    s.failedTestsInRow = 0;
    outcome = { type: 'consolidation' };
  } else {
    // Failed test (newMT <= lastMT): lastMT stays; regen week, then repeat at 0.9 (minor #14).
    s.failedTestsInRow += 1;
    s.volumeModifier = 0.9;
    outcome = { type: 'regen' };
    if (s.failedTestsInRow >= 2) {
      // + UI prompt about sleep/soreness (copy lives in i18n). At the ladder floor
      // stepDown changes nothing — the honest verdict is still 'regen', not 'step-down'.
      if (stepDown(s, newMT, program)) outcome = { type: 'step-down' };
      s.volumeModifier = 1;
      s.failedTestsInRow = 0;
      s.consolidations = 0;
    }
    regenUntil = addDays(date, REGEN_DAYS);
    blockAnchor = addDays(regenUntil, 1);
  }

  // Variant graduation (blocker #1) — overrides whatever block the branches above seated.
  if (s.variant !== 'full' && newMT >= program.variantGraduateMT) {
    const harder = harderVariant(s.variant, program);
    if (harder !== null) {
      s.variant = harder;
      s.lastMT = Math.max(1, Math.round(program.variantSeedFactor * newMT));
      s.lastMTisSeed = true; // "your new max will be lower — that's normal" (i18n copy)
      s.volumeModifier = 1;
      s.consolidations = 0;
      s.failedTestsInRow = 0;
      regenUntil = null;
      blockAnchor = addDays(date, 1);
      outcome = { type: 'variant-advance', variant: harder };
    }
  }

  if (goalNow) outcome = { type: 'goal' }; // announcement priority: goal wins over everything

  return { state: s, blockAnchor, regenUntil, outcome };
}

/**
 * Two failed tests in a row: step down a bracket, or a variant when already on the lowest.
 * Returns true when something actually changed (false at the ladder floor).
 */
function stepDown(s: GateState, newMT: number, program: ProgramConfig): boolean {
  const bracket = bracketFor(s.lastMT, program);
  const idx = program.brackets.findIndex((b) => b.id === bracket.id);
  const prevBracket = program.brackets[idx - 1];
  if (prevBracket !== undefined) {
    // Synthetic value, not a real result → seed, so the next test calibrates freshly.
    s.lastMT = prevBracket.maxMT;
    s.lastMTisSeed = true;
    return true;
  }
  const easier = easierVariant(s.variant, program);
  if (easier !== null) {
    s.variant = easier;
    s.lastMT = Math.max(1, Math.round(newMT / program.variantSeedFactor));
    s.lastMTisSeed = true;
    return true;
  }
  // wall + lowest bracket: nothing easier exists — stay put (ladder floor).
  return false;
}

// ---------------------------------------------------------------------------
// Position derivation: scheduled slots since the block anchor (blocker #4)
// ---------------------------------------------------------------------------

interface Derived {
  state: ProgramState;
  /** 0-based index of the slot the user is currently in (= number of slots that passed). */
  slotIndex: number;
  blockAnchor: ISODate;
  regenUntil: ISODate | null;
  lastCompletedDate: ISODate | null;
  /** True when the last completed entry is > PAUSE_RETEST_DAYS ago → position frozen, retest. */
  paused: boolean;
}

function isCompleted(e: DailyEntry): boolean {
  return e.status === 'completed';
}

/** A completed test that carries a gate-relevant result (a pain-downgraded test wanders instead). */
export function isGateTest(e: DailyEntry): e is DailyEntry & { testResult: number } {
  return e.kind === 'test' && isCompleted(e) && e.downgradedTo === null && e.testResult !== null;
}

/** Scheduled session days in [from, to], oldest first. */
function scheduledDays(from: ISODate, to: ISODate, sessionDays: readonly Weekday[]): ISODate[] {
  const out: ISODate[] = [];
  if (daysBetween(from, to) < 0) return out;
  for (let d = from; daysBetween(d, to) >= 0; d = addDays(d, 1)) {
    if (sessionDays.includes(weekdayOf(d))) out.push(d);
  }
  return out;
}

/** One gate test with the verdict the gate reported at the time — a funnel row (PRD §6). */
export interface GateLogItem {
  date: ISODate;
  /** Variant the test was performed on (entry snapshot). */
  variant: Variant;
  result: number;
  outcome: GateOutcome;
}

interface Replay {
  gate: GateState;
  blockAnchor: ISODate;
  regenUntil: ISODate | null;
  testHistory: ProgramState['testHistory'];
  log: GateLogItem[];
}

/**
 * Gate replay — the ONLY fold over completed tests (derive and computeGateLog both
 * use it; a second copy of the pause-seed / onboarding-cascade rules would drift).
 */
function replayGates(sorted: readonly DailyEntry[], program: ProgramConfig): Replay {
  const tests = sorted.filter(isGateTest);
  const first = tests[0];
  if (first === undefined) {
    throw new Error('computeProgram requires the onboarding Max Test entry (data-model §4)');
  }

  // Onboarding entry stores the LAST REAL attempt; the cascade resolves the training start.
  let gate: GateState = {
    ...resolveOnboardingResult(first.variant, first.testResult, program),
    volumeModifier: 1,
    consolidations: 0,
    failedTestsInRow: 0,
    goalReachedAt: first.variant === 'full' && first.testResult >= 100 ? first.date : null,
  };
  let blockAnchor = addDays(first.date, 1);
  let regenUntil: ISODate | null = null;

  const completedAsc = sorted.filter(isCompleted);
  const testHistory: ProgramState['testHistory'] = [
    { date: first.date, variant: first.variant, result: first.testResult },
  ];
  if (gate.lastMTisSeed) {
    testHistory.push({ date: first.date, variant: gate.variant, result: gate.lastMT, seed: true });
  }
  const log: GateLogItem[] = [
    {
      date: first.date,
      variant: first.variant,
      result: first.testResult,
      // The founding test seats the plan (no "before" state to judge against) — unless
      // it already hits the goal: 100+ on full at onboarding IS the celebration (PRD §3).
      outcome: gate.goalReachedAt !== null ? { type: 'goal' } : { type: 'calibrated' },
    },
  ];

  for (const t of tests.slice(1)) {
    // A test after a >14-day pause gates against a stale MT — treat it as a seed so the
    // gate takes the calibration path: its result SEATS the new block (§4 pause rule).
    const prevCompleted = completedAsc.filter((e) => e.date < t.date).pop();
    if (prevCompleted !== undefined && daysBetween(prevCompleted.date, t.date) > PAUSE_RETEST_DAYS) {
      gate = { ...gate, lastMTisSeed: true };
    }
    const r = applyGate(t.testResult, t.date, gate, program);
    gate = r.state;
    blockAnchor = r.blockAnchor;
    regenUntil = r.regenUntil;
    testHistory.push({ date: t.date, variant: t.variant, result: t.testResult });
    if (gate.lastMTisSeed) {
      // Graduation / step-down left a seeded MT — record it for chart continuity.
      testHistory.push({ date: t.date, variant: gate.variant, result: gate.lastMT, seed: true });
    }
    log.push({ date: t.date, variant: t.variant, result: t.testResult, outcome: r.outcome });
  }

  return { gate, blockAnchor, regenUntil, testHistory, log };
}

/**
 * Core fold: replays completed tests through the gate, then derives the in-block position
 * from scheduled slots since the anchor. A slot passes when its day is over (completed OR
 * lapsed — "the slot passes, the week doesn't break"), except yesterday's slot while a
 * shift window is still open today.
 */
function derive(
  entries: readonly DailyEntry[],
  profile: UserProfile,
  program: ProgramConfig,
  today: ISODate,
): Derived {
  const sorted = [...entries].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  const { gate, blockAnchor, regenUntil, testHistory } = replayGates(sorted, program);
  const completedAsc = sorted.filter(isCompleted);
  const lastCompleted = completedAsc[completedAsc.length - 1];
  const lastCompletedDate = lastCompleted?.date ?? null;
  const paused =
    lastCompletedDate !== null && daysBetween(lastCompletedDate, today) > PAUSE_RETEST_DAYS;

  const inRegen = regenUntil !== null && daysBetween(today, regenUntil) >= 0;
  const slotsFrom = regenUntil !== null && daysBetween(regenUntil, today) > 0
    ? addDays(regenUntil, 1)
    : blockAnchor;

  // Pause freeze: slots stop accruing PAUSE_RETEST_DAYS after the last completed entry.
  const horizon =
    paused && lastCompletedDate !== null ? addDays(lastCompletedDate, PAUSE_RETEST_DAYS) : today;
  const slotIndex = inRegen ? 0 : countPassedSlots(slotsFrom, horizon, sorted, profile, today);

  const blockWeek: ProgramState['blockWeek'] = inRegen
    ? 'regen'
    : ((Math.min(4, Math.floor(slotIndex / SLOTS_PER_WEEK) + 1)) as 1 | 2 | 3 | 4);

  const sessionsDoneThisWeek = inRegen
    ? 0
    : countSessionsThisWeek(slotsFrom, slotIndex, sorted, profile, today);

  const state: ProgramState = {
    variant: gate.variant,
    lastMT: gate.lastMT,
    lastMTisSeed: gate.lastMTisSeed,
    bracket: bracketFor(gate.lastMT, program).id, // ALWAYS derived (minor #15)
    blockWeek,
    volumeModifier: gate.volumeModifier,
    sessionsDoneThisWeek,
    consolidations: gate.consolidations,
    failedTestsInRow: gate.failedTestsInRow,
    goalReachedAt: gate.goalReachedAt,
    currentStreak: computeStreak(sorted, today),
    longestStreak: computeLongestStreak(sorted),
    testHistory,
  };

  return { state, slotIndex, blockAnchor: slotsFrom, regenUntil, lastCompletedDate, paused };
}

function countPassedSlots(
  from: ISODate,
  horizon: ISODate,
  sorted: readonly DailyEntry[],
  profile: UserProfile,
  today: ISODate,
): number {
  const byDate = new Map(sorted.map((e) => [e.date, e]));
  const todayEntry = byDate.get(today);
  const shiftFulfilledToday =
    todayEntry !== undefined &&
    isCompleted(todayEntry) &&
    todayEntry.downgradedTo === null &&
    todayEntry.kind === 'session';
  const days = scheduledDays(from, horizon, profile.sessionDays);
  let passed = 0;
  for (const [i, d] of days.entries()) {
    const entry = byDate.get(d);
    const done = entry !== undefined && isCompleted(entry);
    if (daysBetween(d, today) === 0) {
      if (done) passed += 1; // today's slot only passes once completed
    } else if (
      daysBetween(d, today) === 1 &&
      !done &&
      !shiftFulfilledToday && // once the shifted session is done, the slot has passed
      i < TEST_SLOT_INDEX && // tests never shift (major #7)
      shiftWindowOpen(d, today, sorted, profile)
    ) {
      // Yesterday's slot is still open: it can be fulfilled today via the 1-day shift.
    } else {
      passed += 1; // completed or lapsed — either way the program flows forward
    }
  }
  return passed;
}

/** 48 h clearance on both sides of the shifted day (major #6); no cascading. */
function shiftWindowOpen(
  missedDay: ISODate,
  shiftedDay: ISODate,
  sorted: readonly DailyEntry[],
  profile: UserProfile,
): boolean {
  if (sessionDaysInclude(profile, shiftedDay)) return false; // scheduled day: no shift needed
  const prevHard = [...sorted]
    .reverse()
    .find(
      (e) =>
        isCompleted(e) &&
        e.downgradedTo === null &&
        (e.kind === 'session' || e.kind === 'test') &&
        daysBetween(e.date, shiftedDay) > 0,
    );
  if (prevHard !== undefined && daysBetween(prevHard.date, shiftedDay) < SHIFT_REST_DAYS) return false;
  const next = nextScheduledDayAfter(shiftedDay, profile);
  if (daysBetween(shiftedDay, next) < SHIFT_REST_DAYS) return false;
  return daysBetween(missedDay, shiftedDay) === 1;
}

function sessionDaysInclude(profile: UserProfile, date: ISODate): boolean {
  return profile.sessionDays.includes(weekdayOf(date));
}

function nextScheduledDayAfter(date: ISODate, profile: UserProfile): ISODate {
  for (let d = addDays(date, 1); ; d = addDays(d, 1)) {
    if (sessionDaysInclude(profile, d)) return d;
  }
}

/** Completed sessions/tests inside the current week's slot window (display only). */
function countSessionsThisWeek(
  anchor: ISODate,
  slotIndex: number,
  sorted: readonly DailyEntry[],
  profile: UserProfile,
  today: ISODate,
): number {
  const weekStartSlot = Math.min(3, Math.floor(slotIndex / SLOTS_PER_WEEK)) * SLOTS_PER_WEEK;
  // Cheap horizon: slots live on scheduled days, ≤ 7 calendar days per 3 slots + shift slack.
  const days = scheduledDays(anchor, today, profile.sessionDays);
  const windowStart = days[weekStartSlot];
  if (windowStart === undefined) return 0;
  return sorted.filter(
    (e) =>
      isCompleted(e) &&
      e.downgradedTo === null &&
      (e.kind === 'session' || e.kind === 'test') &&
      daysBetween(windowStart, e.date) >= 0 &&
      daysBetween(e.date, today) >= 0,
  ).length;
}

// ---------------------------------------------------------------------------
// Public API: state, day kind, session plan
// ---------------------------------------------------------------------------

export function computeProgram(
  entries: readonly DailyEntry[],
  profile: UserProfile,
  program: ProgramConfig,
  today: ISODate,
): ProgramState {
  return derive(entries, profile, program, today).state;
}

/**
 * The program's own funnel (PRD §6): every gate test, chronologically, with the verdict
 * the gate reported at the time. [] before the founding test — screens render pre-founding
 * states gracefully instead of throwing like computeProgram (founding-day lesson).
 */
export function computeGateLog(
  entries: readonly DailyEntry[],
  program: ProgramConfig,
): readonly GateLogItem[] {
  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));
  if (!sorted.some(isGateTest)) return [];
  return replayGates(sorted, program).log;
}

/**
 * What kind of day is `today`? (data-model §4)
 * Snapshot wins → pause retest → regen easy → scheduled/shifted session (slot ≥ 11 → test) → easy.
 */
export function dayKindFor(
  entries: readonly DailyEntry[],
  profile: UserProfile,
  program: ProgramConfig,
  today: ISODate,
): DayKind {
  const existing = entries.find((e) => e.date === today);
  if (existing !== undefined) return existing.kind; // snapshot wins (§0)

  const d = derive(entries, profile, program, today);
  if (d.paused) return 'test'; // pause > 14 days → retest seats the new block
  if (d.state.blockWeek === 'regen') return 'easy';

  if (sessionDaysInclude(profile, today)) {
    return d.slotIndex >= TEST_SLOT_INDEX ? 'test' : 'session';
  }
  const yesterday = addDays(today, -1);
  const sorted = [...entries].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  if (
    sessionDaysInclude(profile, yesterday) &&
    daysBetween(d.blockAnchor, yesterday) >= 0 && // yesterday was a real slot (not regen/pre-block)
    !entries.some((e) => e.date === yesterday && isCompleted(e)) &&
    d.slotIndex < TEST_SLOT_INDEX && // a missed TEST wanders to the next scheduled day instead
    shiftWindowOpen(yesterday, today, sorted, profile)
  ) {
    return 'session';
  }
  return 'easy';
}

/** 'amrap' = AMRAP-1: as many reps as possible MINUS ONE — never to failure (data-model §6). */
export type PlannedSet = { type: 'reps'; reps: number } | { type: 'amrap' };

export type SessionPlan =
  | { kind: 'plan'; sets: PlannedSet[] }
  | { kind: 'downgraded-easy' }; // feel='pain' → execute as easy; entry keeps its kind (§1)

/**
 * Session plan, in spec order: base week table → deload transform → feel adjustment (minor #11).
 * Week 4 = week-3 sets × deloadVolumeFactor, AMRAP replaced by a regular set (no max effort).
 */
export function sessionPlan(state: ProgramState, program: ProgramConfig, feel: Feel): SessionPlan {
  if (feel === 'pain') return { kind: 'downgraded-easy' };
  if (state.blockWeek === 'regen') {
    throw new Error('sessionPlan called during a regen week — regen days are easy days');
  }

  const bracket = program.brackets.find((b) => b.id === state.bracket);
  if (bracket === undefined) throw new Error(`unknown bracket "${state.bracket}"`);
  const week = state.blockWeek === 4 ? 3 : state.blockWeek;
  const raw = bracket.weeks[week - 1];
  if (raw === undefined || !('sets' in raw)) {
    throw new Error(`bracket "${bracket.id}" week ${week} has no sets table`);
  }

  const deload = state.blockWeek === 4;
  // Single final rounding (pct × MT × modifiers → round once); may differ by ±1 rep from
  // a round-per-step reading of §4 — deliberate, keeps tiny plans from collapsing to 0.
  const factor = state.lastMT * state.volumeModifier * (deload ? program.deloadVolumeFactor : 1);
  const sets: PlannedSet[] = [];
  for (const s of raw.sets as ProgramSet[]) {
    if (s === 'A') {
      if (deload) {
        // AMRAP becomes a regular set on deload — mirror the preceding set's size.
        const prevSet = sets[sets.length - 1];
        sets.push({ type: 'reps', reps: prevSet?.type === 'reps' ? prevSet.reps : 1 });
      } else {
        sets.push({ type: 'amrap' });
      }
    } else {
      sets.push({ type: 'reps', reps: Math.max(1, Math.round(s * factor)) });
    }
  }

  if (feel === 'tired') sets.splice(Math.floor(sets.length / 2), 1); // drop one middle set

  return { kind: 'plan', sets };
}

/** Easy-day GtG set size range: easySetFactor × lastMT (seeded lastMT is fine too). */
export function easyContentRange(state: ProgramState, program: ProgramConfig): [number, number] {
  const [lo, hi] = program.easySetFactor;
  return [Math.max(1, Math.round(lo * state.lastMT)), Math.max(1, Math.round(hi * state.lastMT))];
}
