import { describe, expect, it } from 'vitest';
import type { Challenge, ChallengeStatus, DailyEntry, DifficultyLevel } from './types';
import { fnv1aHash, getTodaysChallenge, selectChallenge } from './challenge';
import { createMemoryAdapter } from '../storage/memoryAdapter';

function challenge(id: string): Challenge {
  const level = Number(id.charAt(1)) as DifficultyLevel;
  return {
    id,
    level,
    category: 'two-minute',
    i18n: {
      pl: { lesson: 'lekcja', task: 'zadanie', reflection: 'refleksja' },
      en: { lesson: 'lesson', task: 'task', reflection: 'reflection' },
    },
  };
}

function entry(date: string, challengeId: string, status: ChallengeStatus = 'completed'): DailyEntry {
  return {
    date,
    challengeId,
    emotionBefore: null,
    ifThen: null,
    status,
    reflection: null,
    completedAt: status === 'completed' ? `${date}T12:00:00.000Z` : null,
    updatedAt: `${date}T12:00:00.000Z`,
  };
}

const CATALOG = ['l1-001', 'l1-002', 'l1-003', 'l2-001', 'l2-002', 'l3-001'].map(challenge);

describe('fnv1aHash', () => {
  it('is deterministic and non-negative', () => {
    expect(fnv1aHash('2026-07-13')).toBe(fnv1aHash('2026-07-13'));
    expect(fnv1aHash('2026-07-13')).toBeGreaterThanOrEqual(0);
    expect(fnv1aHash('2026-07-13')).not.toBe(fnv1aHash('2026-07-14'));
  });

  it('matches FNV-1a 32-bit reference vectors (assignments persist across app versions)', () => {
    expect(fnv1aHash('')).toBe(0x811c9dc5);
    expect(fnv1aHash('a')).toBe(0xe40c292c);
    expect(fnv1aHash('foobar')).toBe(0xbf9cf968);
  });
});

describe('selectChallenge', () => {
  it('picks deterministically from unused challenges of the current level', () => {
    const first = selectChallenge(CATALOG, [], 1, '2026-07-13');
    expect(first.level).toBe(1);
    expect(selectChallenge(CATALOG, [], 1, '2026-07-13')).toEqual(first);
  });

  it('never repeats a used challenge while unused ones remain', () => {
    const entries = [entry('2026-07-11', 'l1-001'), entry('2026-07-12', 'l1-002')];
    expect(selectChallenge(CATALOG, entries, 1, '2026-07-13').id).toBe('l1-003');
  });

  it('a skipped day consumes the challenge too (spec §4)', () => {
    const entries = [
      entry('2026-07-11', 'l1-001', 'skipped'),
      entry('2026-07-12', 'l1-002'),
    ];
    expect(selectChallenge(CATALOG, entries, 1, '2026-07-13').id).toBe('l1-003');
  });

  it('falls back to level+1 when the current level is exhausted', () => {
    const entries = ['l1-001', 'l1-002', 'l1-003'].map((id, i) => entry(`2026-07-1${i}`, id));
    const picked = selectChallenge(CATALOG, entries, 1, '2026-07-13');
    expect(picked.level).toBe(2);
  });

  it('falls back to least-recently-used repeat when everything is exhausted', () => {
    const entries = [
      entry('2026-07-01', 'l3-001'),
      entry('2026-07-02', 'l1-001'), // oldest L1 use → LRU
      entry('2026-07-03', 'l1-002'),
      entry('2026-07-04', 'l1-003'),
      entry('2026-07-05', 'l2-001'),
      entry('2026-07-06', 'l2-002'),
    ];
    // level 3 has one challenge and it's used; level 3 has no level+1 fallback
    expect(selectChallenge(CATALOG, entries, 3, '2026-07-13').id).toBe('l3-001');
    // level 1 exhausted, level 2 exhausted → LRU within level 1
    expect(selectChallenge(CATALOG, entries, 1, '2026-07-13').id).toBe('l1-001');
  });

  it('throws when no challenges exist for the level at all', () => {
    expect(() => selectChallenge([], [], 1, '2026-07-13')).toThrow(/content is broken/);
  });
});

describe('getTodaysChallenge', () => {
  const NOW = '2026-07-13T08:00:00.000Z';

  it('assigns a challenge and creates the daily entry on first open', async () => {
    const store = createMemoryAdapter();
    const { challenge: picked, entry: created } = await getTodaysChallenge(
      store,
      CATALOG,
      '2026-07-13',
      NOW,
    );

    expect(picked!.level).toBe(1);
    expect(created).toMatchObject({
      date: '2026-07-13',
      challengeId: picked!.id,
      status: 'in_progress',
      emotionBefore: null,
    });
    expect(await store.getEntry('2026-07-13')).toEqual(created);
  });

  it('returns the same challenge on every subsequent open (persistent assignment)', async () => {
    const store = createMemoryAdapter();
    const first = await getTodaysChallenge(store, CATALOG, '2026-07-13', NOW);
    const second = await getTodaysChallenge(store, CATALOG, '2026-07-13', NOW);
    expect(second.challenge!.id).toBe(first.challenge!.id);
    expect(await store.getAllEntries()).toHaveLength(1);
  });

  it('does not lose progress when a content deploy removed the assigned challenge', async () => {
    const store = createMemoryAdapter();
    await store.putEntry({
      ...entry('2026-07-13', 'l1-999', 'in_progress'),
      emotionBefore: 'anxiety',
    });

    const { challenge: reassigned, entry: updated } = await getTodaysChallenge(
      store,
      CATALOG,
      '2026-07-13',
      NOW,
    );

    expect(reassigned).not.toBeNull();
    expect(CATALOG.some((c) => c.id === reassigned!.id)).toBe(true);
    expect(updated.emotionBefore).toBe('anxiety'); // earlier step data preserved
    expect(updated.challengeId).toBe(reassigned!.id);
  });

  it('never rewrites a completed entry whose challenge vanished — journal stays truthful', async () => {
    const store = createMemoryAdapter();
    const completed = entry('2026-07-13', 'l1-999', 'completed');
    await store.putEntry(completed);

    const result = await getTodaysChallenge(store, CATALOG, '2026-07-13', NOW);

    expect(result.challenge).toBeNull();
    expect(result.entry).toEqual(completed); // untouched, per spec §6 "entry without content"
    expect(await store.getEntry('2026-07-13')).toEqual(completed);
  });

  it('selects from level 2 once level 1 is completed 7 times', async () => {
    const store = createMemoryAdapter();
    // 8 L1 challenges but only 7 completed: an unused L1 remains, so picking level 2
    // proves real progression, not the exhaustion fallback.
    const many = [
      'l1-001', 'l1-002', 'l1-003', 'l1-004', 'l1-005', 'l1-006', 'l1-007', 'l1-008',
      'l2-001', 'l2-002',
    ].map(challenge);
    for (let day = 1; day <= 7; day++) {
      await store.putEntry(entry(`2026-07-0${day}`, `l1-00${day}`));
    }

    const { challenge: picked } = await getTodaysChallenge(store, many, '2026-07-13', NOW);
    expect(picked!.level).toBe(2);
  });
});
