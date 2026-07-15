import { describe, expect, it } from 'vitest';
import { buildExportBlob } from './export';
import { validateExportBlob } from './import';
import { buildOnboardingRecords, type OnboardingInput } from './onboarding';

const BASE: OnboardingInput = {
  language: 'pl',
  today: '2026-07-15',
  now: '2026-07-15T18:30:00.000Z',
  disclaimerAcceptedAt: '2026-07-15T18:25:00.000Z',
  sessionDays: [1, 3, 5],
  ifThen: 'Kiedy zaparzę poranną kawę, robię sesję',
  lastAttempt: { variant: 'full', result: 12 },
};

describe('buildOnboardingRecords', () => {
  it('builds the singleton profile with startDate = today', () => {
    const { profile } = buildOnboardingRecords(BASE);
    expect(profile).toEqual({
      id: 'singleton',
      language: 'pl',
      startDate: '2026-07-15',
      sessionDays: [1, 3, 5],
      ifThen: 'Kiedy zaparzę poranną kawę, robię sesję',
      disclaimerAcceptedAt: '2026-07-15T18:25:00.000Z',
      createdAt: '2026-07-15T18:30:00.000Z',
    });
  });

  it('builds ONE completed test entry on startDate from the last real attempt', () => {
    const { entry } = buildOnboardingRecords({ ...BASE, lastAttempt: { variant: 'knee', result: 8 } });
    expect(entry).toEqual({
      date: '2026-07-15',
      kind: 'test',
      variant: 'knee',
      feelBefore: null,
      downgradedTo: null,
      status: 'completed',
      sets: null,
      testResult: 8,
      easyContent: null,
      reflection: null,
      completedAt: '2026-07-15T18:30:00.000Z',
      updatedAt: '2026-07-15T18:30:00.000Z',
    });
  });

  it('stores a below-threshold last attempt verbatim (estimation is derived, not persisted)', () => {
    const { entry } = buildOnboardingRecords({ ...BASE, lastAttempt: { variant: 'knee', result: 2 } });
    expect(entry.variant).toBe('knee');
    expect(entry.testResult).toBe(2);
  });

  it('collapses a whitespace-only IF-THEN to null and trims a real one', () => {
    expect(buildOnboardingRecords({ ...BASE, ifThen: '   ' }).profile.ifThen).toBeNull();
    expect(buildOnboardingRecords({ ...BASE, ifThen: '  po kawie  ' }).profile.ifThen).toBe('po kawie');
  });

  it('copies sessionDays (later mutation of the input array must not leak into the profile)', () => {
    const days: [1, 3, 5] = [1, 3, 5];
    const { profile } = buildOnboardingRecords({ ...BASE, sessionDays: days });
    days[0] = 3 as never;
    expect(profile.sessionDays).toEqual([1, 3, 5]);
  });

  it('canonicalizes sessionDays to sorted order regardless of click order', () => {
    const { profile } = buildOnboardingRecords({ ...BASE, sessionDays: [5, 1, 3] });
    expect(profile.sessionDays).toEqual([1, 3, 5]);
  });

  it('throws on a non-integer or negative attempt result — UI gate failed', () => {
    expect(() => buildOnboardingRecords({ ...BASE, lastAttempt: { variant: 'full', result: -1 } })).toThrow(/result/);
    expect(() => buildOnboardingRecords({ ...BASE, lastAttempt: { variant: 'full', result: 7.5 } })).toThrow(/result/);
    expect(() => buildOnboardingRecords({ ...BASE, lastAttempt: { variant: 'full', result: NaN } })).toThrow(/result/);
  });

  it('round-trips through the export blob validator (§1 invariants cannot drift apart)', () => {
    for (const lastAttempt of [BASE.lastAttempt, { variant: 'knee' as const, result: 0 }]) {
      const { profile, entry } = buildOnboardingRecords({ ...BASE, lastAttempt });
      const blob = buildExportBlob(profile, [entry], 2, BASE.now);
      const result = validateExportBlob(blob, 2);
      expect(result).toEqual({ ok: true, blob });
    }
  });

  it('throws on invalid session days (adjacent, duplicates, wrong count) — UI gate failed', () => {
    expect(() => buildOnboardingRecords({ ...BASE, sessionDays: [1, 2, 4] })).toThrow(/session days/);
    expect(() => buildOnboardingRecords({ ...BASE, sessionDays: [1, 1, 4] })).toThrow(/session days/);
    expect(() => buildOnboardingRecords({ ...BASE, sessionDays: [1, 3] })).toThrow(/session days/);
    // wrap-around adjacency: Sunday(0) and Saturday(6) are neighbours
    expect(() => buildOnboardingRecords({ ...BASE, sessionDays: [0, 3, 6] })).toThrow(/session days/);
  });
});
