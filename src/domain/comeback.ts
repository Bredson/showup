// Showup — comeback interstitial logic (self-compassion). Source of truth: docs/ux-spec.md §7.
// RULE: pure functions only; no React/storage imports; dates passed in, never read from the clock.
//
// "Break" = days with NO entry between the last entry and today. An entry is created on every
// app open, so an open-without-completing does not count as absence. Nothing here is persisted:
// "once per return" is derived from "today's entry was just created" (ux-spec §7 tech notes).

import type { DailyEntry, DifficultyLevel, ISODate } from './types';
import { daysBetween } from './streak';

/** 30+ missed days → the comeback day gets a one-level-gentler challenge (ux-spec §7). */
export const SOFT_RESTART_MISSED_DAYS = 30;

/**
 * Days with no entry between the most recent entry BEFORE `today` and `today` itself.
 * Entries dated `today` (or later — defensive) are ignored, so the caller may pass all entries.
 * No past entries → 0 (a fresh profile has nothing to "return" to).
 */
export function missedDaysBefore(entries: DailyEntry[], today: ISODate): number {
  let last: ISODate | null = null;
  for (const e of entries) {
    if (e.date < today && (last === null || e.date > last)) last = e.date;
  }
  if (last === null) return 0;
  return daysBetween(last, today) - 1;
}

/**
 * Which interstitial variant to show (ux-spec §7):
 * - 'none'     — no missed days (or nothing to return to)
 * - 'oneDay'   — exactly 1 missed day AND the streak is still alive. The copy promises
 *                "Twoja passa jest bezpieczna" — it must never lie (dylemat 9): after
 *                open-without-completing + a missed day the streak is already 0, so a
 *                dead streak falls through to the always-true multiDay message.
 * - 'multiDay' — every other return (never mentions the count — a number reads as reproach)
 */
export type ComebackKind = 'none' | 'oneDay' | 'multiDay';

export function comebackKind(missedDays: number, currentStreak: number): ComebackKind {
  if (missedDays <= 0) return 'none';
  return missedDays === 1 && currentStreak > 0 ? 'oneDay' : 'multiDay';
}

/** Soft restart: one level gentler, never below 1. Applied only at assignment time. */
export function gentlerLevel(level: DifficultyLevel): DifficultyLevel {
  return level > 1 ? ((level - 1) as DifficultyLevel) : 1;
}
