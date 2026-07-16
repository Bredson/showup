import { describe, expect, it } from 'vitest';
import { buildExportBlob } from './export';
import { validateExportBlob } from './import';
import type { DailyEntry, UserProfile } from './types';

// Deliberately a literal, not CURRENT_SCHEMA_VERSION: these tests pin the v2 blob
// format. A version bump must come with new fixtures, not silently re-aim old ones.
const CURRENT = 2;

const profile: UserProfile = {
  id: 'singleton',
  language: 'pl',
  startDate: '2026-07-01',
  sessionDays: [1, 3, 5],
  ifThen: 'Po porannej kawie robię pierwszą serię',
  disclaimerAcceptedAt: '2026-07-01T09:00:00.000Z',
  createdAt: '2026-07-01T09:00:00.000Z',
};

function entry(date: string, overrides: Partial<DailyEntry> = {}): DailyEntry {
  return {
    date,
    kind: 'session',
    variant: 'knee',
    feelBefore: 'ok',
    downgradedTo: null,
    status: 'completed',
    sets: [4, 5, 3, 3, 6],
    testResult: null,
    easyContent: null,
    longSetReps: null,
    reflection: 'ok',
    completedAt: `${date}T12:00:00.000Z`,
    updatedAt: `${date}T12:00:00.000Z`,
    ...overrides,
  };
}

/** The exact scenario import exists for: a file produced by our own export. */
function validBlob() {
  const blob = buildExportBlob(
    profile,
    [
      entry('2026-07-01', { kind: 'test', sets: null, testResult: 12, feelBefore: 'fresh' }),
      entry('2026-07-02'),
      entry('2026-07-03', {
        kind: 'easy',
        feelBefore: null,
        sets: null,
        easyContent: 'gtg-set',
        reflection: null,
      }),
    ],
    CURRENT,
    '2026-07-03T20:00:00.000Z',
  );
  // Simulate the real path: serialized to a file, parsed back as untrusted JSON.
  return JSON.parse(JSON.stringify(blob)) as unknown;
}

