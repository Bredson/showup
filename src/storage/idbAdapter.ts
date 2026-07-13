// IndexedDB implementation of StorageAdapter via `idb`. Schema: docs/data-model.md §2.
// The ONLY module in the app allowed to talk to IndexedDB.

import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { DailyEntry, Meta, UserProfile } from '../domain/types';
import { CURRENT_SCHEMA_VERSION, type StorageAdapter } from './adapter';

const DB_NAME = 'unstuck';

interface UnstuckDb extends DBSchema {
  profile: { key: string; value: UserProfile };
  /** Key "YYYY-MM-DD" sorts lexicographically == chronologically (calendar range queries). */
  entries: { key: string; value: DailyEntry };
  meta: { key: string; value: Meta };
}

export async function createIdbAdapter(
  dbName: string = DB_NAME,
  now: () => Date = () => new Date(),
): Promise<StorageAdapter> {
  const db: IDBPDatabase<UnstuckDb> = await openDB<UnstuckDb>(dbName, CURRENT_SCHEMA_VERSION, {
    upgrade(database) {
      // Fresh install only for now; schema bumps go through blob migrations (§5), not here.
      if (!database.objectStoreNames.contains('profile')) {
        database.createObjectStore('profile', { keyPath: 'id' });
      }
      if (!database.objectStoreNames.contains('entries')) {
        database.createObjectStore('entries', { keyPath: 'date' });
      }
      if (!database.objectStoreNames.contains('meta')) {
        database.createObjectStore('meta', { keyPath: 'id' });
      }
    },
    // Without these, a future version bump would hang forever if the app is open in a second tab.
    blocking() {
      db.close();
    },
    blocked() {
      // Old tab still open during an upgrade; nothing to do — `blocking` in that tab closes it.
    },
  });

  return {
    async getProfile() {
      return (await db.get('profile', 'singleton')) ?? null;
    },
    async saveProfile(p) {
      await db.put('profile', p);
    },
    async getEntry(date) {
      return (await db.get('entries', date)) ?? null;
    },
    async putEntry(e) {
      await db.put('entries', e);
    },
    async getEntriesInRange(from, to) {
      // IDBKeyRange.bound throws DataError on an inverted range; normalize to [] like memoryAdapter.
      if (from > to) return [];
      return db.getAll('entries', IDBKeyRange.bound(from, to));
    },
    async getAllEntries() {
      return db.getAll('entries');
    },
    async getMeta() {
      // Get-then-put seed is not race-safe across calls, but this is a single-user local app;
      // worst case two first calls seed installedAt a few ms apart. Accepted, do not "fix".
      const existing = await db.get('meta', 'meta');
      if (existing) return existing;
      const seeded: Meta = {
        id: 'meta',
        schemaVersion: CURRENT_SCHEMA_VERSION,
        installedAt: now().toISOString(),
      };
      await db.put('meta', seeded);
      return seeded;
    },
    async saveMeta(m) {
      await db.put('meta', m);
    },
    // FUTURE: when the blob-migration runner lands (§5), add a transactional replaceAll(blob)
    // to StorageAdapter — composing clearAll + putEntry loops is not atomic and could lose the journal.
    async clearAll() {
      const tx = db.transaction(['profile', 'entries', 'meta'], 'readwrite');
      await Promise.all([
        tx.objectStore('profile').clear(),
        tx.objectStore('entries').clear(),
        tx.objectStore('meta').clear(),
        tx.done,
      ]);
    },
  };
}

/** Ask the browser to protect IndexedDB from eviction. Call once at startup; failure is non-fatal. */
export async function requestPersistentStorage(): Promise<boolean> {
  if (typeof navigator !== 'undefined' && navigator.storage?.persist) {
    try {
      return await navigator.storage.persist();
    } catch {
      return false;
    }
  }
  return false;
}
