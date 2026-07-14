// Unstuck — forgiving streak + derived progress. Source of truth: docs/data-model.md §3–4.
// RULE: pure functions only; no React/storage imports; dates passed in, never read from the clock.

import type { DailyEntry, DifficultyLevel, ISODate, ProgressState } from './types';

const MS_PER_DAY = 86_400_000;
/** Completions needed to advance a level — also drives the 7-dot progress UI. */
export const COMPLETIONS_TO_ADVANCE = 7;

/** Whole days between two local calendar dates. Uses UTC internally so DST can never skew the result. */
export function daysBetween(a: ISODate, b: ISODate): number {
  return Math.round((toUtcMs(b) - toUtcMs(a)) / MS_PER_DAY);
}

/** Shared date parsing for domain modules (calendar.ts reuses it in addDays). */
export function toUtcMs(date: ISODate): number {
  // ISODate is always "YYYY-MM-DD", so the three parts are guaranteed to exist.
  const [y, m, d] = date.split('-').map(Number) as [number, number, number];
  return Date.UTC(y, m - 1, d);
}

/** Challenge ids are immutable and encode the level: "l{level}-{nnn}" (docs/data-model.md). */
export function levelFromChallengeId(challengeId: string): DifficultyLevel {
  const match = /^l([123])-\d{3}$/.exec(challengeId);
  if (match) return Number(match[1]) as DifficultyLevel;
  throw new Error(`Invalid challenge id: ${challengeId}`);
}

/**
 * Forgiving streak (binding rules, docs/data-model.md §3):
 * - counts COMPLETED days only; a forgiven day adds nothing but breaks nothing
 * - renewable grace: every single 1-day gap is forgiven; 2+ consecutive missed days reset
 * - today is "pending" until local midnight — it never breaks the streak
 * - skipped == no entry (no penalty)
 */
export function computeStreak(entries: DailyEntry[], today: ISODate): number {
  const [latest, ...rest] = completedDatesDesc(entries);
  if (latest === undefined) return 0;

  // Gap from the last completion to today: >2 means 2+ full missed days (today itself is pending).
  if (daysBetween(latest, today) > 2) return 0;

  let streak = 1;
  let prev = latest;
  for (const current of rest) {
    if (daysBetween(current, prev) > 2) break; // diff >= 3 → series ended
    streak += 1; // diff === 2 → exactly one forgiven day in between
    prev = current;
  }
  return streak;
}

/** Longest streak ever, under the same forgiving rules (kept in ProgressState; not shown as a "record" in UI). */
export function computeLongestStreak(entries: DailyEntry[]): number {
  const completed = completedDatesDesc(entries);
  let longest = 0;
  let current = 0;
  let prev: ISODate | null = null;
  for (const d of completed) {
    current = prev !== null && daysBetween(d, prev) <= 2 ? current + 1 : 1;
    prev = d;
    if (current > longest) longest = current;
  }
  return longest;
}

/** Level progression: L1 until 7 L1 completions, then L2 until 7 L2 completions, then L3. */
export function currentLevel(completedByLevel: Record<DifficultyLevel, number>): DifficultyLevel {
  if (completedByLevel[1] < COMPLETIONS_TO_ADVANCE) return 1;
  if (completedByLevel[2] < COMPLETIONS_TO_ADVANCE) return 2;
  return 3;
}

/** Derives the full ProgressState from entries — NEVER persisted (DailyEntry is the single source of truth). */
export function computeProgress(entries: DailyEntry[], today: ISODate): ProgressState {
  const completedByLevel: Record<DifficultyLevel, number> = { 1: 0, 2: 0, 3: 0 };
  const usedChallengeIds = new Set<string>();
  let totalCompleted = 0;
  let lastCompletedDate: ISODate | null = null;

  for (const entry of entries) {
    usedChallengeIds.add(entry.challengeId);
    if (entry.status === 'completed') {
      totalCompleted += 1;
      completedByLevel[levelFromChallengeId(entry.challengeId)] += 1;
      if (lastCompletedDate === null || entry.date > lastCompletedDate) {
        lastCompletedDate = entry.date;
      }
    }
  }

  return {
    currentStreak: computeStreak(entries, today),
    longestStreak: computeLongestStreak(entries),
    totalCompleted,
    completedByLevel,
    currentLevel: currentLevel(completedByLevel),
    usedChallengeIds,
    lastCompletedDate,
  };
}

function completedDatesDesc(entries: DailyEntry[]): ISODate[] {
  return entries
    .filter((e) => e.status === 'completed')
    .map((e) => e.date)
    .sort()
    .reverse();
}
