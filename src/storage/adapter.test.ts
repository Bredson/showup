// Contract test: every StorageAdapter implementation must pass the exact same suite.
// A future SQLite adapter (Capacitor) gets verified by adding one line to `implementations`.

import 'fake-indexeddb/auto';
import { openDB } from 'idb';
import { beforeEach, describe, expect, it } from 'vitest';
import type { DailyEntry, EntryStatus, UserProfile } from '../domain/types';
import { CURRENT_SCHEMA_VERSION, type StorageAdapter } from './adapter';
import { createIdbAdapter } from './idbAdapter';
import { createMemoryAdapter } from './memoryAdapter';

const FIXED_NOW = () => new Date('2026-07-13T10:00:00.000Z');

let dbCounter = 0;
const implementations: Array<[string, () => Promise<StorageAdapter>]> = [
  ['memoryAdapter', async () => createMemoryAdapter(FIXED_NOW)],
  ['idbAdapter', () => createIdbAdapter(`showup-test-${++dbCounter}`, FIXED_NOW)],
];

function entry(date: string, status: EntryStatus = 'completed'): DailyEntry {
  return {
    date,
    kind: 'session',
    variant: 'full',
    feelBefore: 'ok',
    downgradedTo: null,
    status,
    sets: [5, 6, 4, 4, 7],
    testResult: null,
    easyContent: null,
    reflection: null,
    completedAt: status === 'completed' ? `${date}T12:00:00.000Z` : null,
    updatedAt: `${date}T12:00:00.000Z`,
  };
}

const profile: UserProfile = {
  id: 'singleton',
  language: 'pl',
  startDate: '2026-07-13',
  sessionDays: [1, 3, 5],
  ifThen: null,
  disclaimerAcceptedAt: '2026-07-13T09:00:00.000Z',
  createdAt: '2026-07-13T09:00:00.000Z',
};

