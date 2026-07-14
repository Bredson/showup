import { describe, expect, it } from 'vitest';
import type { ChallengeStatus, DailyEntry, Emotion } from './types';
import { relativeDay, selectJournalEntries } from './journal';

let seq = 0;
function entry(
  date: string,
  emotion: Emotion | null = 'anxiety',
  status: ChallengeStatus = 'completed',
): DailyEntry {
  seq += 1;
  return {
    date,
    challengeId: `l1-${String(seq).padStart(3, '0')}`,
    emotionBefore: emotion,
    ifThen: null,
    status,
    reflection: status === 'completed' ? 'Start był najtrudniejszy' : null,
    completedAt: status === 'completed' ? `${date}T12:00:00.000Z` : null,
    updatedAt: `${date}T12:00:00.000Z`,
  };
}

describe('selectJournalEntries', () => {
  it('returns entries newest first', () => {
    const result = selectJournalEntries([entry('2026-07-01'), entry('2026-07-10'), entry('2026-07-05')]);
    expect(result.map((e) => e.date)).toEqual(['2026-07-10', '2026-07-05', '2026-07-01']);
  });

  it('drops entries without a recorded emotion', () => {
    const result = selectJournalEntries([entry('2026-07-10'), entry('2026-07-11', null, 'in_progress')]);
    expect(result.map((e) => e.date)).toEqual(['2026-07-10']);
  });

  it('keeps unfinished days that have an emotion (Dylemat 4 = A)', () => {
    const result = selectJournalEntries([
      entry('2026-07-10', 'boredom', 'in_progress'),
      entry('2026-07-09', 'overwhelm', 'skipped'),
      entry('2026-07-08'),
    ]);
    expect(result.map((e) => e.date)).toEqual(['2026-07-10', '2026-07-09', '2026-07-08']);
  });

  it('returns an empty list for no entries', () => {
    expect(selectJournalEntries([])).toEqual([]);
  });

  it('does not mutate the input array', () => {
    const input = [entry('2026-07-01'), entry('2026-07-10')];
    selectJournalEntries(input);
    expect(input.map((e) => e.date)).toEqual(['2026-07-01', '2026-07-10']);
  });
});

describe('relativeDay', () => {
  const today = '2026-07-14';

  it('classifies today, yesterday and older days', () => {
    expect(relativeDay('2026-07-14', today)).toBe('today');
    expect(relativeDay('2026-07-13', today)).toBe('yesterday');
    expect(relativeDay('2026-07-12', today)).toBe('older');
    expect(relativeDay('2026-01-01', today)).toBe('older');
  });

  it('handles yesterday across month and year boundaries', () => {
    expect(relativeDay('2026-06-30', '2026-07-01')).toBe('yesterday');
    expect(relativeDay('2025-12-31', '2026-01-01')).toBe('yesterday');
  });

  it('treats future dates as older (full date, no special label) — intentional, not an error', () => {
    expect(relativeDay('2026-07-15', today)).toBe('older');
  });
});
