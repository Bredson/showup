// In-memory StorageAdapter: used by unit tests of higher layers (no IndexedDB in jsdom)
// and as the reference implementation for the adapter contract test.

import type { DailyEntry, ISODate, Meta, UserProfile } from '../domain/types';
import { CURRENT_SCHEMA_VERSION, type StorageAdapter } from './adapter';

/** Plain string comparison — the exact analogue of IndexedDB key order (localeCompare is not). */
function byDateAsc(a: DailyEntry, b: DailyEntry): number {
  return a.date < b.date ? -1 : a.date > b.date ? 1 : 0;
}

export function createMemoryAdapter(now: () => Date = () => new Date()): StorageAdapter {
  let profile: UserProfile | null = null;
  let meta: Meta | null = null;
  const entries = new Map<ISODate, DailyEntry>();

  return {
    async getProfile() {
      return profile ? structuredClone(profile) : null;
    },
    async saveProfile(p) {
      profile = structuredClone(p);
    },
    async getEntry(date) {
      const entry = entries.get(date);
      return entry ? structuredClone(entry) : null;
    },
    async putEntry(e) {
      entries.set(e.date, structuredClone(e));
    },
    async getEntriesInRange(from, to) {
      return [...entries.values()]
        .filter((e) => e.date >= from && e.date <= to)
        .sort(byDateAsc)
        .map((e) => structuredClone(e));
    },
    async getAllEntries() {
      return [...entries.values()].sort(byDateAsc).map((e) => structuredClone(e));
    },
    async getMeta() {
      meta ??= {
        id: 'meta',
        schemaVersion: CURRENT_SCHEMA_VERSION,
        installedAt: now().toISOString(),
      };
      return structuredClone(meta);
    },
    async saveMeta(m) {
      meta = structuredClone(m);
    },
    async clearAll() {
      profile = null;
      meta = null;
      entries.clear();
    },
  };
}
