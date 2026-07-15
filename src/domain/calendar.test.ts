import { describe, expect, it } from 'vitest';
import type { ChallengeStatus, LegacyDailyEntry } from './types';
import { CALENDAR_DAYS, addDays, computeCalendar } from './calendar';

let seq = 0;
function entry(date: string, status: ChallengeStatus = 'completed'): LegacyDailyEntry {
  seq += 1;
  return {
    date,
    challengeId: `l1-${String(seq).padStart(3, '0')}`,
    emotionBefore: null,
    ifThen: null,
    status,
    reflection: null,
    completedAt: status === 'completed' ? `${date}T12:00:00.000Z` : null,
    updatedAt: `${date}T12:00:00.000Z`,
  };
}

function statusOf(days: ReturnType<typeof computeCalendar>, date: string) {
  return days.find((d) => d.date === date)?.status;
}

describe('addDays', () => {
  it('shifts forward and backward within a month', () => {
    expect(addDays('2026-07-14', 1)).toBe('2026-07-15');
    expect(addDays('2026-07-14', -1)).toBe('2026-07-13');
  });

  it('crosses month, year and DST boundaries correctly', () => {
    expect(addDays('2026-01-31', 1)).toBe('2026-02-01');
    expect(addDays('2026-01-01', -1)).toBe('2025-12-31');
    // Europe DST switch (last Sunday of March 2026 = Mar 29)
    expect(addDays('2026-03-28', 2)).toBe('2026-03-30');
    expect(addDays('2026-03-30', -2)).toBe('2026-03-28');
  });
});

describe('computeCalendar', () => {
  const today = '2026-07-14';

  it('returns exactly 28 days, oldest first, ending today', () => {
    const days = computeCalendar([], today);
    expect(days).toHaveLength(CALENDAR_DAYS);
    expect(days[0]?.date).toBe('2026-06-17');
    expect(days[days.length - 1]?.date).toBe(today);
  });

  it('with no entries: every past day is empty and today is pending', () => {
    const days = computeCalendar([], today);
    expect(statusOf(days, today)).toBe('pending');
    expect(days.slice(0, -1).every((d) => d.status === 'empty')).toBe(true);
  });

  it('marks completed days and attaches their entries', () => {
    const e = entry('2026-07-13');
    const days = computeCalendar([e], today);
    expect(statusOf(days, '2026-07-13')).toBe('completed');
    expect(days.find((d) => d.date === '2026-07-13')?.entry).toBe(e);
  });

  it('today completed is completed, not pending', () => {
    const days = computeCalendar([entry(today)], today);
    expect(statusOf(days, today)).toBe('completed');
  });

  it('forgives a single 1-day gap between two completions', () => {
    const days = computeCalendar([entry('2026-07-10'), entry('2026-07-12')], today);
    expect(statusOf(days, '2026-07-11')).toBe('forgiven');
  });

  it('does not forgive a 2-day gap (streak broken)', () => {
    const days = computeCalendar([entry('2026-07-08'), entry('2026-07-11')], today);
    expect(statusOf(days, '2026-07-09')).toBe('empty');
    expect(statusOf(days, '2026-07-10')).toBe('empty');
  });

  it('forgives yesterday when the last completion was 2 days ago and today is pending', () => {
    const days = computeCalendar([entry('2026-07-12')], today);
    expect(statusOf(days, '2026-07-13')).toBe('forgiven');
    expect(statusOf(days, today)).toBe('pending');
  });

  it('does not forgive anything when the last completion was 3+ days ago', () => {
    const days = computeCalendar([entry('2026-07-10')], today);
    expect(statusOf(days, '2026-07-11')).toBe('empty');
    expect(statusOf(days, '2026-07-12')).toBe('empty');
    expect(statusOf(days, '2026-07-13')).toBe('empty');
  });

  it('forgives historical gaps in older, already-broken runs too', () => {
    // run weeks ago: 06-20, (06-21 rest), 06-22 — then a long break
    const days = computeCalendar([entry('2026-06-20'), entry('2026-06-22')], today);
    expect(statusOf(days, '2026-06-21')).toBe('forgiven');
    expect(statusOf(days, '2026-06-23')).toBe('empty');
  });

  it('ranks completed over forgiven: a skipped entry inside a 1-day gap still shows as forgiven', () => {
    const days = computeCalendar(
      [entry('2026-07-10'), entry('2026-07-11', 'skipped'), entry('2026-07-12')],
      today,
    );
    expect(statusOf(days, '2026-07-11')).toBe('forgiven');
  });

  it('treats skipped and in_progress days as not completed but keeps their entries', () => {
    const skipped = entry('2026-07-12', 'skipped');
    const days = computeCalendar([skipped], today);
    expect(statusOf(days, '2026-07-12')).toBe('empty');
    expect(days.find((d) => d.date === '2026-07-12')?.entry).toBe(skipped);
  });

  it('ignores completions older than the 28-day window without crashing', () => {
    const days = computeCalendar([entry('2026-01-05')], today);
    expect(days).toHaveLength(CALENDAR_DAYS);
    expect(days.every((d) => d.status === 'empty' || d.status === 'pending')).toBe(true);
  });
});
