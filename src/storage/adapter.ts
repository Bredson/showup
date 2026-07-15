// Showup — storage abstraction. Source of truth: docs/data-model.md §2.
// BINDING: domain never touches IndexedDB directly; UI and services depend on this
// interface only, so a future swap to @capacitor-community/sqlite touches nothing else.

import type { DailyEntry, ISODate, Meta, UserProfile } from '../domain/types';

/**
 * Bumped only with a matching blob migration (docs/data-model.md §5).
 * v1 = the pre-rewrite fork (Unstuck-shaped challenge data) — no migration bridges
 * the fork, so the v1→v2 IndexedDB upgrade wipes stores and v1 blobs fail import.
 */
export const CURRENT_SCHEMA_VERSION = 2;

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
  /**
   * Import = REPLACE (data-model §5): atomically swap profile + all entries for the
   * given ones. Meta stays — installedAt describes THIS device, not the backup.
   * All-or-nothing: a failed import must not eat the journal.
   */
  replaceAll(profile: UserProfile, entries: readonly DailyEntry[]): Promise<void>;
  clearAll(): Promise<void>;
}
