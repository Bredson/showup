// Showup — advanced statistics for the Progress screen (PRD §5, backlog pull 2026-07-17).
// Three derivations: weekly presence rhythm, feel-before trend, gate-outcome summary.
// Product filter ("minimum wystarcza"): stats visualize presence and test-gated
// progression — never rep volume, never projections, never pass/fail framing.
// RULE: pure functions only; no React/storage imports; dates passed in, never read
// from the clock. Nothing here is persisted — everything replays from DailyEntry.

import type { Feel, ISODate, Variant } from './types';
import { addDays, mondayOf } from './calendar';
import type { StreakEntry } from './streak';
import type { GateLogItem, GateOutcome } from './program';

/** Rolling window of the rhythm chart, in calendar weeks (Mon–Sun). */
export const RHYTHM_WEEKS = 12;

/** Cap of the feel-trend strip: the last N answered hard days. */
export const FEEL_TREND_POINTS = 12;

export interface WeekRhythm {
  /** Monday of the calendar week (the shared domain definition of "week"). */
  weekStart: ISODate;
  /** Completed days (any kind) inside the week, 0–7. Forgiven gaps do NOT count:
   * the bar reports presence, not streak mechanics. */
  presentDays: number;
  /** The week containing `today` — rendered as "in progress", never judged. */
  current: boolean;
}

/**
 * Days of presence per calendar week, oldest first: from the week of the first
 * entry (any status — the program exists since its founding day) up to and
 * including the week of `today`, capped to the last `RHYTHM_WEEKS` weeks.
 * Weeks without completions stay in the range as zero bars — neutral info,
 * like the cream dots of the presence calendar (no gap shaming, no target line).
 * Entries dated after `today` (foreign import, clock rollback) are ignored,
 * consistent with the other windowed derivations.
 */
export function computeWeeklyRhythm(entries: readonly StreakEntry[], today: ISODate): WeekRhythm[] {
  const past = entries.filter((e) => e.date <= today);

  let firstDate: ISODate | null = null;
  for (const e of past) if (firstDate === null || e.date < firstDate) firstDate = e.date;
  if (firstDate === null) return [];

  const completedPerWeek = new Map<ISODate, number>();
  for (const e of past) {
    if (e.status !== 'completed') continue;
    const week = mondayOf(e.date);
    completedPerWeek.set(week, (completedPerWeek.get(week) ?? 0) + 1); // one entry per day (PK)
  }

  const currentWeek = mondayOf(today);
  const weeks: WeekRhythm[] = [];
  for (let week = mondayOf(firstDate); week <= currentWeek; week = addDays(week, 7)) {
    weeks.push({
      weekStart: week,
      presentDays: completedPerWeek.get(week) ?? 0,
      current: week === currentWeek,
    });
  }
  return weeks.slice(-RHYTHM_WEEKS);
}

/** Minimal shape of an entry the feel trend needs (keeps test fixtures light). */
export interface FeelEntry {
  date: ISODate;
  status: 'in_progress' | 'completed';
  kind: 'session' | 'easy' | 'test';
  feelBefore: Feel | null;
}

export interface FeelPoint {
  date: ISODate;
  feel: Feel;
}

/**
 * The last `FEEL_TREND_POINTS` completed hard days (session/test) with an answered
 * feel check, chronological. Pain-downgraded days are INCLUDED on purpose:
 * feel='pain' is exactly the signal the trend exists to surface — the trend reads
 * the answer, never the execution.
 */
export function computeFeelTrend(entries: readonly FeelEntry[], today: ISODate): FeelPoint[] {
  return entries
    .filter(
      (e) =>
        e.date <= today &&
        e.status === 'completed' &&
        (e.kind === 'session' || e.kind === 'test') &&
        e.feelBefore !== null,
    )
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-FEEL_TREND_POINTS)
    .map((e) => ({ date: e.date, feel: e.feelBefore as Feel }));
}

/** Canonical render order of gate verdicts — celebration first, recovery last.
 * Deliberately NOT pass/fail buckets: a consolidation is not a failure (rule #3). */
export const GATE_OUTCOME_ORDER: readonly GateOutcome['type'][] = [
  'goal',
  'variant-advance',
  'new-block',
  'consolidation',
  'calibrated',
  'regen',
  'step-down',
];

export interface VariantGateSummary {
  variant: Variant;
  /** Total gate tests performed on this variant. */
  tests: number;
  /** Non-zero verdict counts, in GATE_OUTCOME_ORDER. */
  outcomes: ReadonlyArray<{ type: GateOutcome['type']; count: number }>;
}

/**
 * Per-variant aggregate of the gate log (PRD §6 success criterion: the app measures
 * its own funnel locally). Variants appear in order of their first test — the
 * user's actual ladder, not the config order.
 */
export function computeGateSummary(log: readonly GateLogItem[]): VariantGateSummary[] {
  const byVariant = new Map<Variant, Map<GateOutcome['type'], number>>();
  for (const item of log) {
    let counts = byVariant.get(item.variant);
    if (counts === undefined) {
      counts = new Map();
      byVariant.set(item.variant, counts); // Map preserves first-seen order
    }
    counts.set(item.outcome.type, (counts.get(item.outcome.type) ?? 0) + 1);
  }

  return [...byVariant.entries()].map(([variant, counts]) => {
    let tests = 0;
    for (const n of counts.values()) tests += n;
    return {
      variant,
      tests,
      outcomes: GATE_OUTCOME_ORDER.map((type) => ({ type, count: counts.get(type) ?? 0 })).filter(
        (o) => o.count > 0,
      ),
    };
  });
}
