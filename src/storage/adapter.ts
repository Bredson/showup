// Showup — storage abstraction. Source of truth: docs/data-model.md §2.
// BINDING: domain never touches IndexedDB directly; UI and services depend on this
// interface only, so a future swap to @capacitor-community/sqlite touches nothing else.

import type { LegacyDailyEntry, ISODate, Meta, QuizDraft, LegacyUserProfile } from '../domain/types';

/** Bumped only with a matching blob migration (docs/data-model.md §5). */
export const CURRENT_SCHEMA_VERSION = 1;

export interface StorageAdapter {
  getProfile(): Promise<LegacyUserProfile | null>;
  saveProfile(p: LegacyUserProfile): Promise<void>;
  getEntry(date: ISODate): Promise<LegacyDailyEntry | null>;
  putEntry(e: LegacyDailyEntry): Promise<void>;
  /** Inclusive range; result sorted ascending by date. */
  getEntriesInRange(from: ISODate, to: ISODate): Promise<LegacyDailyEntry[]>;
  /** Sorted ascending by date. */
  getAllEntries(): Promise<LegacyDailyEntry[]>;
  /** Never null — seeded with defaults on first access. */
  getMeta(): Promise<Meta>;
  saveMeta(m: Meta): Promise<void>;
  /** Mid-quiz onboarding state (ux-spec §1); null when no quiz is in progress. */
  getQuizDraft(): Promise<QuizDraft | null>;
  saveQuizDraft(d: QuizDraft): Promise<void>;
  clearQuizDraft(): Promise<void>;
  /**
   * Import = REPLACE (data-model §5): atomically swap profile + all entries for the
   * given ones and drop any in-flight quiz draft. Meta stays — installedAt describes
   * THIS device, not the backup. All-or-nothing: a failed import must not eat the journal.
   */
  replaceAll(profile: LegacyUserProfile, entries: readonly LegacyDailyEntry[]): Promise<void>;
  clearAll(): Promise<void>;
}
