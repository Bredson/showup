// Showup — daily loop glue: step machine and the comeback interstitial.
// Source of truth: docs/prd.md §4, docs/data-model.md §1/§4.
// RULE: pure functions only; no React/storage/i18n imports; dates passed in, never read from the clock.

import type { DailyEntry, DayKind, ISODate, ISODateTime, Variant } from './types';
import { daysBetween } from './streak';

/**
 * The entry created on the FIRST open of a day — `kind` and `variant` are permanent
 * snapshots from this moment on (data-model §0). Deterministic for a given date/state,
 * so a StrictMode double-boot writing it twice is harmless (same record, same key).
 */
export function openDayEntry(
  date: ISODate,
  kind: DayKind,
  variant: Variant,
  now: ISODateTime,
): DailyEntry {
  return {
    date,
    kind,
    variant,
    feelBefore: null,
    downgradedTo: null,
    status: 'in_progress',
    sets: null,
    testResult: null,
    easyContent: null,
    reflection: null,
    completedAt: null,
    updatedAt: now,
  };
}

// ---------------------------------------------------------------------------
// Step machine — the ONLY place that knows step order (code-style: LOOP_STEPS rule)
// ---------------------------------------------------------------------------

export type LoopStep = 'feel' | 'warmup' | 'sets' | 'test' | 'easy' | 'reflection' | 'done';

const SESSION_STEPS = ['feel', 'sets', 'reflection', 'done'] as const;
const TEST_STEPS = ['feel', 'warmup', 'test', 'reflection', 'done'] as const;
const EASY_STEPS = ['easy', 'done'] as const;
/** Pain degradation: the feel answer is kept, then the day runs as an easy day (§1). */
const DOWNGRADED_STEPS = ['feel', 'easy', 'done'] as const;

export function stepsFor(kind: DayKind, downgraded: boolean): readonly LoopStep[] {
  if (kind === 'easy') return EASY_STEPS;
  if (downgraded) return DOWNGRADED_STEPS;
  return kind === 'test' ? TEST_STEPS : SESSION_STEPS;
}

export function nextStep(kind: DayKind, downgraded: boolean, current: LoopStep): LoopStep {
  const steps = stepsFor(kind, downgraded);
  const idx = steps.indexOf(current);
  if (idx === -1) throw new Error(`step "${current}" is not part of a ${downgraded ? 'downgraded ' : ''}${kind} day`);
  const next = steps[idx + 1];
  return next ?? 'done';
}

/**
 * Where to resume an in_progress entry after a reload. Derived purely from what the
 * entry already recorded — the plan is recomputable, so no step state is persisted
 * (data-model §7 #13). A completed entry always resumes at 'done'.
 *
 * `plannedSetCount` — length of today's recomputed session plan; needed to tell a
 * partially recorded session (resume mid-sets) from a finished one. Pass null when
 * unknowable (feel not answered yet) or irrelevant (easy/test days).
 */
export function resumeStep(entry: DailyEntry, plannedSetCount: number | null): LoopStep {
  if (entry.status === 'completed') return 'done';
  const downgraded = entry.downgradedTo === 'easy';
  if (entry.kind === 'easy' || downgraded) {
    return entry.kind !== 'easy' && entry.feelBefore === null ? 'feel' : 'easy';
  }
  if (entry.feelBefore === null) return 'feel';
  if (entry.kind === 'test') {
    // The warmup screen costs nothing to re-see; a recorded result moves on to reflection.
    return entry.testResult === null ? 'warmup' : 'reflection';
  }
  const done = entry.sets?.length ?? 0;
  return plannedSetCount === null || done < plannedSetCount ? 'sets' : 'reflection';
}

// Gate outcome classification moved INTO the gate itself: `applyGate` reports its
// verdict and `computeGateLog` (program.ts) exposes the full history — comparing
// ProgramStates here was a heuristic reverse-engineering a decision already made.

// ---------------------------------------------------------------------------
// Comeback interstitial (PRD §4: missed day → self-compassion, never reproach)
// ---------------------------------------------------------------------------

/**
 * Days with no entry between the most recent entry BEFORE `today` and `today` itself.
 * An entry is created on every app open, so an open-without-completing is not absence.
 * No past entries → 0 (a fresh profile has nothing to "return" to).
 */
export function missedDaysBefore(
  entries: readonly Pick<DailyEntry, 'date'>[],
  today: ISODate,
): number {
  let last: ISODate | null = null;
  for (const e of entries) {
    if (e.date < today && (last === null || e.date > last)) last = e.date;
  }
  if (last === null) return 0;
  return daysBetween(last, today) - 1;
}

/**
 * Which interstitial variant to show:
 * - 'none'     — no missed days (or nothing to return to)
 * - 'oneDay'   — exactly 1 missed day AND the streak is still alive. The copy promises
 *                "your streak is safe" — it must never lie: after open-without-completing
 *                plus a missed day the streak may already be 0, so a dead streak falls
 *                through to the always-true multiDay message.
 * - 'multiDay' — every other return (never mentions the count — a number reads as reproach)
 */
export type ComebackKind = 'none' | 'oneDay' | 'multiDay';

export function comebackKind(missedDays: number, currentStreak: number): ComebackKind {
  if (missedDays <= 0) return 'none';
  return missedDays === 1 && currentStreak > 0 ? 'oneDay' : 'multiDay';
}
