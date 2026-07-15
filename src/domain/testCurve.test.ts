import { describe, expect, it } from 'vitest';
import type { ProgramState, Variant } from './types';
import { computeTestCurve } from './testCurve';

type HistoryItem = ProgramState['testHistory'][number];

function t(date: string, variant: Variant, result: number, seed?: boolean): HistoryItem {
  return seed === undefined ? { date, variant, result } : { date, variant, result, seed };
}

describe('computeTestCurve', () => {
  it('returns an empty curve for empty history', () => {
    const curve = computeTestCurve([]);
    expect(curve.segments).toEqual([]);
    expect(curve.pointCount).toBe(0);
    expect(curve.maxResult).toBe(0);
  });

  it('handles the founding test as a single one-point segment', () => {
    const curve = computeTestCurve([t('2026-07-01', 'knee', 12)]);
    expect(curve.segments).toHaveLength(1);
    expect(curve.segments[0]).toEqual({
      variant: 'knee',
      points: [{ date: '2026-07-01', variant: 'knee', result: 12, seed: false, index: 0 }],
    });
    expect(curve.pointCount).toBe(1);
    expect(curve.maxResult).toBe(12);
  });

  it('groups consecutive same-variant tests into one segment', () => {
    const curve = computeTestCurve([
      t('2026-07-01', 'knee', 12),
      t('2026-07-29', 'knee', 16),
      t('2026-08-26', 'knee', 21),
    ]);
    expect(curve.segments).toHaveLength(1);
    expect(curve.segments[0]?.points.map((p) => p.result)).toEqual([12, 16, 21]);
  });

  it('starts a new segment on variant change, keeping same-date seed in array order', () => {
    // Graduation day: last knee test and the seeded full point share the date.
    const curve = computeTestCurve([
      t('2026-07-01', 'knee', 21),
      t('2026-07-29', 'knee', 26),
      t('2026-07-29', 'full', 13, true),
      t('2026-08-26', 'full', 18),
    ]);
    expect(curve.segments.map((s) => s.variant)).toEqual(['knee', 'full']);
    expect(curve.segments[0]?.points.map((p) => p.result)).toEqual([21, 26]);
    expect(curve.segments[1]?.points.map((p) => p.seed)).toEqual([true, false]);
  });

  it('splits again when the user steps back down to a previous variant', () => {
    const curve = computeTestCurve([
      t('2026-07-01', 'knee', 21),
      t('2026-07-29', 'full', 11, true),
      t('2026-08-26', 'full', 10),
      t('2026-09-23', 'knee', 19, true),
    ]);
    expect(curve.segments.map((s) => s.variant)).toEqual(['knee', 'full', 'knee']);
  });

  it('assigns global sequential indices across segments', () => {
    const curve = computeTestCurve([
      t('2026-07-01', 'knee', 21),
      t('2026-07-29', 'full', 11, true),
      t('2026-08-26', 'full', 15),
    ]);
    const indices = curve.segments.flatMap((s) => s.points.map((p) => p.index));
    expect(indices).toEqual([0, 1, 2]);
    expect(curve.pointCount).toBe(3);
  });

  it('normalizes the optional seed flag to a boolean', () => {
    const curve = computeTestCurve([t('2026-07-01', 'wall', 8)]);
    expect(curve.segments[0]?.points[0]?.seed).toBe(false);
  });

  it('tracks maxResult across all segments', () => {
    const curve = computeTestCurve([
      t('2026-07-01', 'knee', 26),
      t('2026-07-29', 'full', 13, true),
      t('2026-08-26', 'full', 18),
    ]);
    expect(curve.maxResult).toBe(26);
  });
});
