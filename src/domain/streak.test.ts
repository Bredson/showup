import { describe, expect, it } from 'vitest';
import type { ChallengeStatus, DailyEntry } from './types';
import {
  computeLongestStreak,
  computeProgress,
  computeStreak,
  currentLevel,
  daysBetween,
  levelFromChallengeId,
} from './streak';

let seq = 0;
function entry(date: string, status: ChallengeStatus = 'completed', challengeId?: string): DailyEntry {
  seq += 1;
  return {
    date,
    challengeId: challengeId ?? `l1-${String(seq).padStart(3, '0')}`,
    emotionBefore: null,
    ifThen: null,
    status,
    reflection: null,
    completedAt: status === 'completed' ? `${date}T12:00:00.000Z` : null,
    updatedAt: `${date}T12:00:00.000Z`,
  };
}

describe('daysBetween', () => {
  it('returns 0 for the same day and 1 for adjacent days', () => {
    expect(daysBetween('2026-07-13', '2026-07-13')).toBe(0);
    expect(daysBetween('2026-07-13', '2026-07-14')).toBe(1);
  });

  it('crosses month, year and DST boundaries correctly', () => {
    expect(daysBetween('2026-01-31', '2026-02-01')).toBe(1);
    expect(daysBetween('2025-12-31', '2026-01-01')).toBe(1);
    // Europe DST switch (last Sunday of March 2026 = Mar 29)
    expect(daysBetween('2026-03-28', '2026-03-30')).toBe(2);
  });
});

describe('computeStreak — forgiving rules', () => {
  it('returns 0 with no entries', () => {
    expect(computeStreak([], '2026-07-13')).toBe(0);
  });

  it('counts consecutive completed days: ✓✓✓[pending] → 3', () => {
    const entries = [entry('2026-07-10'), entry('2026-07-11'), entry('2026-07-12')];
    expect(computeStreak(entries, '2026-07-13')).toBe(3);
  });

  it('today pending never breaks the streak: ✓✓·[pending] → 2', () => {
    const entries = [entry('2026-07-10'), entry('2026-07-11')];
    // 2026-07-12 missed (grace), today 2026-07-13 pending
    expect(computeStreak(entries, '2026-07-13')).toBe(2);
  });

  it('resets after two consecutive missed days: ✓✓··[pending] → 0', () => {
    const entries = [entry('2026-07-09'), entry('2026-07-10')];
    expect(computeStreak(entries, '2026-07-13')).toBe(0);
  });

  it('grace is renewable: ✓·✓·✓✓ → 4', () => {
    const entries = [
      entry('2026-07-08'),
      entry('2026-07-10'),
      entry('2026-07-12'),
      entry('2026-07-13'),
    ];
    expect(computeStreak(entries, '2026-07-13')).toBe(4);
  });

  it('a forgiven day adds nothing but does not reset: ✓··✓✓ → 2', () => {
    const entries = [entry('2026-07-08'), entry('2026-07-12'), entry('2026-07-13')];
    expect(computeStreak(entries, '2026-07-13')).toBe(2);
  });

  it('completing today counts immediately', () => {
    expect(computeStreak([entry('2026-07-13')], '2026-07-13')).toBe(1);
  });

  it('skipped and in_progress entries count as no entry', () => {
    const entries = [
      entry('2026-07-11'),
      entry('2026-07-12', 'skipped'),
      entry('2026-07-13', 'in_progress'),
    ];
    expect(computeStreak(entries, '2026-07-13')).toBe(1);
  });

  it('is order-independent (storage order not guaranteed)', () => {
    const entries = [entry('2026-07-12'), entry('2026-07-10'), entry('2026-07-11')];
    expect(computeStreak(entries, '2026-07-13')).toBe(3);
  });
});

describe('computeLongestStreak', () => {
  it('returns 0 with no completed entries', () => {
    expect(computeLongestStreak([])).toBe(0);
    expect(computeLongestStreak([entry('2026-07-12', 'skipped')])).toBe(0);
  });

  it('returns the current series when it is the longest, regardless of entry order', () => {
    const entries = [entry('2026-07-12'), entry('2026-07-10'), entry('2026-07-11')];
    expect(computeLongestStreak(entries)).toBe(3);
  });

  it('finds an older series longer than the current one', () => {
    const entries = [
      // old series of 3 (with one forgiven gap)
      entry('2026-06-01'),
      entry('2026-06-02'),
      entry('2026-06-04'),
      // 3-day break → reset
      entry('2026-06-08'),
    ];
    expect(computeLongestStreak(entries)).toBe(3);
    expect(computeStreak(entries, '2026-07-13')).toBe(0);
  });
});

describe('currentLevel — advance after 7 completions per level', () => {
  it('progresses L1 → L2 → L3', () => {
    expect(currentLevel({ 1: 0, 2: 0, 3: 0 })).toBe(1);
    expect(currentLevel({ 1: 6, 2: 0, 3: 0 })).toBe(1);
    expect(currentLevel({ 1: 7, 2: 0, 3: 0 })).toBe(2);
    expect(currentLevel({ 1: 7, 2: 6, 3: 0 })).toBe(2);
    expect(currentLevel({ 1: 7, 2: 7, 3: 0 })).toBe(3);
  });
});

describe('levelFromChallengeId', () => {
  it('parses the level encoded in the immutable id', () => {
    expect(levelFromChallengeId('l1-007')).toBe(1);
    expect(levelFromChallengeId('l3-012')).toBe(3);
  });

  it('throws on malformed ids, including ones with a valid level digit', () => {
    expect(() => levelFromChallengeId('x9-001')).toThrow();
    expect(() => levelFromChallengeId('x1-001')).toThrow();
    expect(() => levelFromChallengeId('l1x001')).toThrow();
    expect(() => levelFromChallengeId('l4-001')).toThrow();
    expect(() => levelFromChallengeId('l1-01')).toThrow();
  });
});

describe('computeProgress', () => {
  it('derives the full state from entries only', () => {
    const entries = [
      entry('2026-07-10', 'completed', 'l1-001'),
      entry('2026-07-11', 'completed', 'l1-002'),
      entry('2026-07-12', 'skipped', 'l1-003'),
      entry('2026-07-13', 'completed', 'l2-001'),
    ];
    const progress = computeProgress(entries, '2026-07-13');

    expect(progress.totalCompleted).toBe(3);
    expect(progress.completedByLevel).toEqual({ 1: 2, 2: 1, 3: 0 });
    expect(progress.currentLevel).toBe(1);
    expect(progress.currentStreak).toBe(3); // skipped day forgiven
    expect(progress.lastCompletedDate).toBe('2026-07-13');
    // skipped day still consumes its challenge (docs/data-model.md §4)
    expect(progress.usedChallengeIds).toEqual(new Set(['l1-001', 'l1-002', 'l1-003', 'l2-001']));
  });

  it('returns an empty state for a fresh install', () => {
    const progress = computeProgress([], '2026-07-13');
    expect(progress).toEqual({
      currentStreak: 0,
      longestStreak: 0,
      totalCompleted: 0,
      completedByLevel: { 1: 0, 2: 0, 3: 0 },
      currentLevel: 1,
      usedChallengeIds: new Set(),
      lastCompletedDate: null,
    });
  });
});
