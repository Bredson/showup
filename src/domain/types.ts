// Showup — domain types. Source of truth: docs/data-model.md
// RULE: this module (and everything in src/domain/) must not import from React or storage.

export type Lang = 'pl' | 'en';

/** Calendar date in the user's local timezone, e.g. "2026-07-13". Day boundary = local midnight. */
export type ISODate = string;
/** Full ISO 8601 datetime. */
export type ISODateTime = string;

export type DifficultyLevel = 1 | 2 | 3;

/** The 5 emotions of the daily check-in. Technical keys in EN; labels always via i18n. */
export type Emotion = 'anxiety' | 'boredom' | 'overwhelm' | 'aversion' | 'confusion';

export type ChallengeStatus = 'in_progress' | 'completed' | 'skipped';

export interface UserProfile {
  id: 'singleton';
  language: Lang;
  startDate: ISODate;
  quiz: QuizResult;
  createdAt: ISODateTime;
}

export interface QuizResult {
  /** Raw answers: question id -> selected option id(s). Kept raw so profile can be recomputed. */
  answers: Record<string, string | string[]>;
  /** Derived: dominant procrastination triggers. In MVP affects tone only, not challenge selection. */
  dominantTriggers: Emotion[];
  completedAt: ISODateTime;
}

export type ChallengeCategory = 'small-steps' | 'two-minute' | 'emotion' | 'starting';

export interface ChallengeContent {
  lesson: string;
  task: string;
  reflection: string;
}

export interface Challenge {
  /** Format "l{level}-{nnn}", e.g. "l1-007". IMMUTABLE FOREVER — journal entries reference it. */
  id: string;
  level: DifficultyLevel;
  category: ChallengeCategory;
  i18n: Record<Lang, ChallengeContent>;
}

export interface DailyEntry {
  /** PRIMARY KEY — one entry per day. */
  date: ISODate;
  /** Assigned once on first open of the day; never recomputed. */
  challengeId: string;
  emotionBefore: Emotion | null;
  ifThen: string | null;
  status: ChallengeStatus;
  reflection: string | null;
  completedAt: ISODateTime | null;
  updatedAt: ISODateTime;
}

/** Derived at startup from DailyEntry[] — NEVER persisted (single source of truth rule). */
export interface ProgressState {
  currentStreak: number;
  longestStreak: number;
  totalCompleted: number;
  completedByLevel: Record<DifficultyLevel, number>;
  currentLevel: DifficultyLevel;
  usedChallengeIds: Set<string>;
  lastCompletedDate: ISODate | null;
}

/**
 * Persisted mid-quiz state — onboarding resumes where it stopped (ux-spec §1).
 * Lives in the "meta" store as a separate record; deleted once the profile is built.
 */
export interface QuizDraft {
  id: 'quizDraft';
  /** Language picked on the welcome screen — must survive an interrupted quiz. */
  language: Lang;
  /** Same raw shape as QuizResult.answers, but partial while the quiz is in progress. */
  answers: Record<string, string | string[]>;
  updatedAt: ISODateTime;
}

export interface Meta {
  id: 'meta';
  schemaVersion: number;
  installedAt: ISODateTime;
}

export interface ExportBlob {
  app: 'showup';
  schemaVersion: number;
  exportedAt: ISODateTime;
  profile: UserProfile;
  entries: DailyEntry[];
}
