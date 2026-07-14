// Unstuck — storage abstraction. Source of truth: docs/data-model.md §2.
// BINDING: domain never touches IndexedDB directly; UI and services depend on this
// interface only, so a future swap to @capacitor-community/sqlite touches nothing else.

import type { DailyEntry, ISODate, Meta, QuizDraft, UserProfile } from '../domain/types';

/** Bumped only with a matching blob migration (docs/data-model.md §5). */
export const CURRENT_SCHEMA_VERSION = 1;

export interface StorageAdapter {
  getProfile(): Promise<UserProfile | null>;
  saveProfile(p: UserProfile): Promise<void>;
  getEntry(date: ISODate): Promise<DailyEntry | null>;
  putEntry(e: DailyEntry): Promise<void>;
  /** Inclusive range; result sorted ascending by date. */
  getEntriesInRange(from: ISODate, to: ISODate): Promise<DailyEntry[]>;
  /** Sorted ascending by date. */
  getAllEntries(): Promise<DailyEntry[]>;
  /** Never null — seeded with defaults on first access. */
  getMeta(): Promise<Meta>;
  saveMeta(m: Meta): Promise<void>;
  /** Mid-quiz onboarding state (ux-spec §1); null when no quiz is in progress. */
  getQuizDraft(): Promise<QuizDraft | null>;
  saveQuizDraft(d: QuizDraft): Promise<void>;
  clearQuizDraft(): Promise<void>;
  clearAll(): Promise<void>;
}
