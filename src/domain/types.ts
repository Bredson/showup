// Showup — domain types. Source of truth: docs/data-model.md (§1)
// RULE: this module (and everything in src/domain/) must not import from React or storage.

export type Lang = 'pl' | 'en';

/** Calendar date in the user's local timezone, e.g. "2026-07-13". Day boundary = local midnight. */
export type ISODate = string;
/** Full ISO 8601 datetime. */
export type ISODateTime = string;

// ---------------------------------------------------------------------------
// Showup model (docs/data-model.md §1)
// ---------------------------------------------------------------------------

/** Variant ladder — order = difficulty (pushup-program-research §3). */
export type Variant = 'wall' | 'incline-high' | 'incline-low' | 'knee' | 'full';

/** Pre-start check (sessions and tests only; always null on easy days). */
export type Feel = 'fresh' | 'ok' | 'tired' | 'pain';

export type DayKind = 'session' | 'easy' | 'test';

/** What was done as the 2-minute minimum on easy/degraded days. */
export type EasyContent = 'gtg-set' | 'warmup';

/**
 * No 'skipped': a day without completion is an in_progress entry or no entry at all.
 * Session shifting and pain degradation are separate mechanisms (data-model §7 #18).
 */
export type EntryStatus = 'in_progress' | 'completed';

/** 0 = Sunday, matching Date.getDay(). */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface UserProfile {
  id: 'singleton';
  language: Lang;
  startDate: ISODate;
  /** Fixed session days (onboarding); validated: no two adjacent (mod 7). */
  sessionDays: [Weekday, Weekday, Weekday];
  /** Habit anchor: "When [signal], I do my session". */
  ifThen: string | null;
  /** PAR-Q-style disclaimer — precondition of the first Max Test. */
  disclaimerAcceptedAt: ISODateTime;
  createdAt: ISODateTime;
}

export interface DailyEntry {
  /** PRIMARY KEY — one entry per day. */
  date: ISODate;
  /** Snapshot at first open of the day — NEVER mutated (data-model §0). */
  kind: DayKind;
  /** Variant in force on this day (permanent snapshot). */
  variant: Variant;
  /** Only kind='session'|'test'; always null on easy days. */
  feelBefore: Feel | null;
  /** feel='pain' does NOT change kind; it records the degradation (day executed as easy). */
  downgradedTo: 'easy' | null;
  status: EntryStatus;
  /** kind='session', not downgraded: performed reps per set. */
  sets: number[] | null;
  /** kind='test', not downgraded: Max Test result (reps to technical failure). */
  testResult: number | null;
  /** kind='easy' or downgradedTo='easy': what was done as the 2-minute minimum. */
  easyContent: EasyContent | null;
  /** Only after sessions/tests. */
  reflection: string | null;
  completedAt: ISODateTime | null;
  updatedAt: ISODateTime;
}

/** Bracket id from program.json, e.g. "b1". */
export type BracketId = string;

/** Derived from DailyEntry[] — NEVER persisted (data-model §0, §4). */
export interface ProgramState {
  variant: Variant;
  /**
   * Last testResult on the current variant. After variant graduation (and for
   * onboarding-estimated variants): SEED = round(variantSeedFactor × previous MT)
   * until the first real test on the variant (data-model §4).
   */
  lastMT: number;
  lastMTisSeed: boolean;
  /** ALWAYS = bracketFor(lastMT) — purely derived (data-model §7 #15). */
  bracket: BracketId;
  /** 'regen' = regeneration week after a failed test. */
  blockWeek: 1 | 2 | 3 | 4 | 'regen';
  /** 0.9 = block repeated after regeneration. */
  volumeModifier: 1 | 0.9;
  sessionsDoneThisWeek: number;
  /** Times the current bracket's block was repeated (framing: normal). */
  consolidations: number;
  /** Incremented when newMT <= lastMT; 2 → step down bracket or variant. */
  failedTestsInRow: number;
  /** First testResult >= 100 on 'full' → celebration screen. */
  goalReachedAt: ISODate | null;
  currentStreak: number;
  longestStreak: number;
  testHistory: Array<{ date: ISODate; variant: Variant; result: number; seed?: boolean }>;
}

/**
 * Program parameters — static content shipped as program.json (data-model §6).
 * A parameter file, not a content catalog: tables and thresholds are tuned without
 * code changes. Instructional copy lives in i18n, never here.
 */
export interface ProgramConfig {
  programVersion: number;
  /** Must equal the Variant ladder, in order. */
  variants: Variant[];
  /** Train the hardest variant with MT >= this… */
  variantEntryMinMT: number;
  /** …but full pushups already from MT >= this (data-model §4, major #5). */
  fullEntryMinMT: number;
  /** MT >= this on a non-full variant → graduate to the next variant. */
  variantGraduateMT: number;
  /** Seed factor for lastMT after variant graduation (data-model §7 #17). */
  variantSeedFactor: number;
  /** Test gate: newMT >= (1 + this) × lastMT → next block. */
  testGateImprovement: number;
  /** Week-4 deload: week-3 sets × this, AMRAP replaced by a regular set (data-model §4). */
  deloadVolumeFactor: number;
  /** Easy-day GtG set range as [min, max] × lastMT. */
  easySetFactor: [number, number];
  /** Sorted, adjacent, covering min(fullEntryMinMT, …)–100. */
  brackets: ProgramBracket[];
}

/** One set: fraction of lastMT, or 'A' = AMRAP-1 (only as the last set). */
export type ProgramSet = number | 'A';

export type ProgramWeek = { sets: ProgramSet[] } | { deload: true };

export interface ProgramBracket {
  id: BracketId;
  minMT: number;
  maxMT: number;
  /** Exactly 4: three ascending weeks + { deload: true }. */
  weeks: ProgramWeek[];
}

export interface Meta {
  id: 'meta';
  schemaVersion: number;
  installedAt: ISODateTime;
}

export interface ExportBlob {
  /** Intentionally incompatible with Unstuck exports — the apps never share data. */
  app: 'showup';
  schemaVersion: number;
  exportedAt: ISODateTime;
  profile: UserProfile;
  entries: DailyEntry[];
}

