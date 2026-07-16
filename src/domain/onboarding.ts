// Onboarding completion: assembles the records the finish step persists.
// The cascade itself (which variant to attempt next, how the stored result resolves
// into a starting position) lives in program.ts — this module only encodes the
// data-model §1/§4 shape of what onboarding writes:
//   - UserProfile (singleton) with startDate = the day onboarding finished,
//   - ONE DailyEntry kind='test' on startDate holding the LAST REAL attempt
//     (variant + result); estimation of easier variants is derived later by
//     resolveOnboardingResult, never persisted.
import type { DailyEntry, ISODate, ISODateTime, Lang, UserProfile, Weekday } from './types';
import type { OnboardingAttempt } from './program';
import { canonicalSessionDays } from './program';

export interface OnboardingInput {
  language: Lang;
  today: ISODate;
  now: ISODateTime;
  disclaimerAcceptedAt: ISODateTime;
  sessionDays: readonly Weekday[];
  /** Raw text from the IF-THEN field; whitespace-only collapses to null. */
  ifThen: string;
  /** Last REAL attempt of the cascade (max 2 exist; earlier ones are not stored). */
  lastAttempt: OnboardingAttempt;
}

export interface OnboardingRecords {
  profile: UserProfile;
  entry: DailyEntry;
}

/**
 * Pure assembly + final validation gates (session days validate inside
 * canonicalSessionDays). Throws: the UI disables the CTA until the input validates,
 * so reaching here with bad data is a bug, not a user error.
 */
export function buildOnboardingRecords(input: OnboardingInput): OnboardingRecords {
  const sessionDays = canonicalSessionDays(input.sessionDays, 'onboarding');
  const { result } = input.lastAttempt;
  if (!Number.isInteger(result) || result < 0) {
    throw new Error('onboarding: attempt result must be a non-negative integer');
  }
  const ifThen = input.ifThen.trim();
  const profile: UserProfile = {
    id: 'singleton',
    language: input.language,
    startDate: input.today,
    sessionDays,
    ifThen: ifThen === '' ? null : ifThen,
    disclaimerAcceptedAt: input.disclaimerAcceptedAt,
    createdAt: input.now,
  };
  const entry: DailyEntry = {
    date: input.today,
    kind: 'test',
    variant: input.lastAttempt.variant,
    // No feel check during onboarding — the pain/tired degradation is a daily-loop
    // mechanic; the first test is guarded by the disclaimer instead.
    feelBefore: null,
    downgradedTo: null,
    status: 'completed',
    sets: null,
    testResult: input.lastAttempt.result,
    easyContent: null,
    reflection: null,
    completedAt: input.now,
    updatedAt: input.now,
  };
  return { profile, entry };
}
