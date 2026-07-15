// IndexedDB implementation of StorageAdapter via `idb`. Schema: docs/data-model.md §2.
// The ONLY module in the app allowed to talk to IndexedDB.

import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { LegacyDailyEntry, Meta, QuizDraft, LegacyUserProfile } from '../domain/types';
import { CURRENT_SCHEMA_VERSION, type StorageAdapter } from './adapter';

const DB_NAME = 'showup';

interface ShowupDb extends DBSchema {
  profile: { key: string; value: LegacyUserProfile };
  /** Key "YYYY-MM-DD" sorts lexicographically == chronologically (calendar range queries). */
  entries: { key: string; value: LegacyDailyEntry };
  /** Two singleton records share this store: "meta" (Meta) and "quizDraft" (QuizDraft). */
  meta: { key: string; value: Meta | QuizDraft };
}

export async function createIdbAdapter(
  dbName: string = DB_NAME,
  now: () => Date = () => new Date(),
): Promise<StorageAdapter> {
  const db: IDBPDatabase<ShowupDb> = await openDB<ShowupDb>(dbName, CURRENT_SCHEMA_VERSION, {
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
      // Key "meta" only ever holds a Meta record (key<->type pairing is this module's invariant).
      const existing = (await db.get('meta', 'meta')) as Meta | undefined;
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
    async getQuizDraft() {
      return ((await db.get('meta', 'quizDraft')) as QuizDraft | undefined) ?? null;
    },
    async saveQuizDraft(d) {
      await db.put('meta', d);
    },
    async clearQuizDraft() {
      await db.delete('meta', 'quizDraft');
    },
    async replaceAll(newProfile, newEntries) {
      // Single readwrite transaction = atomic: if anything throws, IndexedDB rolls back
      // and the current journal survives (the reason this is not clearAll + putEntry loops).
      const tx = db.transaction(['profile', 'entries', 'meta'], 'readwrite');
      const profileStore = tx.objectStore('profile');
      const entriesStore = tx.objectStore('entries');
      await Promise.all([
        profileStore.clear().then(() => profileStore.put(newProfile)),
        entriesStore.clear().then(() => Promise.all(newEntries.map((e) => entriesStore.put(e)))),
        tx.objectStore('meta').delete('quizDraft'),
        tx.done,
      ]);
    },
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
