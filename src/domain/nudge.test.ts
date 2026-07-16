import { describe, expect, it } from 'vitest';
import { balanceNudgeDue } from './nudge';
import type { DailyEntry, ISODate } from './types';

// 2026-07-16 is a Thursday; the containing calendar week is Mon 2026-07-13 .. Sun 2026-07-19.
const THU = '2026-07-16' as ISODate;

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
    reflection: null,
    completedAt: `${date}T18:00:00.000Z`,
    updatedAt: `${date}T18:00:00.000Z`,
    ...overrides,
  };
}

describe('balanceNudgeDue', () => {
  it('fires on the first completed hard session of the calendar week', () => {
    expect(balanceNudgeDue([entry('2026-07-16')], THU)).toBe(true);
  });

  it('stays silent when an earlier hard session completed this week', () => {
    expect(balanceNudgeDue([entry('2026-07-14'), entry('2026-07-16')], THU)).toBe(false);
  });

  it('ignores last week: a Sunday session does not silence Monday', () => {
    // 2026-07-12 is Sunday (previous week), 2026-07-13 is Monday.
    expect(
      balanceNudgeDue([entry('2026-07-12'), entry('2026-07-13')], '2026-07-13' as ISODate),
    ).toBe(true);
  });

  it('counts a completed test as hard pushing work (both as trigger and as silencer)', () => {
    const test = entry('2026-07-16', { kind: 'test', sets: null, testResult: 14 });
    expect(balanceNudgeDue([test], THU)).toBe(true);
    expect(balanceNudgeDue([test, entry('2026-07-18')], '2026-07-18' as ISODate)).toBe(false);
  });

  it('never fires on an easy day', () => {
    const easy = entry('2026-07-16', {
      kind: 'easy',
      feelBefore: null,
      sets: null,
      easyContent: 'gtg-set',
    });
    expect(balanceNudgeDue([easy], THU)).toBe(false);
  });

  it('never fires on a pain-degraded day, and a degraded day does not silence later ones', () => {
    const degraded = entry('2026-07-14', { downgradedTo: 'easy', sets: null, easyContent: 'warmup' });
    expect(balanceNudgeDue([degraded], '2026-07-14' as ISODate)).toBe(false);
    expect(balanceNudgeDue([degraded, entry('2026-07-16')], THU)).toBe(true);
  });

  it('never fires while today is still in progress or has no entry', () => {
    const open = entry('2026-07-16', { status: 'in_progress', sets: null, completedAt: null });
    expect(balanceNudgeDue([open], THU)).toBe(false);
    expect(balanceNudgeDue([], THU)).toBe(false);
  });

  it('is order-independent and does not mutate the input', () => {
    const input = [entry('2026-07-16'), entry('2026-07-14')]; // unsorted on purpose
    expect(balanceNudgeDue(input, THU)).toBe(false);
    expect(input.map((e) => e.date)).toEqual(['2026-07-16', '2026-07-14']);
  });

  it('fires on a Sunday when it is the first hard day of the week (dow=0 wrap)', () => {
    // 2026-07-19 is Sunday — last day of the week Mon 07-13 .. Sun 07-19.
    expect(balanceNudgeDue([entry('2026-07-19')], '2026-07-19' as ISODate)).toBe(true);
  });

  it('a Monday session silences the Sunday of the SAME week', () => {
    expect(
      balanceNudgeDue([entry('2026-07-13'), entry('2026-07-19')], '2026-07-19' as ISODate),
    ).toBe(false);
  });

  it('ignores entries dated after today (device import / clock skew)', () => {
    expect(balanceNudgeDue([entry('2026-07-16'), entry('2026-07-18')], THU)).toBe(true);
  });

  it('easy days between hard days neither trigger nor silence', () => {
    const easyMon = entry('2026-07-13', {
      kind: 'easy',
      feelBefore: null,
      sets: null,
      easyContent: 'warmup',
    });
    expect(balanceNudgeDue([easyMon, entry('2026-07-16')], THU)).toBe(true);
  });
});