describe.each(implementations)('StorageAdapter contract: %s', (_name, createAdapter) => {
  let adapter: StorageAdapter;

  beforeEach(async () => {
    adapter = await createAdapter();
  });

  it('returns null profile before onboarding, then round-trips it', async () => {
    expect(await adapter.getProfile()).toBeNull();
    await adapter.saveProfile(profile);
    expect(await adapter.getProfile()).toEqual(profile);
  });

  it('returns null for a missing entry and round-trips a saved one', async () => {
    expect(await adapter.getEntry('2026-07-13')).toBeNull();
    const e = entry('2026-07-13');
    await adapter.putEntry(e);
    expect(await adapter.getEntry('2026-07-13')).toEqual(e);
  });

  it('putEntry upserts — one entry per day stays one entry', async () => {
    await adapter.putEntry(entry('2026-07-13', 'in_progress'));
    await adapter.putEntry(entry('2026-07-13', 'completed'));
    expect(await adapter.getAllEntries()).toHaveLength(1);
    expect((await adapter.getEntry('2026-07-13'))?.status).toBe('completed');
  });

  it('getEntriesInRange returns [] for an inverted range instead of throwing', async () => {
    await adapter.putEntry(entry('2026-07-13'));
    expect(await adapter.getEntriesInRange('2026-07-31', '2026-07-01')).toEqual([]);
  });

  it('getEntriesInRange is inclusive and sorted ascending', async () => {
    for (const d of ['2026-07-15', '2026-06-30', '2026-07-01', '2026-07-31', '2026-08-01']) {
      await adapter.putEntry(entry(d));
    }
    const july = await adapter.getEntriesInRange('2026-07-01', '2026-07-31');
    expect(july.map((e) => e.date)).toEqual(['2026-07-01', '2026-07-15', '2026-07-31']);
  });

  it('getAllEntries returns everything sorted ascending', async () => {
    for (const d of ['2026-07-13', '2025-12-31', '2026-01-01']) {
      await adapter.putEntry(entry(d));
    }
    expect((await adapter.getAllEntries()).map((e) => e.date)).toEqual([
      '2025-12-31',
      '2026-01-01',
      '2026-07-13',
    ]);
  });

  it('seeds meta on first access and keeps it stable afterwards', async () => {
    const meta = await adapter.getMeta();
    expect(meta).toEqual({
      id: 'meta',
      schemaVersion: CURRENT_SCHEMA_VERSION,
      installedAt: '2026-07-13T10:00:00.000Z',
    });
    expect(await adapter.getMeta()).toEqual(meta);
  });

  it('saveMeta overwrites the seeded meta', async () => {
    await adapter.getMeta();
    await adapter.saveMeta({ id: 'meta', schemaVersion: 99, installedAt: '2026-01-01T00:00:00.000Z' });
    expect((await adapter.getMeta()).schemaVersion).toBe(99);
  });

  it('replaceAll swaps profile and entries wholesale (import = replace, not merge)', async () => {
    await adapter.saveProfile(profile);
    await adapter.putEntry(entry('2026-07-13'));

    const imported: UserProfile = { ...profile, language: 'en', startDate: '2026-01-01' };
    await adapter.replaceAll(imported, [entry('2026-01-01'), entry('2026-01-02')]);

    expect((await adapter.getProfile())?.language).toBe('en');
    // The old entry is GONE — no merging of current data with the backup.
    expect((await adapter.getAllEntries()).map((e) => e.date)).toEqual(['2026-01-01', '2026-01-02']);
  });

  it('replaceAll preserves meta (installedAt describes this device, not the backup)', async () => {
    const metaBefore = await adapter.getMeta();
    await adapter.replaceAll(profile, []);
    expect(await adapter.getMeta()).toEqual(metaBefore);
  });

  it('replaceAll does not keep references to caller data', async () => {
    const imported = entry('2026-02-01');
    await adapter.replaceAll(profile, [imported]);
    imported.status = 'in_progress';
    expect((await adapter.getEntry('2026-02-01'))!.status).toBe('completed');
  });

  it('clearAll wipes profile, entries and meta', async () => {
    await adapter.saveProfile(profile);
    await adapter.putEntry(entry('2026-07-13'));
    await adapter.getMeta();

    await adapter.clearAll();

    expect(await adapter.getProfile()).toBeNull();
    expect(await adapter.getAllEntries()).toEqual([]);
    // meta re-seeds after wipe instead of returning stale data
    expect((await adapter.getMeta()).schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
  });

  it('does not leak internal references — mutating a result does not affect storage', async () => {
    await adapter.putEntry(entry('2026-07-13', 'in_progress'));
    const read = await adapter.getEntry('2026-07-13');
    read!.status = 'completed';
    expect((await adapter.getEntry('2026-07-13'))!.status).toBe('in_progress');
  });
});

// Durability is idbAdapter's entire reason to exist — memoryAdapter cannot pass this by design,
// so it lives outside the shared contract.
describe('idbAdapter durability', () => {
  it('data survives closing and reopening the same database', async () => {
    const dbName = `showup-durability-${Date.now()}`;
    const first = await createIdbAdapter(dbName, FIXED_NOW);
    await first.saveProfile(profile);
    await first.putEntry(entry('2026-07-13'));
    const metaBefore = await first.getMeta();

    const reopened = await createIdbAdapter(dbName, FIXED_NOW);
    expect(await reopened.getProfile()).toEqual(profile);
    expect((await reopened.getAllEntries()).map((e) => e.date)).toEqual(['2026-07-13']);
    expect(await reopened.getMeta()).toEqual(metaBefore);
  });
});

describe('idbAdapter v1 → v2 upgrade', () => {
  it('wipes pre-rewrite stores instead of migrating them', async () => {
    // Build a v1 database the way the pre-rewrite app left it: same store names,
    // Unstuck-shaped records (challengeId etc.) that mean nothing to the program.
    const dbName = `showup-upgrade-${Date.now()}`;
    const v1 = await openDB(dbName, 1, {
      upgrade(database) {
        database.createObjectStore('profile', { keyPath: 'id' });
        database.createObjectStore('entries', { keyPath: 'date' });
        database.createObjectStore('meta', { keyPath: 'id' });
      },
    });
    await v1.put('profile', { id: 'singleton', language: 'pl', quiz: { answers: {} } });
    await v1.put('entries', { date: '2026-07-01', challengeId: 'l1-001', status: 'completed' });
    await v1.put('meta', { id: 'meta', schemaVersion: 1, installedAt: '2026-07-01T00:00:00.000Z' });
    v1.close();

    const adapter = await createIdbAdapter(dbName, FIXED_NOW);
    expect(await adapter.getProfile()).toBeNull();
    expect(await adapter.getAllEntries()).toEqual([]);
    // meta was wiped too — it re-seeds under the new schema version
    expect((await adapter.getMeta()).schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
  });
});
