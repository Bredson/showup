// Showup — Progress-screen calendar (last 28 days). Source of truth: docs/ux-spec.md §4.
// RULE: pure functions only; no React/storage imports; dates passed in, never read from the clock.

import type { ISODate } from './types';
import { daysBetween, toUtcMs, type StreakEntry } from './streak';

/** Fixed 7×4 grid ending today (user decision: rolling 4 weeks, no navigation). */
export const CALENDAR_DAYS = 28;

/**
 * - completed: entry with status 'completed' (green dot)
 * - forgiven: a 1-day gap covered by the streak's renewable grace (empty green outline + tooltip)
 * - pending: today, not yet completed (never rendered as a miss — ux-spec: no red, no X)
 * - empty: no completion, nothing to forgive (cream dot)
 */
export type CalendarDayStatus = 'completed' | 'forgiven' | 'pending' | 'empty';

export interface CalendarDay<T extends StreakEntry = StreakEntry> {
  date: ISODate;
  status: CalendarDayStatus;
  /** Entry of that day if one exists (any status) — powers the tap-to-preview bottom sheet. */
  entry: T | null;
}

const MS_PER_DAY = 86_400_000;

/** Local calendar date shifted by `delta` whole days. UTC math inside, so DST can never skew it. */
export function addDays(date: ISODate, delta: number): ISODate {
  return new Date(toUtcMs(date) + delta * MS_PER_DAY).toISOString().slice(0, 10) as ISODate;
}

/**
 * Monday of the calendar week containing `date` (Monday-first, as the UI day picker).
 * Weekly rhythms (balance nudge, long-set cadence) share this one definition of "week".
 */
export function mondayOf(date: ISODate): ISODate {
  const dow = new Date(toUtcMs(date)).getUTCDay(); // 0 = Sunday
  return addDays(date, -((dow + 6) % 7));
}

/**
 * Last 28 days, oldest first, ending on `today`.
 * Forgiven days mirror computeStreak's rule: every single 1-day gap between two completions
 * is forgiven; the day between the last completion and a still-pending `today` is forgiven too
 * (gap of exactly 2 keeps the streak alive until local midnight).
 */
export function computeCalendar<T extends StreakEntry>(entries: readonly T[], today: ISODate): CalendarDay<T>[] {
  const byDate = new Map<ISODate, T>(entries.map((e) => [e.date, e]));
  const completedAsc = entries
    .filter((e) => e.status === 'completed')
    .map((e) => e.date)
    .sort();

  const forgiven = new Set<ISODate>();
  for (let i = 1; i < completedAsc.length; i += 1) {
    const prev = completedAsc[i - 1];
    const next = completedAsc[i];
    if (prev !== undefined && next !== undefined && daysBetween(prev, next) === 2) {
      forgiven.add(addDays(prev, 1));
    }
  }
  const last = completedAsc[completedAsc.length - 1];
  if (last !== undefined && daysBetween(last, today) === 2) {
    forgiven.add(addDays(last, 1)); // yesterday rests, streak still alive — mark it explicitly
  }

  const days: CalendarDay<T>[] = [];
  for (let offset = CALENDAR_DAYS - 1; offset >= 0; offset -= 1) {
    const date = addDays(today, -offset);
    const entry = byDate.get(date) ?? null;
    days.push({ date, status: statusFor(date, entry, forgiven, today), entry });
  }
  return days;
}

function statusFor(
  date: ISODate,
  entry: StreakEntry | null,
  forgiven: Set<ISODate>,
  today: ISODate,
): CalendarDayStatus {
  if (entry?.status === 'completed') return 'completed';
  if (forgiven.has(date)) return 'forgiven';
  if (date === today) return 'pending';
  return 'empty';
}
