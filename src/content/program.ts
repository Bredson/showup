// Showup — program parameters loader + validation (docs/data-model.md §6).
// Importing this module throws on an invalid program.json; the prebuild content
// test gate ("vitest run src/content") turns that into a failed build.

import type { ProgramBracket, ProgramConfig, ProgramSet, ProgramWeek, Variant } from '../domain/types';
import raw from './program.json';

/** Compile-error lockstep with the Variant union (same pattern as challenges CATEGORY_SET). */
const VARIANT_SET = {
  wall: true,
  'incline-high': true,
  'incline-low': true,
  knee: true,
  full: true,
} as const satisfies Record<Variant, true>;
const VARIANT_LADDER = ['wall', 'incline-high', 'incline-low', 'knee', 'full'] as const;

const GOAL_MT = 100;
const SETS_PER_WEEK = 5;
const TRAINING_WEEKS = 3;

function isFraction(x: unknown): x is number {
  return typeof x === 'number' && Number.isFinite(x) && x > 0 && x < 1;
}

function isDeloadWeek(w: ProgramWeek): w is { deload: true } {
  return 'deload' in w && w.deload === true;
}

export function validateProgram(config: ProgramConfig): ProgramConfig {
  const errors: string[] = [];

  if (!Number.isInteger(config.programVersion) || config.programVersion < 1) {
    errors.push(`programVersion must be an integer >= 1, got ${config.programVersion}`);
  }

  // Variant ladder must match the domain union, in order.
  if (
    config.variants.length !== VARIANT_LADDER.length ||
    config.variants.some((v, i) => v !== VARIANT_LADDER[i] || !(v in VARIANT_SET))
  ) {
    errors.push(`variants must equal the ladder [${VARIANT_LADDER.join(', ')}] in order`);
  }

  // Thresholds and factors.
  if (!Number.isInteger(config.variantEntryMinMT) || config.variantEntryMinMT < 1) {
    errors.push('variantEntryMinMT must be an integer >= 1');
  }
  if (!Number.isInteger(config.fullEntryMinMT) || config.fullEntryMinMT < 1) {
    errors.push('fullEntryMinMT must be an integer >= 1');
  }
  if (!Number.isInteger(config.variantGraduateMT) || config.variantGraduateMT < 1) {
    errors.push('variantGraduateMT must be an integer >= 1');
  }
  if (!isFraction(config.variantSeedFactor)) errors.push('variantSeedFactor must be in (0, 1)');
  if (!isFraction(config.testGateImprovement)) errors.push('testGateImprovement must be in (0, 1)');
  if (!isFraction(config.deloadVolumeFactor)) errors.push('deloadVolumeFactor must be in (0, 1)');
  const [easyMin, easyMax] = config.easySetFactor;
  if (!isFraction(easyMin) || !isFraction(easyMax) || easyMin > easyMax) {
    errors.push('easySetFactor must be [min, max] with 0 < min <= max < 1');
  }

  // Brackets: sorted, adjacent, covering min(entry thresholds)–100 (data-model §6).
  const entryFloor = Math.min(config.fullEntryMinMT, config.variantEntryMinMT);
  const brackets = config.brackets;
  const first = brackets[0];
  const lastBracket = brackets[brackets.length - 1];
  if (first === undefined || lastBracket === undefined) {
    errors.push('at least one bracket is required');
  } else {
    if (first.minMT > entryFloor) {
      errors.push(
        `first bracket must start at or below the entry floor ${entryFloor}, starts at ${first.minMT}`,
      );
    }
    if (lastBracket.maxMT < GOAL_MT) {
      errors.push(`last bracket must reach ${GOAL_MT}, ends at ${lastBracket.maxMT}`);
    }
  }
  const seenIds = new Set<string>();
  brackets.forEach((b, i) => {
    const where = `bracket "${b.id}" (#${i})`;
    if (seenIds.has(b.id)) errors.push(`duplicate bracket id "${b.id}"`);
    seenIds.add(b.id);
    if (!Number.isInteger(b.minMT) || !Number.isInteger(b.maxMT) || b.minMT > b.maxMT) {
      errors.push(`${where}: minMT/maxMT must be integers with minMT <= maxMT`);
    }
    const prev = brackets[i - 1];
    if (prev !== undefined && b.minMT !== prev.maxMT + 1) {
      errors.push(`${where}: must start at ${prev.maxMT + 1} (adjacent, no gaps/overlaps)`);
    }
    validateBracketWeeks(b, where, errors);
  });

  if (errors.length > 0) {
    throw new Error(`program.json is invalid:\n- ${errors.join('\n- ')}`);
  }
  return config;
}

function validateBracketWeeks(b: ProgramBracket, where: string, errors: string[]): void {
  if (b.weeks.length !== TRAINING_WEEKS + 1) {
    errors.push(`${where}: must have exactly ${TRAINING_WEEKS + 1} weeks`);
    return;
  }
  const last = b.weeks[TRAINING_WEEKS];
  if (last === undefined || !isDeloadWeek(last)) errors.push(`${where}: week 4 must be { deload: true }`);

  const trainingWeeks: ProgramSet[][] = [];
  for (let w = 0; w < TRAINING_WEEKS; w++) {
    const week = b.weeks[w];
    if (week === undefined || isDeloadWeek(week) || !Array.isArray(week.sets)) {
      errors.push(`${where}: week ${w + 1} must have a sets array`);
      return;
    }
    const sets = week.sets;
    if (sets.length !== SETS_PER_WEEK) {
      errors.push(`${where}: week ${w + 1} must have exactly ${SETS_PER_WEEK} sets`);
    }
    sets.forEach((s, si) => {
      const isLast = si === sets.length - 1;
      if (s === 'A') {
        if (!isLast) errors.push(`${where}: week ${w + 1}: "A" allowed only as the last set`);
      } else if (!isFraction(s)) {
        errors.push(`${where}: week ${w + 1} set ${si + 1}: must be a fraction in (0, 1) or "A"`);
      }
    });
    trainingWeeks.push(sets);
  }

  // Non-decreasing multipliers week 1 → 3, per set position (actual "A" cells skipped,
  // not just the last slot — a numeric last set is checked too).
  for (let si = 0; si < SETS_PER_WEEK; si++) {
    for (let w = 1; w < trainingWeeks.length; w++) {
      const prev = trainingWeeks[w - 1]?.[si];
      const cur = trainingWeeks[w]?.[si];
      if (typeof prev === 'number' && typeof cur === 'number' && cur < prev) {
        errors.push(`${where}: set ${si + 1} decreases from week ${w} to week ${w + 1}`);
      }
    }
  }
}

export const program: ProgramConfig = validateProgram(raw as ProgramConfig);
