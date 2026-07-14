// Unstuck — daily challenge selection. Source of truth: docs/data-model.md §4.
// RULE: no React/storage imports. The narrow port below is satisfied structurally by
// StorageAdapter, so the domain stays import-free while accepting the adapter as an argument.

import type { Challenge, DailyEntry, DifficultyLevel, ISODate, ISODateTime } from './types';
import { computeProgress } from './streak';
import { gentlerLevel, missedDaysBefore, SOFT_RESTART_MISSED_DAYS } from './comeback';

/** The slice of StorageAdapter this module needs (structural typing keeps layers decoupled). */
export interface DailyEntryStore {
  getEntry(date: ISODate): Promise<DailyEntry | null>;
  putEntry(e: DailyEntry): Promise<void>;
  getAllEntries(): Promise<DailyEntry[]>;
}

/** FNV-1a 32-bit — deterministic "random" pick from the pool, stable for a given date. */
export function fnv1aHash(input: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/**
 * Pure selection per spec §4:
 * 1. unused challenges of `level` (sorted by id), picked by fnv1a(date) % pool size
 * 2. fallback: unused from level+1
 * 3. fallback: least-recently-used from `level` (repeats allowed once content is exhausted)
 * A skipped/missed day consumes its challenge (it appears in entries → counts as used).
 */
export function selectChallenge(
  challenges: Challenge[],
  entries: DailyEntry[],
  level: DifficultyLevel,
  today: ISODate,
): Challenge {
  const used = new Set(entries.map((e) => e.challengeId));
  const unusedAt = (l: DifficultyLevel) =>
    challenges.filter((c) => c.level === l && !used.has(c.id)).sort(byId);

  let pool = unusedAt(level);
  if (pool.length === 0 && level < 3) {
    pool = unusedAt((level + 1) as DifficultyLevel);
  }
  const picked = pool[fnv1aHash(today) % pool.length];
  if (picked !== undefined) return picked;
  return leastRecentlyUsed(challenges, entries, level);
}

function leastRecentlyUsed(
  challenges: Challenge[],
  entries: DailyEntry[],
  level: DifficultyLevel,
): Challenge {
  const candidates = challenges.filter((c) => c.level === level).sort(byId);
  const first = candidates[0];
  if (first === undefined) {
    throw new Error(`No challenges exist for level ${level} — content is broken`);
  }
  const lastUsed = new Map<string, ISODate>();
  for (const e of [...entries].sort((a, b) => (a.date < b.date ? -1 : 1))) {
    lastUsed.set(e.challengeId, e.date); // later entries overwrite → final value = most recent use
  }
  // NOTE: the '' fallback below is defensive-only — via selectChallenge this branch is reached
  // only when every candidate is used; a never-used candidate ('' sorts first) would win, correctly.
  let best = first;
  for (const c of candidates) {
    const cUsed = lastUsed.get(c.id) ?? '';
    const bestUsed = lastUsed.get(best.id) ?? '';
    if (cUsed < bestUsed) best = c;
  }
  return best;
}

function byId(a: Challenge, b: Challenge): number {
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

/**
 * Returns today's challenge, assigning it on first open of the day (spec §4: assignment is
 * persistent — an app restart never changes the challenge).
 *
 * `challenge` is null only when the day is already finished (completed/skipped) AND a content
 * deploy removed its challenge — the journal entry stays untouched per spec §6 ("entry without
 * content") and the UI renders the finished state without task text.
 *
 * NOTE: the shell derives "first open of the day" (comeback interstitial, ux-spec §7) from an
 * entries read taken BEFORE this call — see the boot effect in App.tsx for the why.
 */
export async function getTodaysChallenge(
  store: DailyEntryStore,
  challenges: Challenge[],
  today: ISODate,
  now: ISODateTime,
): Promise<{ challenge: Challenge | null; entry: DailyEntry }> {
  const existing = await store.getEntry(today);
  if (existing) {
    const assigned = challenges.find((c) => c.id === existing.challengeId);
    if (assigned) return { challenge: assigned, entry: existing };
    // Assigned challenge vanished (content deploy, spec §6). Reassigning is allowed ONLY while
    // the day is still in progress — rewriting challengeId on a completed/skipped entry would
    // falsify the journal and skew completedByLevel/level progression.
    if (existing.status !== 'in_progress') {
      return { challenge: null, entry: existing };
    }
  }

  const entries = await store.getAllEntries();
  const progress = computeProgress(entries, today);
  // Soft restart (ux-spec §7): after 30+ missed days the comeback day is one level gentler.
  // Applied at assignment only — the persisted challengeId keeps it stable across restarts.
  const level =
    missedDaysBefore(entries, today) >= SOFT_RESTART_MISSED_DAYS
      ? gentlerLevel(progress.currentLevel)
      : progress.currentLevel;
  const challenge = selectChallenge(challenges, entries, level, today);

  const entry: DailyEntry = existing
    ? { ...existing, challengeId: challenge.id, updatedAt: now }
    : {
        date: today,
        challengeId: challenge.id,
        emotionBefore: null,
        ifThen: null,
        status: 'in_progress',
        reflection: null,
        completedAt: null,
        updatedAt: now,
      };
  await store.putEntry(entry);
  return { challenge, entry };
}
