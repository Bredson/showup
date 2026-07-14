import { describe, expect, it } from 'vitest';
import type { ChallengeStatus, DailyEntry } from './types';
import { comebackKind, gentlerLevel, missedDaysBefore, SOFT_RESTART_MISSED_DAYS } from './comeback';

function entry(date: string, status: ChallengeStatus = 'completed'): DailyEntry {
  return {
    date,
    challengeId: 'l1-001',
    emotionBefore: null,
    ifThen: null,
    status,
    reflection: null,
    completedAt: status === 'completed' ? `${date}T12:00:00.000Z` : null,
    updatedAt: `${date}T12:00:00.000Z`,
  };
}

const TODAY = '2026-07-13';

describe('missedDaysBefore', () => {
  it('returns 0 for a fresh profile — there is nothing to return to', () => {
    expect(missedDaysBefore([], TODAY)).toBe(0);
  });

  it('returns 0 when the last entry was yesterday (no gap)', () => {
    expect(missedDaysBefore([entry('2026-07-12')], TODAY)).toBe(0);
  });

  it('counts full days without any entry', () => {
    expect(missedDaysBefore([entry('2026-07-11')], TODAY)).toBe(1);
    expect(missedDaysBefore([entry('2026-07-08')], TODAY)).toBe(4);
  });

  it('an opened-but-unfinished day counts as presence, not absence', () => {
    // in_progress entry exists → the user opened the app that day
    expect(missedDaysBefore([entry('2026-07-12', 'in_progress')], TODAY)).toBe(0);
  });

  it("ignores today's own entry (assignment happens before the gap check in the shell)", () => {
    expect(missedDaysBefore([entry('2026-07-10'), entry(TODAY, 'in_progress')], TODAY)).toBe(2);
  });

  it('ignores future-dated entries (clock set back / timezone change)', () => {
    expect(missedDaysBefore([entry('2026-07-11'), entry('2026-07-20')], TODAY)).toBe(1);
  });

  it('uses the most recent past entry regardless of array order', () => {
    const entries = [entry('2026-07-01'), entry('2026-07-11'), entry('2026-07-05')];
    expect(missedDaysBefore(entries, TODAY)).toBe(1);
  });
});

describe('comebackKind', () => {
  it('maps missed days to the spec §7 variants (streak alive)', () => {
    expect(comebackKind(0, 3)).toBe('none');
    expect(comebackKind(1, 3)).toBe('oneDay');
    expect(comebackKind(2, 3)).toBe('multiDay');
    expect(comebackKind(45, 0)).toBe('multiDay');
  });

  it('never promises a safe streak when the streak is already dead (dylemat 9)', () => {
    // Mon completed → Tue opened-but-unfinished → Wed no entry → Thu return:
    // 1 missed day, but the streak (counted from the last COMPLETION) is 0.
    expect(comebackKind(1, 0)).toBe('multiDay');
  });
});

describe('gentlerLevel', () => {
  it('drops one level but never below 1', () => {
    expect(gentlerLevel(3)).toBe(2);
    expect(gentlerLevel(2)).toBe(1);
    expect(gentlerLevel(1)).toBe(1);
  });
});

describe('SOFT_RESTART_MISSED_DAYS', () => {
  it('matches ux-spec §7 ("przerwa 30+ dni")', () => {
    expect(SOFT_RESTART_MISSED_DAYS).toBe(30);
  });
});
