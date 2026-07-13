import { describe, expect, it } from 'vitest';
import type { Challenge } from '../domain/types';
import { challenges, contentVersion, validateChallenges, validateContentVersion } from './index';

function sample(overrides: Partial<Challenge> = {}): Challenge {
  return {
    id: 'l1-001',
    level: 1,
    category: 'two-minute',
    i18n: {
      pl: { lesson: 'lekcja', task: 'zadanie', reflection: 'refleksja' },
      en: { lesson: 'lesson', task: 'task', reflection: 'reflection' },
    },
    ...overrides,
  };
}

describe('bundled challenges.json', () => {
  it('passes validation on import (would throw otherwise)', () => {
    expect(challenges.length).toBeGreaterThan(0);
    expect(contentVersion).toBeGreaterThanOrEqual(1);
  });

  it('has every level represented', () => {
    for (const level of [1, 2, 3]) {
      expect(challenges.some((c) => c.level === level)).toBe(true);
    }
  });
});

describe('validateChallenges', () => {
  it('rejects malformed and duplicate ids', () => {
    const bad = [
      sample({ id: 'L1-001' }),
      sample({ id: 'l1-002' }),
      sample({ id: 'l1-002' }),
    ];
    try {
      validateChallenges(bad, 0);
      expect.unreachable('should have thrown');
    } catch (e) {
      const message = (e as Error).message;
      expect(message).toContain('invalid id format: "L1-001"');
      expect(message).toContain('duplicate id: "l1-002"');
    }
  });

  it('rejects the reserved id number 000 — ids are immutable, a typo would be permanent', () => {
    expect(() => validateChallenges([sample({ id: 'l1-000' })], 0)).toThrow(/invalid id format: "l1-000"/);
  });

  it('rejects an unknown category', () => {
    // @ts-expect-error — simulating hand-edited JSON with a category outside the union
    expect(() => validateChallenges([sample({ category: 'planning' })], 0)).toThrow(/unknown category "planning"/);
  });

  it('rejects an unknown language key — no stray translations', () => {
    const withGerman = sample();
    // @ts-expect-error — simulating hand-edited JSON with an extra language
    withGerman.i18n.de = { lesson: 'x', task: 'x', reflection: 'x' };
    expect(() => validateChallenges([withGerman], 0)).toThrow(/unknown language "de"/);
  });

  it('collects a non-string field as an error instead of crashing', () => {
    const numericTask = sample();
    // @ts-expect-error — simulating hand-edited JSON with a wrong value type
    numericTask.i18n.pl.task = 42;
    expect(() => validateChallenges([numericTask], 0)).toThrow(/empty pl.task/);
  });

  it('rejects an id whose encoded level disagrees with the level field', () => {
    expect(() => validateChallenges([sample({ id: 'l2-001', level: 1 })], 0)).toThrow(
      /id encodes level 2 but level is 1/,
    );
  });

  it('rejects missing or empty translations — no silent fallback (spec §6)', () => {
    const missingEn = sample();
    // @ts-expect-error — simulating a hand-edited JSON with a missing language
    delete missingEn.i18n.en;
    expect(() => validateChallenges([missingEn], 0)).toThrow(/missing "en" content/);

    const emptyTask = sample({
      i18n: {
        pl: { lesson: 'l', task: '   ', reflection: 'r' },
        en: { lesson: 'l', task: 't', reflection: 'r' },
      },
    });
    expect(() => validateChallenges([emptyTask], 0)).toThrow(/empty pl.task/);
  });

  it('enforces the per-level minimum', () => {
    expect(() => validateChallenges([sample()], 2)).toThrow(/level 1 has 1 challenges, minimum is 2/);
  });

  it('rejects a non-positive or non-integer contentVersion', () => {
    expect(() => validateContentVersion(0)).toThrow(/contentVersion/);
    expect(() => validateContentVersion(1.5)).toThrow(/contentVersion/);
    expect(() => validateContentVersion('1')).toThrow(/contentVersion/);
    expect(validateContentVersion(3)).toBe(3);
  });

  it('collects ALL errors in one throw instead of failing on the first', () => {
    const bad = [sample({ id: 'broken' }), sample({ id: 'l9-001' })];
    try {
      validateChallenges(bad, 0);
      expect.unreachable('should have thrown');
    } catch (e) {
      const message = (e as Error).message;
      expect(message).toContain('"broken"');
      expect(message).toContain('"l9-001"');
    }
  });
});
