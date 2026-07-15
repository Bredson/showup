// Showup — onboarding quiz domain. Source of truth: docs/ux-spec.md §1 + docs/data-model.md §1.
// RULE: no React/storage imports; time is injected. Question/option ids are IMMUTABLE FOREVER —
// raw answers in QuizResult must stay recomputable after future quiz changes (data-model §1).

import type { Emotion, ISODate, ISODateTime, Lang, QuizResult, LegacyUserProfile } from './types';

export type QuizQuestionId = 'triggers' | 'timeOfDay' | 'taskType' | 'aftermath' | 'dailyTime';

export interface QuizQuestion {
  id: QuizQuestionId;
  kind: 'single' | 'multi';
  /** Only for kind 'multi'. */
  maxSelections?: number;
  /** Option ids, EN, immutable. 'unsure' = „Trudno powiedzieć" — present in every question (ux-spec §1). */
  options: readonly string[];
}

/** Raw quiz state: question id -> option id (single) or option ids (multi). Partial while in progress. */
export type QuizAnswers = Partial<Record<QuizQuestionId, string | string[]>>;

// `as const satisfies` (repo pattern): runtime array stays a plain QuizQuestion[],
// but option ids keep their literal types so the UI can type-check i18n keys per option.
export const QUIZ_QUESTIONS = [
  { id: 'triggers', kind: 'multi', maxSelections: 2, options: ['fear', 'boredom', 'too-much', 'no-energy', 'dont-know-where', 'unsure'] },
  { id: 'timeOfDay', kind: 'single', options: ['morning', 'midday', 'evening', 'varies', 'unsure'] },
  { id: 'taskType', kind: 'single', options: ['work-study', 'admin', 'home', 'health', 'social', 'unsure'] },
  { id: 'aftermath', kind: 'single', options: ['guilt', 'snowball', 'last-minute', 'sometimes-never', 'unsure'] },
  { id: 'dailyTime', kind: 'single', options: ['2min', '5min', '10min', 'unsure'] },
] as const satisfies readonly QuizQuestion[];

/** Q1 option -> check-in emotion (ux-spec §1, binding). 'unsure' maps to nothing on purpose. */
const TRIGGER_TO_EMOTION: Readonly<Record<string, Emotion>> = {
  fear: 'anxiety',
  boredom: 'boredom',
  'too-much': 'overwhelm',
  'no-energy': 'aversion',
  'dont-know-where': 'confusion',
};

function isAnswered(question: QuizQuestion, answers: QuizAnswers): boolean {
  const value = answers[question.id];
  if (value === undefined) return false;
  return Array.isArray(value) ? value.length > 0 : value.length > 0;
}

/** Index of the first unanswered question (resume point). Equals QUIZ_QUESTIONS.length when complete. */
export function firstUnansweredIndex(answers: QuizAnswers): number {
  const idx = QUIZ_QUESTIONS.findIndex((q) => !isAnswered(q, answers));
  return idx === -1 ? QUIZ_QUESTIONS.length : idx;
}

export function isQuizComplete(answers: QuizAnswers): boolean {
  return firstUnansweredIndex(answers) === QUIZ_QUESTIONS.length;
}

/**
 * Toggle one option of a multi question. Rules (ux-spec §1):
 * - tapping a selected option deselects it;
 * - 'unsure' is exclusive: picking it clears the rest, picking anything else clears it;
 * - at most maxSelections choices — extra taps are ignored (no silent replacement).
 * Returns `current` (same reference) when nothing changed, so callers can skip redundant saves.
 */
export function toggleMultiOption(current: readonly string[], option: string, maxSelections: number): readonly string[] {
  if (current.includes(option)) return current.filter((o) => o !== option);
  if (option === 'unsure') return ['unsure'];
  const withoutUnsure = current.filter((o) => o !== 'unsure');
  if (withoutUnsure.length >= maxSelections) {
    return withoutUnsure.length === current.length ? current : withoutUnsure;
  }
  return [...withoutUnsure, option];
}

/** Derived triggers: mapped Q1 answers, in check-in emotion order. 'unsure' → empty list (MVP: tone only). */
export function deriveDominantTriggers(answers: QuizAnswers): Emotion[] {
  const raw = answers.triggers;
  const selected = Array.isArray(raw) ? raw : raw === undefined ? [] : [raw];
  const result: Emotion[] = [];
  for (const option of selected) {
    const emotion = TRIGGER_TO_EMOTION[option];
    if (emotion !== undefined && !result.includes(emotion)) result.push(emotion);
  }
  return result;
}

/** Shared by buildProfile/updateProfileFromQuiz — one place enforcing the completeness invariant. */
function buildQuizResult(answers: QuizAnswers, now: ISODateTime): QuizResult {
  if (!isQuizComplete(answers)) {
    throw new Error('Showup quiz: cannot build profile from incomplete answers');
  }
  return {
    // Deep copy: array answers must not stay aliased to the caller's draft state.
    answers: structuredClone(answers) as Record<string, string | string[]>,
    dominantTriggers: deriveDominantTriggers(answers),
    completedAt: now,
  };
}

/**
 * Build the singleton profile from a completed quiz. Throws on incomplete answers —
 * the UI must not offer the closing CTA before isQuizComplete() (untrusted-input rule).
 * Dylemat 5 = NO: dailyTime is stored raw only, everyone starts at level 1.
 */
export function buildProfile(answers: QuizAnswers, language: Lang, today: ISODate, now: ISODateTime): LegacyUserProfile {
  return {
    id: 'singleton',
    language,
    startDate: today,
    quiz: buildQuizResult(answers, now),
    createdAt: now,
  };
}

/**
 * Retake ("Dostosuj moją ścieżkę", ux-spec §6, dylemat 6): only the quiz result changes.
 * language/startDate/createdAt stay — progress lives in entries and is untouched by design.
 */
export function updateProfileFromQuiz(existing: LegacyUserProfile, answers: QuizAnswers, now: ISODateTime): LegacyUserProfile {
  return { ...existing, quiz: buildQuizResult(answers, now) };
}
