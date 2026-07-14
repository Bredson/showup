// Unstuck — data import domain. Source of truth: docs/data-model.md §5.
// RULE: no React/storage imports. Import = REPLACE, never merge (data-model §5,
// trade-off 6: merge is a minefield; the export file becomes the whole truth).
// A file is untrusted input (hand-editable JSON) — every field gets a runtime check,
// mirroring the validateChallenges convention (collect ALL errors, no silent fixes).

import type { ChallengeStatus, DailyEntry, ExportBlob, Lang, UserProfile } from './types';
import { EMOTIONS } from './dailyLoop';

// `satisfies` keeps runtime lists in lockstep with the unions (pattern from src/content/index.ts).
const STATUS_SET = { in_progress: true, completed: true, skipped: true } as const satisfies Record<
  ChallengeStatus,
  true
>;
const STATUSES = Object.keys(STATUS_SET);
const LANG_SET = { pl: true, en: true } as const satisfies Record<Lang, true>;
const LANGS = Object.keys(LANG_SET);

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export type ImportValidation =
  | { ok: true; blob: ExportBlob }
  /**
   * 'newer'   — file written by a future app version (schemaVersion > current): the app
   *             cannot understand it; the fix is updating the app, not the file.
   * 'invalid' — anything else; `errors` lists every problem (debugging aid, not UI copy).
   */
  | { ok: false; reason: 'invalid' | 'newer'; errors: string[] };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNullOrString(value: unknown): boolean {
  return value === null || typeof value === 'string';
}

function checkProfile(raw: unknown, errors: string[]): raw is UserProfile {
  if (!isRecord(raw)) {
    errors.push('profile: missing or not an object');
    return false;
  }
  if (raw.id !== 'singleton') errors.push('profile.id: must be "singleton"');
  if (!LANGS.includes(raw.language as string)) errors.push(`profile.language: unknown "${String(raw.language)}"`);
  if (typeof raw.startDate !== 'string' || !ISO_DATE.test(raw.startDate)) {
    errors.push('profile.startDate: not a YYYY-MM-DD date');
  }
  if (typeof raw.createdAt !== 'string') errors.push('profile.createdAt: not a string');
  const quiz = raw.quiz;
  if (!isRecord(quiz)) {
    errors.push('profile.quiz: missing or not an object');
  } else {
    if (!isRecord(quiz.answers)) {
      errors.push('profile.quiz.answers: not an object');
    } else if (
      // QuizAnswers values are string | string[] — a future consumer of `answers`
      // must not get runtime surprises out of "validated" data.
      Object.values(quiz.answers).some(
        (v) => typeof v !== 'string' && !(Array.isArray(v) && v.every((item) => typeof item === 'string')),
      )
    ) {
      errors.push('profile.quiz.answers: values must be strings or string arrays');
    }
    if (
      !Array.isArray(quiz.dominantTriggers) ||
      quiz.dominantTriggers.some((t) => !(EMOTIONS as readonly string[]).includes(t as string))
    ) {
      errors.push('profile.quiz.dominantTriggers: not a list of known emotions');
    }
    if (typeof quiz.completedAt !== 'string') errors.push('profile.quiz.completedAt: not a string');
  }
  return errors.length === 0;
}

function checkEntry(raw: unknown, index: number, errors: string[]): raw is DailyEntry {
  const at = `entries[${index}]`;
  if (!isRecord(raw)) {
    errors.push(`${at}: not an object`);
    return false;
  }
  const errorsBefore = errors.length;
  if (typeof raw.date !== 'string' || !ISO_DATE.test(raw.date)) errors.push(`${at}.date: not a YYYY-MM-DD date`);
  // Unknown challengeIds are fine — spec §6 already renders "entry without content" for
  // challenges removed by a content deploy; a backup from another app version is the same case.
  if (typeof raw.challengeId !== 'string' || raw.challengeId === '') errors.push(`${at}.challengeId: not a string`);
  if (raw.emotionBefore !== null && !(EMOTIONS as readonly string[]).includes(raw.emotionBefore as string)) {
    errors.push(`${at}.emotionBefore: unknown "${String(raw.emotionBefore)}"`);
  }
  if (!isNullOrString(raw.ifThen)) errors.push(`${at}.ifThen: not null/string`);
  if (!STATUSES.includes(raw.status as string)) errors.push(`${at}.status: unknown "${String(raw.status)}"`);
  if (!isNullOrString(raw.reflection)) errors.push(`${at}.reflection: not null/string`);
  if (!isNullOrString(raw.completedAt)) errors.push(`${at}.completedAt: not null/string`);
  if (typeof raw.updatedAt !== 'string') errors.push(`${at}.updatedAt: not a string`);
  // A broken entry must not satisfy `raw is DailyEntry` — it would also make the
  // duplicate-date check downstream compare undefined dates (noise errors).
  return errors.length === errorsBefore;
}

/**
 * Validate a parsed JSON value as an ExportBlob. Never throws — the UI needs a calm
 * branch per outcome, so problems come back as data (unlike the build-time content
 * validator, where a loud throw is the point).
 */
export function validateExportBlob(raw: unknown, currentSchemaVersion: number): ImportValidation {
  if (!isRecord(raw)) return { ok: false, reason: 'invalid', errors: ['not a JSON object'] };
  if (raw.app !== 'unstuck') {
    return { ok: false, reason: 'invalid', errors: ['app: not an unstuck export file'] };
  }
  if (typeof raw.schemaVersion !== 'number' || !Number.isInteger(raw.schemaVersion) || raw.schemaVersion < 1) {
    return { ok: false, reason: 'invalid', errors: ['schemaVersion: not a positive integer'] };
  }
  // Older versions would go through the blob-migration runner here (data-model §5) —
  // no migrations exist while CURRENT_SCHEMA_VERSION is 1, so <= current means "as is".
  if (raw.schemaVersion > currentSchemaVersion) {
    return {
      ok: false,
      reason: 'newer',
      errors: [`schemaVersion ${raw.schemaVersion} is newer than supported ${currentSchemaVersion}`],
    };
  }

  const errors: string[] = [];
  // The UI shows this date in the replace-confirm copy, so "string" is not enough:
  // it must be a parseable ISO timestamp or the confirm would render "Invalid Date".
  if (
    typeof raw.exportedAt !== 'string' ||
    !ISO_DATE.test(raw.exportedAt.slice(0, 10)) ||
    Number.isNaN(Date.parse(raw.exportedAt))
  ) {
    errors.push('exportedAt: not an ISO timestamp');
  }
  const profileOk = checkProfile(raw.profile, errors);

  if (!Array.isArray(raw.entries)) {
    errors.push('entries: missing or not an array');
    return { ok: false, reason: 'invalid', errors };
  }
  const seenDates = new Set<string>();
  raw.entries.forEach((entry, index) => {
    if (!checkEntry(entry, index, errors)) return;
    if (seenDates.has(entry.date)) errors.push(`entries[${index}]: duplicate date "${entry.date}"`);
    seenDates.add(entry.date);
  });

  if (errors.length > 0 || !profileOk) return { ok: false, reason: 'invalid', errors };
  // Runtime checks above are the proof behind this assertion (validate-and-return style).
  return { ok: true, blob: raw as unknown as ExportBlob };
}
