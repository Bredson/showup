import { describe, expect, it } from 'vitest';
import type { Challenge, ChallengeStatus, LegacyDailyEntry, DifficultyLevel } from './types';
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

function entry(date: string, challengeId: string, status: ChallengeStatus = 'completed'): LegacyDailyEntry {
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

  it('soft restart: 30+ missed days assign a one-level-gentler challenge (ux-spec §7)', async () => {
    const store = createMemoryAdapter();
    // 7 L1 completions → user is at level 2; last activity 2026-06-07, today 2026-07-13 → 35 missed days.
    const many = [
      'l1-001', 'l1-002', 'l1-003', 'l1-004', 'l1-005', 'l1-006', 'l1-007', 'l1-008',
      'l2-001', 'l2-002',
    ].map(challenge);
    for (let day = 1; day <= 7; day++) {
      await store.putEntry(entry(`2026-06-0${day}`, `l1-00${day}`));
    }

    const { challenge: picked } = await getTodaysChallenge(store, many, '2026-07-13', NOW);
    expect(picked?.level).toBe(1); // level 2 user, but the comeback day starts gentler
  });

  it('soft restart does not trigger below 30 missed days', async () => {
    const store = createMemoryAdapter();
    const many = [
      'l1-001', 'l1-002', 'l1-003', 'l1-004', 'l1-005', 'l1-006', 'l1-007', 'l1-008',
      'l2-001', 'l2-002',
    ].map(challenge);
    for (let day = 1; day <= 7; day++) {
      await store.putEntry(entry(`2026-06-2${day}`, `l1-00${day}`));
    }

    // last entry 2026-06-27, today 2026-07-13 → 15 missed days → normal level 2
    const { challenge: picked } = await getTodaysChallenge(store, many, '2026-07-13', NOW);
    expect(picked?.level).toBe(2);
  });

  it('soft restart boundary: triggers at exactly 30 missed days, not at 29 (>= in spec §7)', async () => {
    const many = [
      'l1-001', 'l1-002', 'l1-003', 'l1-004', 'l1-005', 'l1-006', 'l1-007', 'l1-008',
      'l2-001', 'l2-002',
    ].map(challenge);
    const seed = async (store: ReturnType<typeof createMemoryAdapter>, lastDay: number) => {
      for (let i = 6; i >= 0; i--) {
        const day = String(lastDay - i).padStart(2, '0');
        await store.putEntry(entry(`2026-06-${day}`, `l1-00${7 - i}`));
      }
    };

    // last entry 2026-06-12, today 2026-07-13 → exactly 30 missed days → gentler level 1
    const at30 = createMemoryAdapter();
    await seed(at30, 12);
    const { challenge: gentler } = await getTodaysChallenge(at30, many, '2026-07-13', NOW);
    expect(gentler?.level).toBe(1);

    // last entry 2026-06-13, today 2026-07-13 → 29 missed days → normal level 2
    const at29 = createMemoryAdapter();
    await seed(at29, 13);
    const { challenge: normal } = await getTodaysChallenge(at29, many, '2026-07-13', NOW);
    expect(normal?.level).toBe(2);
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
