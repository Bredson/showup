import { describe, expect, it } from 'vitest';
import { buildExportBlob } from './export';
import { validateExportBlob } from './import';
import type { LegacyDailyEntry, LegacyUserProfile } from './types';

const CURRENT = 1;

const profile: LegacyUserProfile = {
  id: 'singleton',
  language: 'pl',
  startDate: '2026-07-01',
  quiz: { answers: { q1: 'a', q2: ['x', 'y'] }, dominantTriggers: ['anxiety'], completedAt: '2026-07-01T09:00:00.000Z' },
  createdAt: '2026-07-01T09:00:00.000Z',
};

function entry(date: string): LegacyDailyEntry {
  return {
    date,
    challengeId: 'l1-003',
    emotionBefore: 'boredom',
    ifThen: null,
    status: 'completed',
    reflection: 'ok',
    completedAt: `${date}T12:00:00.000Z`,
    updatedAt: `${date}T12:00:00.000Z`,
  };
}

/** The exact scenario import exists for: a file produced by our own export. */
function validBlob() {
  const blob = buildExportBlob(profile, [entry('2026-07-01'), entry('2026-07-02')], CURRENT, '2026-07-02T20:00:00.000Z');
  // Simulate the real path: serialized to a file, parsed back as untrusted JSON.
  return JSON.parse(JSON.stringify(blob)) as unknown;
}

describe('validateExportBlob', () => {
  it('accepts a round-tripped export file', () => {
    const result = validateExportBlob(validBlob(), CURRENT);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.blob.entries).toHaveLength(2);
      expect(result.blob.profile.language).toBe('pl');
    }
  });

  it('accepts an export with zero entries (fresh install backup)', () => {
    const blob = JSON.parse(
      JSON.stringify(buildExportBlob(profile, [], CURRENT, '2026-07-02T20:00:00.000Z')),
    ) as unknown;
    expect(validateExportBlob(blob, CURRENT).ok).toBe(true);
  });

  it('rejects non-objects and files from other apps', () => {
    for (const raw of [null, 42, 'showup', [], { app: 'other-app' }]) {
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

  it('rejects a broken schemaVersion as invalid, not newer', () => {
    for (const version of [0, 1.5, '1', undefined]) {
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
    const raw = validBlob() as { entries: LegacyDailyEntry[] };
    raw.entries[1]!.date = raw.entries[0]!.date;
    const result = validateExportBlob(raw, CURRENT);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.some((e) => e.includes('duplicate date'))).toBe(true);
  });

  it('rejects a mangled profile (unknown language, bad quiz)', () => {
    const raw = validBlob() as { profile: Record<string, unknown> };
    raw.profile.language = 'de';
    raw.profile.quiz = { answers: 'none' };
    const result = validateExportBlob(raw, CURRENT);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.some((e) => e.includes('profile.language'))).toBe(true);
      expect(result.errors.some((e) => e.includes('quiz.answers'))).toBe(true);
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

  it('rejects quiz answers whose values are not strings or string arrays', () => {
    const raw = validBlob() as { profile: { quiz: { answers: Record<string, unknown> } } };
    raw.profile.quiz.answers.q3 = 7;
    const result = validateExportBlob(raw, CURRENT);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.some((e) => e.includes('quiz.answers'))).toBe(true);
  });

  it('does not report a noise duplicate when two entries both lack a date', () => {
    const raw = validBlob() as { entries: Record<string, unknown>[] };
    delete raw.entries[0]!.date;
    delete raw.entries[1]!.date;
    const result = validateExportBlob(raw, CURRENT);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.some((e) => e.includes('duplicate'))).toBe(false);
  });

  it('accepts unknown challengeIds — entries survive content deploys (spec §6)', () => {
    const raw = validBlob() as { entries: LegacyDailyEntry[] };
    raw.entries[0]!.challengeId = 'l9-999';
    expect(validateExportBlob(raw, CURRENT).ok).toBe(true);
  });

  it('rejects entries with missing nullable fields set to wrong types', () => {
    const raw = validBlob() as { entries: Record<string, unknown>[] };
    raw.entries[0]!.reflection = 7;
    raw.entries[0]!.completedAt = false;
    const result = validateExportBlob(raw, CURRENT);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.some((e) => e.includes('reflection'))).toBe(true);
      expect(result.errors.some((e) => e.includes('completedAt'))).toBe(true);
    }
  });
});
