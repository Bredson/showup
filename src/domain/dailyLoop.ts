// Unstuck — daily loop transitions (ux-spec §3: 6 fullscreen steps, < 5 min).
// RULE: pure functions only; no React/storage imports; time passed in, never read from the clock.
// Every transition returns a NEW DailyEntry — callers persist it via StorageAdapter.

import type { DailyEntry, Emotion, ISODateTime } from './types';

/** The 6 steps of ux-spec §3, in order. */
export type LoopStep = 'emotion' | 'challenge' | 'ifThen' | 'execution' | 'reflection' | 'reinforce';

export const LOOP_STEPS: readonly LoopStep[] = [
  'emotion',
  'challenge',
  'ifThen',
  'execution',
  'reflection',
  'reinforce',
] as const;

export const EMOTIONS: readonly Emotion[] = ['anxiety', 'boredom', 'overwhelm', 'aversion', 'confusion'] as const;

/** Step 3.1 — mandatory check-in (Dylemat 1: no skip; the escape valve is closing the whole loop). */
export function setEmotion(entry: DailyEntry, emotion: Emotion, now: ISODateTime): DailyEntry {
  return { ...entry, emotionBefore: emotion, updatedAt: now };
}

/**
 * Step 3.3 — optional if-then plan. Empty/whitespace input means "skipped" and is stored
 * as null (never as ''), so the execution step knows there is nothing to remind about.
 */
export function setIfThen(entry: DailyEntry, text: string | null, now: ISODateTime): DailyEntry {
  const trimmed = text?.trim();
  return { ...entry, ifThen: trimmed ? trimmed : null, updatedAt: now };
}

/**
 * Step 3.5 — mandatory reflection (Dylemat 2: a quick-chip counts as a full answer).
 * Completing is the ONLY transition that sets status/completedAt; an empty reflection
 * is a programming error upstream (UI must not enable "Zapisz" without one).
 */
export function completeEntry(entry: DailyEntry, reflection: string, now: ISODateTime): DailyEntry {
  const trimmed = reflection.trim();
  if (!trimmed) throw new Error('completeEntry requires a non-empty reflection (ux-spec §3.5)');
  return { ...entry, status: 'completed', reflection: trimmed, completedAt: now, updatedAt: now };
}

/**
 * Where to resume after "×" or an app restart (ux-spec §3: exit preserves state; §2: "Dokończ" CTA).
 * DailyEntry has no step field (data-model: no derivable state persisted), so we infer:
 * - no emotion yet → start at the check-in
 * - if-then saved → the user got past step 3.3 → resume at execution
 * - otherwise → re-show the challenge content (skipped if-then is indistinguishable from
 *   never-reached; re-reading the task costs one tap and is the safer default)
 */
export function resumeStep(entry: DailyEntry): LoopStep {
  if (entry.status === 'completed') return 'reinforce';
  if (entry.emotionBefore === null) return 'emotion';
  if (entry.ifThen !== null) return 'execution';
  return 'challenge';
}

export function nextStep(step: LoopStep): LoopStep | null {
  const i = LOOP_STEPS.indexOf(step);
  return LOOP_STEPS[i + 1] ?? null;
}

/**
 * ux-spec §3.3: after 3 consecutive skips of the if-then step its educational line disappears
 * (the step itself stays). A "skip" = a finished day whose ifThen stayed null.
 */
export function shouldHideIfThenEducation(entries: DailyEntry[]): boolean {
  // Sort locally — a pure domain function must not inherit the adapter's sort order.
  const finished = entries
    .filter((e) => e.status !== 'in_progress')
    .sort((a, b) => (a.date < b.date ? -1 : 1))
    .slice(-3);
  return finished.length === 3 && finished.every((e) => e.ifThen === null);
}

/** Time-of-day greeting for the Today screen (ux-spec §2: greeting, no calendar date). */
export type DayPart = 'morning' | 'midday' | 'evening';

export function dayPartFor(hour: number): DayPart {
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 18) return 'midday';
  return 'evening';
}
