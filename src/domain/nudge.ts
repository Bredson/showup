// Showup — muscle-balance nudge trigger. Source of truth: docs/prd.md §5
// ("Zrealizowane z backlogu po MVP") + docs/pushup-program-research.md (Bezpieczeństwo:
// 1-2 serie wiosłowania / band pull-apart tygodniowo na ~2000 powtórzeń pchania/mies.).
// RULE: pure functions only; no React/storage/i18n imports; dates passed in, never read
// from the clock. Fully derived from entries — nothing about the nudge is persisted.

import { mondayOf } from './calendar';
import { isHardCompleted } from './program';
import type { DailyEntry, ISODate } from './types';

/**
 * True iff today's entry is the FIRST completed hard pushing day of the current
 * calendar week (Mon-Sun) — the done screen then shows the balance-nudge card.
 *
 * Calendar week, not block week: the nudge is a weekly health rhythm ("1-2 sets of
 * pulling per week"), independent of block anchors, pauses and slot math. Deterministic
 * on reload of a completed day: same entries, same verdict (lazy-derivation rule).
 * Entries dated after `today` (imported from another device, clock skew) are ignored:
 * chronologically, today is still the first hard day of its week.
 */
export function balanceNudgeDue(entries: readonly DailyEntry[], today: ISODate): boolean {
  const todayEntry = entries.find((e) => e.date === today);
  if (todayEntry === undefined || !isHardCompleted(todayEntry)) return false;

  const monday = mondayOf(today);
  return !entries.some(
    (e) => e.date >= monday && e.date < today && isHardCompleted(e),
  );
}
