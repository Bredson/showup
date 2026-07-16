import { describe, expect, it } from 'vitest';
import type { ProgramConfig, ProgramWeek } from '../domain/types';
import { program, validateProgram } from './program';

/** Minimal valid config for mutation tests — independent of the shipped program.json. */
function validConfig(): ProgramConfig {
  const weeks: ProgramWeek[] = [
    { sets: [0.6, 0.7, 0.5, 0.5, 'A'] },
    { sets: [0.65, 0.75, 0.55, 0.55, 'A'] },
    { sets: [0.7, 0.8, 0.6, 0.6, 'A'] },
    { deload: true },
  ];
  return {
    programVersion: 1,
    variants: ['wall', 'incline-high', 'incline-low', 'knee', 'full'],
    variantEntryMinMT: 6,
    fullEntryMinMT: 5,
    variantGraduateMT: 20,
    variantSeedFactor: 0.4,
    testGateImprovement: 0.15,
    deloadVolumeFactor: 0.6,
    easySetFactor: [0.4, 0.5],
    restSeconds: 90,
    brackets: [
      { id: 'b1', minMT: 5, maxMT: 20, weeks: structuredClone(weeks) },
      { id: 'b2', minMT: 21, maxMT: 100, weeks: structuredClone(weeks) },
    ],
  };
}

describe('shipped program.json', () => {
  it('loads and passes validation at import time', () => {
    expect(program.programVersion).toBeGreaterThanOrEqual(1);
    expect(program.brackets.length).toBeGreaterThan(0);
  });

  it('covers the entry floor up to the 100 goal with adjacent brackets', () => {
    const floor = Math.min(program.fullEntryMinMT, program.variantEntryMinMT);
    expect(program.brackets[0]!.minMT).toBeLessThanOrEqual(floor);
    expect(program.brackets[program.brackets.length - 1]!.maxMT).toBeGreaterThanOrEqual(100);
  });
});

describe('validateProgram', () => {
  it('accepts a valid config', () => {
    expect(() => validateProgram(validConfig())).not.toThrow();
  });

  it('rejects a gap between brackets', () => {
    const c = validConfig();
    c.brackets[1]!.minMT = 25;
    expect(() => validateProgram(c)).toThrow(/adjacent/);
  });

  it('rejects overlapping brackets', () => {
    const c = validConfig();
    c.brackets[1]!.minMT = 18;
    expect(() => validateProgram(c)).toThrow(/adjacent/);
  });

  it('rejects a first bracket above the entry floor (the 6-vs-5 mismatch)', () => {
    const c = validConfig();
    c.brackets[0]!.minMT = 6; // fullEntryMinMT = 5 would be uncovered
    expect(() => validateProgram(c)).toThrow(/entry floor/);
  });

  it('rejects brackets that do not reach 100', () => {
    const c = validConfig();
    c.brackets[1]!.maxMT = 90;
    expect(() => validateProgram(c)).toThrow(/must reach 100/);
  });

  it('rejects "A" anywhere but the last set', () => {
    const c = validConfig();
    (c.brackets[0]!.weeks[0] as { sets: (number | 'A')[] }).sets = [0.6, 'A', 0.5, 0.5, 0.7];
    expect(() => validateProgram(c)).toThrow(/last set/);
  });

  it('rejects per-position decreasing multipliers across weeks', () => {
    const c = validConfig();
    (c.brackets[0]!.weeks[1] as { sets: (number | 'A')[] }).sets = [0.5, 0.75, 0.55, 0.55, 'A'];
    expect(() => validateProgram(c)).toThrow(/decreases/);
  });

  it('rejects a missing deload week', () => {
    const c = validConfig();
    c.brackets[0]!.weeks[3] = { sets: [0.7, 0.8, 0.6, 0.6, 'A'] };
    expect(() => validateProgram(c)).toThrow(/deload/);
  });

  it('rejects wrong set counts and out-of-range factors', () => {
    const c1 = validConfig();
    (c1.brackets[0]!.weeks[0] as { sets: (number | 'A')[] }).sets = [0.6, 0.7, 'A'];
    expect(() => validateProgram(c1)).toThrow(/exactly 5 sets/);

    const c2 = validConfig();
    c2.variantSeedFactor = 1.4;
    expect(() => validateProgram(c2)).toThrow(/variantSeedFactor/);
  });

  it('rejects a non-positive or fractional restSeconds', () => {
    const c1 = validConfig();
    c1.restSeconds = 0;
    expect(() => validateProgram(c1)).toThrow(/restSeconds/);

    const c2 = validConfig();
    c2.restSeconds = 90.5;
    expect(() => validateProgram(c2)).toThrow(/restSeconds/);
  });

  it('rejects a broken variant ladder', () => {
    const c = validConfig();
    c.variants = ['wall', 'knee', 'incline-low', 'incline-high', 'full'];
    expect(() => validateProgram(c)).toThrow(/ladder/);
  });

  it('collects all errors before throwing', () => {
    const c = validConfig();
    c.variantSeedFactor = 0;
    c.brackets[1]!.maxMT = 90;
    try {
      validateProgram(c);
      expect.unreachable('should have thrown');
    } catch (e) {
      const msg = (e as Error).message;
      expect(msg).toMatch(/variantSeedFactor/);
      expect(msg).toMatch(/must reach 100/);
    }
  });
});
