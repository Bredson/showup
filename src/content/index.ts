// Showup — static challenge content. Source of truth: docs/data-model.md §6.
// Bundled with the app, never stored in IndexedDB. Content update = deploy.
// Build gate: `npm run build` runs `prebuild` (vitest on src/content), which imports
// this module — an invalid catalog fails the build, it never reaches users.

import type { Challenge, ChallengeCategory, DifficultyLevel } from '../domain/types';
import raw from './challenges.json';

// 000 is reserved-invalid: ids are immutable forever, so an accidental l1-000 would be permanent.
const ID_FORMAT = /^l([123])-(?!000)\d{3}$/;

// `satisfies` keeps this in lockstep with the ChallengeCategory union in domain/types.ts:
// adding a category to the union without updating this map is a compile error (review M4).
const CATEGORY_SET = {
  'small-steps': true,
  'two-minute': true,
  emotion: true,
  starting: true,
} as const satisfies Record<ChallengeCategory, true>;
const CATEGORIES = Object.keys(CATEGORY_SET);

const LANGS = ['pl', 'en'] as const;
const FIELDS = ['lesson', 'task', 'reflection'] as const;

// Spec §6: at least 10 challenges per level (Faza 5 catalog).
const MIN_PER_LEVEL = 10;

/**
 * Validates the challenge catalog. Throws with a list of ALL problems (not just the first) —
 * a broken deploy should be loud and easy to fix in one pass. No silent fallbacks (spec §6).
 * Input is treated as untrusted (hand-edited JSON), hence the runtime typeof checks.
 */
export function validateChallenges(
  challenges: Challenge[],
  minPerLevel: number = MIN_PER_LEVEL,
): Challenge[] {
  const errors: string[] = [];
  const seen = new Set<string>();
  const perLevel: Record<DifficultyLevel, number> = { 1: 0, 2: 0, 3: 0 };

  for (const c of challenges) {
    const match = ID_FORMAT.exec(c.id);
    if (!match) {
      errors.push(`invalid id format: "${c.id}"`);
      continue;
    }
    if (seen.has(c.id)) errors.push(`duplicate id: "${c.id}"`);
    seen.add(c.id);

    if (Number(match[1]) !== c.level) errors.push(`${c.id}: id encodes level ${match[1]} but level is ${c.level}`);
    if (!CATEGORIES.includes(c.category)) errors.push(`${c.id}: unknown category "${c.category}"`);

    for (const key of Object.keys(c.i18n ?? {})) {
      if (!(LANGS as readonly string[]).includes(key)) errors.push(`${c.id}: unknown language "${key}"`);
    }
    for (const lang of LANGS) {
      const content: unknown = c.i18n?.[lang];
      if (typeof content !== 'object' || content === null) {
        errors.push(`${c.id}: missing "${lang}" content`);
        continue;
      }
      for (const field of FIELDS) {
        const value = (content as Record<string, unknown>)[field];
        if (typeof value !== 'string' || !value.trim()) errors.push(`${c.id}: empty ${lang}.${field}`);
      }
    }
    perLevel[c.level] += 1;
  }

  for (const level of [1, 2, 3] as const) {
    if (perLevel[level] < minPerLevel) {
      errors.push(`level ${level} has ${perLevel[level]} challenges, minimum is ${minPerLevel}`);
    }
  }

  if (errors.length > 0) {
    throw new Error(`challenges.json is invalid:\n- ${errors.join('\n- ')}`);
  }
  return challenges;
}

/** Validates the catalog-level contentVersion field (spec §6: positive integer). */
export function validateContentVersion(version: unknown): number {
  if (typeof version !== 'number' || !Number.isInteger(version) || version < 1) {
    throw new Error(`challenges.json is invalid:\n- contentVersion must be an integer >= 1, got ${JSON.stringify(version)}`);
  }
  return version;
}

export const contentVersion: number = validateContentVersion(raw.contentVersion);

/** The validated catalog — import this, never challenges.json directly. */
export const challenges: Challenge[] = validateChallenges(raw.challenges as Challenge[]);

/** Shared id lookup — screens must import this instead of rebuilding their own Map. */
export const challengeById: ReadonlyMap<string, Challenge> = new Map(challenges.map((c) => [c.id, c]));