describe('validateExportBlob', () => {
  it('accepts a round-tripped export file', () => {
    const result = validateExportBlob(validBlob(), CURRENT);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.blob.entries).toHaveLength(3);
      expect(result.blob.profile.language).toBe('pl');
    }
  });

  it('rejects an export with zero entries — a profile cannot exist before the founding test', () => {
    const blob = JSON.parse(
      JSON.stringify(buildExportBlob(profile, [], CURRENT, '2026-07-03T20:00:00.000Z')),
    ) as unknown;
    const result = validateExportBlob(blob, CURRENT);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.join(' ')).toContain('no completed Max Test');
  });

  it('rejects entries without any completed Max Test (computeProgram would throw post-import)', () => {
    // Sessions only, and a test that was pain-degraded (degraded tests carry no result).
    const blob = JSON.parse(
      JSON.stringify(
        buildExportBlob(
          profile,
          [
            entry('2026-07-01'),
            entry('2026-07-02', {
              kind: 'test',
              feelBefore: 'pain',
              downgradedTo: 'easy',
              sets: null,
              easyContent: 'warmup',
            }),
          ],
          CURRENT,
          '2026-07-03T20:00:00.000Z',
        ),
      ),
    ) as unknown;
    const result = validateExportBlob(blob, CURRENT);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.join(' ')).toContain('no completed Max Test');
  });

  it('does not add a noise "no Max Test" error when the test entry itself is malformed', () => {
    const blob = JSON.parse(
      JSON.stringify(
        buildExportBlob(
          profile,
          [entry('2026-07-01', { kind: 'test', sets: null, testResult: -3, feelBefore: 'fresh' })],
          CURRENT,
          '2026-07-03T20:00:00.000Z',
        ),
      ),
    ) as unknown;
    const result = validateExportBlob(blob, CURRENT);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.join(' ')).not.toContain('no completed Max Test');
  });

  it('rejects non-objects and files from other apps', () => {
    for (const raw of [null, 42, 'showup', [], { app: 'unstuck' }]) {
      const result = validateExportBlob(raw, CURRENT);
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.reason).toBe('invalid');
    }
  });

  it('rejects a file from a newer app version with the dedicated reason', () => {
    const raw = validBlob() as Record<string, unknown>;
    raw.schemaVersion = CURRENT + 1;
    const result = validateExportBlob(raw, CURRENT);
    expect(result).toMatchObject({ ok: false, reason: 'newer' });
  });

  it('rejects a pre-rewrite v1 blob as invalid — no migration bridges the fork', () => {
    const raw = validBlob() as Record<string, unknown>;
    raw.schemaVersion = 1;
    const result = validateExportBlob(raw, CURRENT);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe('invalid');
      expect(result.errors.some((e) => e.includes('no migration'))).toBe(true);
    }
  });

  it('rejects a broken schemaVersion as invalid, not newer', () => {
    for (const version of [0, 1.5, '2', undefined]) {
      const raw = validBlob() as Record<string, unknown>;
      raw.schemaVersion = version;
      expect(validateExportBlob(raw, CURRENT)).toMatchObject({ ok: false, reason: 'invalid' });
    }
  });

  it('collects ALL entry problems instead of stopping at the first', () => {
    const raw = validBlob() as { entries: Record<string, unknown>[] };
    raw.entries[0]!.status = 'paused';
    raw.entries[1]!.date = 'yesterday';
    const result = validateExportBlob(raw, CURRENT);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.some((e) => e.includes('entries[0].status'))).toBe(true);
      expect(result.errors.some((e) => e.includes('entries[1].date'))).toBe(true);
    }
  });

  it('rejects duplicate entry dates (date is the primary key)', () => {
    const raw = validBlob() as { entries: DailyEntry[] };
    raw.entries[1]!.date = raw.entries[0]!.date;
    const result = validateExportBlob(raw, CURRENT);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.some((e) => e.includes('duplicate date'))).toBe(true);
  });

  it('rejects a mangled profile (unknown language, bad session days)', () => {
    const raw = validBlob() as { profile: Record<string, unknown> };
    raw.profile.language = 'de';
    raw.profile.sessionDays = [1, 2, 3]; // adjacent days — onboarding would never produce this
    const result = validateExportBlob(raw, CURRENT);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.some((e) => e.includes('profile.language'))).toBe(true);
      expect(result.errors.some((e) => e.includes('profile.sessionDays'))).toBe(true);
    }
  });

  it('rejects sessionDays that are not weekdays at all', () => {
    for (const days of [undefined, 'mon,wed,fri', [1, 3, 7], [1, 3, 5.5]]) {
      const raw = validBlob() as { profile: Record<string, unknown> };
      raw.profile.sessionDays = days;
      const result = validateExportBlob(raw, CURRENT);
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.errors.some((e) => e.includes('profile.sessionDays'))).toBe(true);
    }
  });

  it('rejects a non-parseable exportedAt (the confirm UI renders this date)', () => {
    for (const exportedAt of [undefined, 42, 'yes', '2026-13-99T99:00:00.000Z', 'garbageT00:00:00']) {
      const raw = validBlob() as Record<string, unknown>;
      raw.exportedAt = exportedAt;
      const result = validateExportBlob(raw, CURRENT);
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.errors.some((e) => e.includes('exportedAt'))).toBe(true);
    }
  });

  it('rejects unknown enum values on entries (variant, feel, easyContent)', () => {
    const raw = validBlob() as { entries: Record<string, unknown>[] };
    raw.entries[1]!.variant = 'planche';
    raw.entries[1]!.feelBefore = 'meh';
    raw.entries[2]!.easyContent = 'sprint';
    const result = validateExportBlob(raw, CURRENT);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.some((e) => e.includes('entries[1].variant'))).toBe(true);
      expect(result.errors.some((e) => e.includes('entries[1].feelBefore'))).toBe(true);
      expect(result.errors.some((e) => e.includes('entries[2].easyContent'))).toBe(true);
    }
  });

  it('rejects sets that are not arrays of non-negative integers', () => {
    for (const sets of ['5,6,4', [4, -1], [4, 2.5], [4, '5']]) {
      const raw = validBlob() as { entries: Record<string, unknown>[] };
      raw.entries[1]!.sets = sets;
      const result = validateExportBlob(raw, CURRENT);
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.errors.some((e) => e.includes('entries[1].sets'))).toBe(true);
    }
  });

  it('enforces easy-day invariants: feelBefore and downgradedTo must be null', () => {
    const raw = validBlob() as { entries: Record<string, unknown>[] };
    raw.entries[2]!.feelBefore = 'tired';
    raw.entries[2]!.downgradedTo = 'easy';
    const result = validateExportBlob(raw, CURRENT);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.some((e) => e.includes('entries[2].feelBefore'))).toBe(true);
      expect(result.errors.some((e) => e.includes('entries[2].downgradedTo'))).toBe(true);
    }
  });

  it('rejects downgradedTo values other than null or "easy"', () => {
    const raw = validBlob() as { entries: Record<string, unknown>[] };
    raw.entries[1]!.downgradedTo = 'session';
    const result = validateExportBlob(raw, CURRENT);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.some((e) => e.includes('entries[1].downgradedTo'))).toBe(true);
  });

  it('accepts a degraded session (downgradedTo "easy" on a session entry)', () => {
    const raw = validBlob() as { entries: Record<string, unknown>[] };
    raw.entries[1]!.feelBefore = 'pain';
    raw.entries[1]!.downgradedTo = 'easy';
    raw.entries[1]!.sets = null; // degraded day: what happened lives in easyContent
    raw.entries[1]!.easyContent = 'gtg-set';
    expect(validateExportBlob(raw, CURRENT).ok).toBe(true);
  });

  it('rejects result fields on the wrong day shape (sets/testResult/easyContent/reflection)', () => {
    const raw = validBlob() as { entries: Record<string, unknown>[] };
    raw.entries[0]!.sets = [5, 5]; // test day recording session sets
    raw.entries[1]!.testResult = 20; // session day recording a test result
    raw.entries[1]!.easyContent = 'warmup'; // non-degraded session with easy content
    raw.entries[2]!.reflection = 'nice'; // easy day with a reflection
    const result = validateExportBlob(raw, CURRENT);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.some((e) => e.includes('entries[0].sets'))).toBe(true);
      expect(result.errors.some((e) => e.includes('entries[1].testResult'))).toBe(true);
      expect(result.errors.some((e) => e.includes('entries[1].easyContent'))).toBe(true);
      expect(result.errors.some((e) => e.includes('entries[2].reflection'))).toBe(true);
    }
  });

  it('accepts longSetReps: missing key (pre-feature blob), null, or int >= 1 on a long-set day', () => {
    // A blob exported before the feature has no longSetReps key at all — it must import cleanly.
    const preFeature = validBlob() as { entries: Record<string, unknown>[] };
    for (const e of preFeature.entries) delete e.longSetReps;
    expect(validateExportBlob(preFeature, CURRENT).ok).toBe(true);

    const raw = validBlob() as { entries: Record<string, unknown>[] };
    raw.entries[2]!.easyContent = 'long-set';
    raw.entries[2]!.longSetReps = 32;
    expect(validateExportBlob(raw, CURRENT).ok).toBe(true);

    raw.entries[2]!.longSetReps = null;
    expect(validateExportBlob(raw, CURRENT).ok).toBe(true);
  });

  it('rejects malformed longSetReps and reps outside a long-set day', () => {
    const bad = [0, 1.5, '32'];
    for (const v of bad) {
      const raw = validBlob() as { entries: Record<string, unknown>[] };
      raw.entries[2]!.easyContent = 'long-set';
      raw.entries[2]!.longSetReps = v;
      const result = validateExportBlob(raw, CURRENT);
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.errors.some((e) => e.includes('entries[2].longSetReps'))).toBe(true);
    }

    // Valid number, wrong day shape: easyContent is not 'long-set'.
    const raw = validBlob() as { entries: Record<string, unknown>[] };
    raw.entries[2]!.longSetReps = 32; // easyContent stays 'gtg-set'
    const result = validateExportBlob(raw, CURRENT);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.some((e) => e.includes('entries[2].longSetReps'))).toBe(true);
  });

  it('rejects a long set on a pain-degraded day (never offered, would poison the weekly cadence)', () => {
    const raw = validBlob() as { entries: Record<string, unknown>[] };
    raw.entries[1]!.feelBefore = 'pain';
    raw.entries[1]!.downgradedTo = 'easy';
    raw.entries[1]!.sets = null;
    raw.entries[1]!.easyContent = 'long-set';
    const result = validateExportBlob(raw, CURRENT);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.some((e) => e.includes('entries[1].easyContent'))).toBe(true);
  });

  it('rejects sets on a degraded session (the degradation replaced them)', () => {
    const raw = validBlob() as { entries: Record<string, unknown>[] };
    raw.entries[1]!.feelBefore = 'pain';
    raw.entries[1]!.downgradedTo = 'easy';
    raw.entries[1]!.sets = [3];
    raw.entries[1]!.easyContent = 'gtg-set';
    const result = validateExportBlob(raw, CURRENT);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.some((e) => e.includes('entries[1].sets'))).toBe(true);
  });

  it('does not report a noise duplicate when two entries both lack a date', () => {
    const raw = validBlob() as { entries: Record<string, unknown>[] };
    delete raw.entries[0]!.date;
    delete raw.entries[1]!.date;
    const result = validateExportBlob(raw, CURRENT);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.some((e) => e.includes('duplicate'))).toBe(false);
  });

  it('rejects entries with nullable fields set to wrong types', () => {
    const raw = validBlob() as { entries: Record<string, unknown>[] };
    raw.entries[1]!.reflection = 7;
    raw.entries[1]!.completedAt = false;
    raw.entries[1]!.testResult = 'many';
    const result = validateExportBlob(raw, CURRENT);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.some((e) => e.includes('reflection'))).toBe(true);
      expect(result.errors.some((e) => e.includes('completedAt'))).toBe(true);
      expect(result.errors.some((e) => e.includes('testResult'))).toBe(true);
    }
  });
});
