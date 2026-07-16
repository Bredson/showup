// Showup — data import domain. Source of truth: docs/data-model.md §5.
// RULE: no React/storage imports. Import = REPLACE, never merge (data-model §5,
// trade-off 6: merge is a minefield; the export file becomes the whole truth).
// A file is untrusted input (hand-editable JSON) — every field gets a runtime check
// (collect ALL errors, no silent fixes).

import type {
  DailyEntry,
  DayKind,
  EasyContent,
  EntryStatus,
  ExportBlob,
  Feel,
  Lang,
  UserProfile,
  Variant,
} from './types';
import { isGateTest, validateSessionDays } from './program';

// `satisfies` keeps runtime lists in lockstep with the unions (adding a union member
// without updating the list is a compile error).
const STATUS_SET = { in_progress: true, completed: true } as const satisfies Record<EntryStatus, true>;
const STATUSES = Object.keys(STATUS_SET);
const LANG_SET = { pl: true, en: true } as const satisfies Record<Lang, true>;
const LANGS = Object.keys(LANG_SET);
const KIND_SET = { session: true, easy: true, test: true } as const satisfies Record<DayKind, true>;
const KINDS = Object.keys(KIND_SET);
const VARIANT_SET = {
  wall: true,
  'incline-high': true,
  'incline-low': true,
  knee: true,
  full: true,
} as const satisfies Record<Variant, true>;
const VARIANTS = Object.keys(VARIANT_SET);
const FEEL_SET = { fresh: true, ok: true, tired: true, pain: true } as const satisfies Record<Feel, true>;
const FEELS = Object.keys(FEEL_SET);
const EASY_CONTENT_SET = { 'gtg-set': true, warmup: true, 'long-set': true } as const satisfies Record<EasyContent, true>;
const EASY_CONTENTS = Object.keys(EASY_CONTENT_SET);

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

function isRepCount(value: unknown): boolean {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0;
}

function checkProfile(raw: unknown, errors: string[]): raw is UserProfile {
  if (!isRecord(raw)) {
    errors.push('profile: missing or not an object');
    return false;
  }
  const errorsBefore = errors.length;
  if (raw.id !== 'singleton') errors.push('profile.id: must be "singleton"');
  if (!LANGS.includes(raw.language as string)) errors.push(`profile.language: unknown "${String(raw.language)}"`);
  if (typeof raw.startDate !== 'string' || !ISO_DATE.test(raw.startDate)) {
    errors.push('profile.startDate: not a YYYY-MM-DD date');
  }
  const days = raw.sessionDays;
  if (
    !Array.isArray(days) ||
    days.some((d) => typeof d !== 'number' || !Number.isInteger(d) || d < 0 || d > 6)
  ) {
    errors.push('profile.sessionDays: not an array of weekdays 0-6');
  } else if (!validateSessionDays(days as UserProfile['sessionDays'])) {
    // Same rule as onboarding (data-model §3): exactly 3 distinct days, none adjacent (mod 7).
    errors.push('profile.sessionDays: must be 3 distinct non-adjacent weekdays');
  }
  if (!isNullOrString(raw.ifThen)) errors.push('profile.ifThen: not null/string');
  if (typeof raw.disclaimerAcceptedAt !== 'string') errors.push('profile.disclaimerAcceptedAt: not a string');
  if (typeof raw.createdAt !== 'string') errors.push('profile.createdAt: not a string');
  // Delta, not `errors.length === 0`: earlier errors (e.g. exportedAt) must not
  // falsify the type predicate for a perfectly fine profile (same as checkEntry).
  return errors.length === errorsBefore;
}

