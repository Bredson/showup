// Tests for the Progress-screen statistics derivations (stats.ts).
// Fixture convention: START = '2026-07-06' (a Monday), explicit dates everywhere.

import { describe, expect, it } from 'vitest';
import type { GateLogItem } from './program';
import type { StreakEntry } from './streak';
import {
  computeFeelTrend,
  computeGateSummary,
  computeWeeklyRhythm,
  FEEL_TREND_POINTS,
  RHYTHM_WEEKS,
  type FeelEntry,
} from './stats';
import type { Feel, ISODate } from './types';

// ---------------------------------------------------------------------------
// computeWeeklyRhythm
// ---------------------------------------------------------------------------

function presence(date: string, status: StreakEntry['status'] = 'completed'): StreakEntry {
  return { date: date as ISODate, status };
}

describe('computeWeeklyRhythm', () => {
  it('returns [] when there are no entries', () => {
    expect(computeWeeklyRhythm([], '2026-07-16' as ISODate)).toEqual([]);
  });

  it('counts completed days per Mon-Sun week, oldest first', () => {
    const entries = [
      presence('2026-07-06'), // Mon, week 1
      presence('2026-07-08'), // Wed, week 1
      presence('2026-07-12'), // Sun, week 1 — still the same week
      presence('2026-07-13'), // Mon, week 2
    ];
    const weeks = computeWeeklyRhythm(entries, '2026-07-16' as ISODate);
    expect(weeks).toEqual([
      { weekStart: '2026-07-06', presentDays: 3, current: false },
      { weekStart: '2026-07-13', presentDays: 1, current: true },
    ]);
  });

  it('ignores in_progress entries for the count but not for the range start', () => {
    const entries = [
      presence('2026-07-06', 'in_progress'), // founding week exists even with zero completions
      presence('2026-07-14'),
    ];
    const weeks = computeWeeklyRhythm(entries, '2026-07-16' as ISODate);
    expect(weeks).toEqual([
      { weekStart: '2026-07-06', presentDays: 0, current: false },
      { weekStart: '2026-07-13', presentDays: 1, current: true },
    ]);
  });

  it('keeps fully empty weeks in the range as zero bars', () => {
    const entries = [presence('2026-07-06'), presence('2026-07-20')]; // week 2 skipped entirely
    const weeks = computeWeeklyRhythm(entries, '2026-07-22' as ISODate);
    expect(weeks.map((w) => w.presentDays)).toEqual([1, 0, 1]);
    expect(weeks[1]).toEqual({ weekStart: '2026-07-13', presentDays: 0, current: false });
  });

  it('marks only the week containing today as current, even with no entry this week', () => {
    const weeks = computeWeeklyRhythm([presence('2026-07-06')], '2026-07-15' as ISODate);
    expect(weeks.map((w) => w.current)).toEqual([false, true]);
    expect(weeks[1]?.presentDays).toBe(0);
  });

  it('caps the window to the last RHYTHM_WEEKS weeks', () => {
    // First entry 20 weeks before today's week.
    const entries = [presence('2026-07-06'), presence('2026-11-18')]; // Wed, 19 weeks later
    const weeks = computeWeeklyRhythm(entries, '2026-11-19' as ISODate);
    expect(weeks).toHaveLength(RHYTHM_WEEKS);
    // The founding week fell out of the window; the last week is today's.
    expect(weeks[0]?.weekStart).toBe('2026-08-31'); // 11 weeks before the week of Nov 16
    expect(weeks[weeks.length - 1]).toEqual({
      weekStart: '2026-11-16',
      presentDays: 1,
      current: true,
    });
  });

  it('ignores entries dated after today (foreign import, clock rollback)', () => {
    const entries = [presence('2026-07-06'), presence('2026-08-03')];
    const weeks = computeWeeklyRhythm(entries, '2026-07-16' as ISODate);
    expect(weeks).toHaveLength(2); // weeks of Jul 6 and Jul 13 only
    expect(weeks.every((w) => w.weekStart <= '2026-07-13')).toBe(true);
  });

  it('Sunday belongs to the week of the preceding Monday (wrap branch)', () => {
    const weeks = computeWeeklyRhythm([presence('2026-07-12')], '2026-07-12' as ISODate); // Sun
    expect(weeks).toEqual([{ weekStart: '2026-07-06', presentDays: 1, current: true }]);
  });
});

// ---------------------------------------------------------------------------
// computeFeelTrend
// ---------------------------------------------------------------------------

function feelDay(
  date: string,
  kind: FeelEntry['kind'],
  feel: Feel | null,
  status: FeelEntry['status'] = 'completed',
): FeelEntry {
  return { date: date as ISODate, kind, feelBefore: feel, status };
}

