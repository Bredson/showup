import { describe, expect, it } from 'vitest';
import { journalEntries } from './journal';
import type { DailyEntry, ISODate } from './types';

function entry(date: string, overrides: Partial<DailyEntry> = {}): DailyEntry {
  return {
    date: date as ISODate,
    kind: 'session',
    variant: 'knee',
    feelBefore: 'ok',
    downgradedTo: null,
    status: 'completed',
    sets: [8, 8, 6],
    testResult: null,
    easyContent: null,
    longSetReps: null,
    reflection: null,
    completedAt: `${date}T18:00:00.000Z`,
    updatedAt: `${date}T18:00:00.000Z`,
    ...overrides,
  };
}

describe('journalEntries', () => {
  it('returns entries newest first regardless of input order', () => {
    const feed = journalEntries([entry('2026-07-10'), entry('2026-07-14'), entry('2026-07-12')]);
    expect(feed.map((e) => e.date)).toEqual(['2026-07-14', '2026-07-12', '2026-07-10']);
  });

  it('does not mutate the input array (adapter results are shared)', () => {
    const input = [entry('2026-07-10'), entry('2026-07-14')];
    journalEntries(input);
    expect(input.map((e) => e.date)).toEqual(['2026-07-10', '2026-07-14']);
  });

  it('excludes easy days (feel check never happens there)', () => {
    const easy = entry('2026-07-11', { kind: 'easy', feelBefore: null, sets: null, easyContent: 'gtg-set' });
    expect(journalEntries([easy, entry('2026-07-13')]).map((e) => e.date)).toEqual(['2026-07-13']);
  });

  it('excludes sessions opened before the feel check was answered', () => {
    const opened = entry('2026-07-14', { feelBefore: null, status: 'in_progress', sets: null, completedAt: null });
    expect(journalEntries([opened])).toEqual([]);
  });

  it('includes started-but-unfinished days once the feel is recorded (no judging)', () => {
    const unfinished = entry('2026-07-14', { status: 'in_progress', sets: null, completedAt: null });
    expect(journalEntries([unfinished]).map((e) => e.date)).toEqual(['2026-07-14']);
  });

  it('includes tests and pain-degraded days with their feel', () => {
    const test = entry('2026-07-13', { kind: 'test', feelBefore: 'fresh', sets: null, testResult: 14 });
    const degraded = entry('2026-07-12', { feelBefore: 'pain', downgradedTo: 'easy', sets: null, easyContent: 'warmup' });
    const feed = journalEntries([test, degraded]);
    expect(feed.map((e) => e.feelBefore)).toEqual(['fresh', 'pain']);
  });
});
