import { describe, expect, it } from 'vitest';
import { computeLongestStreak, computeStreak, daysBetween, type StreakEntry } from './streak';

function entry(date: string, status: StreakEntry['status'] = 'completed'): StreakEntry {
  return { date, status };
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

  it('in_progress entries count as no entry (presence = completion, not opening the app)', () => {
    const entries = [
      entry('2026-07-11'),
      entry('2026-07-12', 'in_progress'),
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
    expect(computeLongestStreak([entry('2026-07-12', 'in_progress')])).toBe(0);
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