describe('computeFeelTrend', () => {
  const TODAY = '2026-07-16' as ISODate;

  it('returns [] when no hard day has an answered feel', () => {
    const entries = [
      feelDay('2026-07-06', 'test', null), // hard day, feel never answered
      feelDay('2026-07-07', 'easy', null), // easy days have no feel check
    ];
    expect(computeFeelTrend(entries, TODAY)).toEqual([]);
  });

  it('collects completed session/test days chronologically, skipping easy days', () => {
    const entries = [
      feelDay('2026-07-10', 'session', 'tired'), // out of order on purpose
      feelDay('2026-07-06', 'test', 'fresh'),
      feelDay('2026-07-08', 'session', 'ok'),
      feelDay('2026-07-09', 'easy', null),
    ];
    expect(computeFeelTrend(entries, TODAY)).toEqual([
      { date: '2026-07-06', feel: 'fresh' },
      { date: '2026-07-08', feel: 'ok' },
      { date: '2026-07-10', feel: 'tired' },
    ]);
  });

  it('includes pain answers — the downgraded day is exactly the signal', () => {
    const entries = [feelDay('2026-07-08', 'session', 'pain')];
    expect(computeFeelTrend(entries, TODAY)).toEqual([{ date: '2026-07-08', feel: 'pain' }]);
  });

  it('skips in_progress days and days after today', () => {
    const entries = [
      feelDay('2026-07-08', 'session', 'ok', 'in_progress'),
      feelDay('2026-07-20', 'session', 'ok'), // future — foreign import
    ];
    expect(computeFeelTrend(entries, TODAY)).toEqual([]);
  });

  it('keeps only the last FEEL_TREND_POINTS answers', () => {
    const entries = Array.from({ length: FEEL_TREND_POINTS + 3 }, (_, i) =>
      feelDay(`2026-06-${String(i + 1).padStart(2, '0')}`, 'session', 'ok'),
    );
    const trend = computeFeelTrend(entries, TODAY);
    expect(trend).toHaveLength(FEEL_TREND_POINTS);
    expect(trend[0]?.date).toBe('2026-06-04'); // the 3 oldest dropped
  });
});

// ---------------------------------------------------------------------------
// computeGateSummary
// ---------------------------------------------------------------------------

function gate(date: string, variant: GateLogItem['variant'], result: number, outcome: GateLogItem['outcome']): GateLogItem {
  return { date: date as ISODate, variant, result, outcome };
}

describe('computeGateSummary', () => {
  it('returns [] for an empty log (pre-founding)', () => {
    expect(computeGateSummary([])).toEqual([]);
  });

  it('groups by variant in first-seen order with per-outcome counts', () => {
    const log = [
      gate('2026-07-06', 'knee', 12, { type: 'new-block' }),
      gate('2026-08-03', 'knee', 14, { type: 'consolidation' }),
      gate('2026-08-31', 'knee', 22, { type: 'variant-advance', variant: 'full' }),
      gate('2026-09-28', 'full', 15, { type: 'calibrated' }),
      gate('2026-10-26', 'full', 14, { type: 'regen' }),
      gate('2026-11-02', 'full', 20, { type: 'new-block' }),
    ];
    expect(computeGateSummary(log)).toEqual([
      {
        variant: 'knee',
        tests: 3,
        outcomes: [
          { type: 'variant-advance', count: 1 },
          { type: 'new-block', count: 1 },
          { type: 'consolidation', count: 1 },
        ],
      },
      {
        variant: 'full',
        tests: 3,
        outcomes: [
          { type: 'new-block', count: 1 },
          { type: 'calibrated', count: 1 },
          { type: 'regen', count: 1 },
        ],
      },
    ]);
  });

  it('a variant revisited after step-down keeps its original position and merges counts', () => {
    const log = [
      gate('2026-07-06', 'knee', 12, { type: 'variant-advance', variant: 'full' }),
      gate('2026-08-03', 'full', 8, { type: 'regen' }),
      gate('2026-08-10', 'full', 7, { type: 'step-down' }),
      gate('2026-09-07', 'knee', 15, { type: 'new-block' }),
    ];
    const summary = computeGateSummary(log);
    expect(summary.map((s) => s.variant)).toEqual(['knee', 'full']);
    expect(summary[0]?.tests).toBe(2);
    expect(summary[0]?.outcomes).toEqual([
      { type: 'variant-advance', count: 1 },
      { type: 'new-block', count: 1 },
    ]);
  });

  it('repeated identical outcomes accumulate into one count', () => {
    const log = [
      gate('2026-07-06', 'knee', 12, { type: 'consolidation' }),
      gate('2026-08-03', 'knee', 13, { type: 'consolidation' }),
    ];
    expect(computeGateSummary(log)[0]?.outcomes).toEqual([{ type: 'consolidation', count: 2 }]);
  });
});