function checkEntry(raw: unknown, index: number, errors: string[]): raw is DailyEntry {
  const at = `entries[${index}]`;
  if (!isRecord(raw)) {
    errors.push(`${at}: not an object`);
    return false;
  }
  const errorsBefore = errors.length;
  if (typeof raw.date !== 'string' || !ISO_DATE.test(raw.date)) errors.push(`${at}.date: not a YYYY-MM-DD date`);
  if (!KINDS.includes(raw.kind as string)) errors.push(`${at}.kind: unknown "${String(raw.kind)}"`);
  if (!VARIANTS.includes(raw.variant as string)) errors.push(`${at}.variant: unknown "${String(raw.variant)}"`);
  if (raw.feelBefore !== null && !FEELS.includes(raw.feelBefore as string)) {
    errors.push(`${at}.feelBefore: unknown "${String(raw.feelBefore)}"`);
  }
  if (raw.downgradedTo !== null && raw.downgradedTo !== 'easy') {
    errors.push(`${at}.downgradedTo: must be null or "easy"`);
  }
  if (!STATUSES.includes(raw.status as string)) errors.push(`${at}.status: unknown "${String(raw.status)}"`);
  if (raw.sets !== null && !(Array.isArray(raw.sets) && raw.sets.every(isRepCount))) {
    errors.push(`${at}.sets: must be null or an array of non-negative integers`);
  }
  if (raw.testResult !== null && !isRepCount(raw.testResult)) {
    errors.push(`${at}.testResult: must be null or a non-negative integer`);
  }
  if (raw.easyContent !== null && !EASY_CONTENTS.includes(raw.easyContent as string)) {
    errors.push(`${at}.easyContent: unknown "${String(raw.easyContent)}"`);
  }
  // undefined passes: blobs exported before the long-set feature lack the key (additive
  // field, same schemaVersion) — missing reads as null everywhere (data-model §1).
  if (
    raw.longSetReps !== undefined &&
    raw.longSetReps !== null &&
    !(typeof raw.longSetReps === 'number' && Number.isInteger(raw.longSetReps) && raw.longSetReps >= 1)
  ) {
    errors.push(`${at}.longSetReps: must be null or an integer >= 1`);
  }
  if (!isNullOrString(raw.reflection)) errors.push(`${at}.reflection: not null/string`);
  if (!isNullOrString(raw.completedAt)) errors.push(`${at}.completedAt: not null/string`);
  if (typeof raw.updatedAt !== 'string') errors.push(`${at}.updatedAt: not a string`);
  // Documented invariants the engine relies on (data-model §1). Each result field
  // may only be non-null on the day shape it belongs to; a foreign value (e.g. a
  // testResult on an easy day) would poison ProgramState derivation. Deliberately
  // NOT enforced: which fields must be non-null when completed (an in_progress
  // entry legitimately has nulls everywhere) and completedAt ⇔ status (not spec'd).
  if (raw.kind === 'easy' && raw.feelBefore !== null) {
    errors.push(`${at}.feelBefore: must be null on easy days`);
  }
  if (raw.kind === 'easy' && raw.downgradedTo !== null) {
    errors.push(`${at}.downgradedTo: must be null on easy days`);
  }
  if (raw.sets !== null && !(raw.kind === 'session' && raw.downgradedTo === null)) {
    errors.push(`${at}.sets: only non-degraded sessions record sets`);
  }
  if (raw.testResult !== null && !(raw.kind === 'test' && raw.downgradedTo === null)) {
    errors.push(`${at}.testResult: only non-degraded tests record a result`);
  }
  if (raw.easyContent !== null && raw.kind !== 'easy' && raw.downgradedTo !== 'easy') {
    errors.push(`${at}.easyContent: only easy or degraded days record easy content`);
  }
  if (raw.longSetReps != null && raw.easyContent !== 'long-set') {
    errors.push(`${at}.longSetReps: only long-set days record a long-set result`);
  }
  // Degraded days never offer the long-set option (longSetOffered), and a forged one
  // would suppress the whole week's cadence — that's derived state poisoning.
  if (raw.easyContent === 'long-set' && raw.downgradedTo === 'easy') {
    errors.push(`${at}.easyContent: a pain-degraded day cannot record a long set`);
  }
  if (raw.reflection !== null && raw.kind === 'easy') {
    errors.push(`${at}.reflection: easy days carry no reflection`);
  }
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
  if (raw.app !== 'showup') {
    return { ok: false, reason: 'invalid', errors: ['app: not a showup export file'] };
  }
  if (typeof raw.schemaVersion !== 'number' || !Number.isInteger(raw.schemaVersion) || raw.schemaVersion < 1) {
    return { ok: false, reason: 'invalid', errors: ['schemaVersion: not a positive integer'] };
  }
  if (raw.schemaVersion > currentSchemaVersion) {
    return {
      ok: false,
      reason: 'newer',
      errors: [`schemaVersion ${raw.schemaVersion} is newer than supported ${currentSchemaVersion}`],
    };
  }
  // Older versions would go through the blob-migration runner here (data-model §5).
  // No migration bridges the fork: v1 blobs hold pre-rewrite (challenge-shaped) data
  // that has no meaning for the pushup program — reject instead of guessing.
  if (raw.schemaVersion < currentSchemaVersion) {
    return {
      ok: false,
      reason: 'invalid',
      errors: [`schemaVersion ${raw.schemaVersion}: pre-rewrite export, no migration exists`],
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
  let entriesOk = true;
  raw.entries.forEach((entry, index) => {
    if (!checkEntry(entry, index, errors)) {
      entriesOk = false;
      return;
    }
    if (seenDates.has(entry.date)) errors.push(`entries[${index}]: duplicate date "${entry.date}"`);
    seenDates.add(entry.date);
  });
  // A Showup profile can only exist AFTER the onboarding Max Test, and computeProgram
  // throws without one (data-model §4) — a blob that validates but crashes the app right
  // after replaceAll would be worse than a rejection. Zero entries is the same case: the
  // app can never produce such an export. Skipped when an entry is malformed (the file is
  // already rejected, and the broken entry might BE the missing test — no noise on top).
  if (entriesOk && !raw.entries.some((e) => isGateTest(e as DailyEntry))) {
    errors.push('entries: no completed Max Test entry — program state cannot be derived (data-model §4)');
  }

  if (errors.length > 0 || !profileOk) return { ok: false, reason: 'invalid', errors };
  // Runtime checks above are the proof behind this assertion (validate-and-return style).
  return { ok: true, blob: raw as unknown as ExportBlob };
}
