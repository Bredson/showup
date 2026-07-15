// Showup — Journal screen selection (ux-spec §5). Source of truth: LegacyDailyEntry[] only.
// RULE: pure functions only; no React/storage imports; dates passed in, never read from the clock.
//
// Scope decision (Dylemat 4 = A): the journal shows every entry with a recorded emotion —
// including started-but-unfinished days. It records emotions and reflections, it does NOT
// judge execution (that is the Progress screen's job), so no status markers here.

import type { LegacyDailyEntry, Emotion, ISODate } from './types';
import { daysBetween } from './streak';

/** An entry that qualifies for the journal — the recorded emotion is compiler-guaranteed. */
export type JournalEntry = LegacyDailyEntry & { emotionBefore: Emotion };

/** Newest first. Entries without an emotion check never reached the journal-worthy point of the loop. */
export function selectJournalEntries(entries: LegacyDailyEntry[]): JournalEntry[] {
  return entries
    .filter((e): e is JournalEntry => e.emotionBefore !== null)
    .sort((a, b) => b.date.localeCompare(a.date));
}

/** UI picks the label ("dziś"/"wczoraj") via i18n; older days get a full formatted date. */
export type RelativeDay = 'today' | 'yesterday' | 'older';

export function relativeDay(date: ISODate, today: ISODate): RelativeDay {
  const gap = daysBetween(date, today);
  if (gap === 0) return 'today';
  if (gap === 1) return 'yesterday';
  return 'older';
}
