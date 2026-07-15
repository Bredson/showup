// Showup — Journal feed (PRD §5 pt 5, ux-spec §5). Source of truth for WHICH
// entries the journal shows and in WHAT order.
// RULE: pure functions only; no React/storage imports; dates passed in, never read from the clock.
//
// Scope (user decision, mirrors Unstuck "Dylemat 4 wariant A"): every session/test
// day where the feel check was answered — including started-but-unfinished days.
// The journal never judges execution (no status markers); presence of easy days
// is Progress-calendar territory, so easy days (feelBefore always null) drop out
// naturally via the same predicate.

import type { DailyEntry, Feel } from './types';

/** A journal row is an entry whose feel check happened — the type carries that proof. */
export type JournalEntry = DailyEntry & { feelBefore: Feel };

/** Reverse-chronological journal feed. Input order does not matter. */
export function journalEntries(entries: readonly DailyEntry[]): JournalEntry[] {
  return entries
    .filter((e): e is JournalEntry => e.feelBefore !== null)
    .sort((a, b) => b.date.localeCompare(a.date));
}
