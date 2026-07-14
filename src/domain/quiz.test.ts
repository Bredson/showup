import { describe, expect, it } from 'vitest';
import {
  QUIZ_QUESTIONS,
  buildProfile,
  deriveDominantTriggers,
  firstUnansweredIndex,
  isQuizComplete,
  toggleMultiOption,
  type QuizAnswers,
} from './quiz';

const COMPLETE: QuizAnswers = {
  triggers: ['fear', 'too-much'],
  timeOfDay: 'evening',
  taskType: 'admin',
  aftermath: 'guilt',
  dailyTime: '5min',
};

describe('QUIZ_QUESTIONS shape', () => {
  it('has 5 questions with unique, stable ids', () => {
    expect(QUIZ_QUESTIONS.map((q) => q.id)).toEqual(['triggers', 'timeOfDay', 'taskType', 'aftermath', 'dailyTime']);
  });

  it('every question offers the "unsure" escape hatch (never block, ux-spec §1)', () => {
    for (const q of QUIZ_QUESTIONS) expect(q.options).toContain('unsure');
  });

  it('only the triggers question is multi-select, capped at 2', () => {
    const multi = QUIZ_QUESTIONS.filter((q) => q.kind === 'multi');
    expect(multi.map((q) => q.id)).toEqual(['triggers']);
    expect(multi[0]?.maxSelections).toBe(2);
  });
});

describe('firstUnansweredIndex / isQuizComplete', () => {
  it('starts at 0 for empty answers', () => {
    expect(firstUnansweredIndex({})).toBe(0);
    expect(isQuizComplete({})).toBe(false);
  });

  it('resumes at the first gap, not the last answered question', () => {
    const answers: QuizAnswers = { triggers: ['boredom'], taskType: 'home' };
    expect(firstUnansweredIndex(answers)).toBe(1); // timeOfDay missing
  });

  it('treats an empty multi selection as unanswered', () => {
    expect(firstUnansweredIndex({ triggers: [] })).toBe(0);
  });

  it('returns question count for complete answers', () => {
    expect(firstUnansweredIndex(COMPLETE)).toBe(QUIZ_QUESTIONS.length);
    expect(isQuizComplete(COMPLETE)).toBe(true);
  });
});

describe('toggleMultiOption', () => {
  it('adds and removes an option', () => {
    expect(toggleMultiOption([], 'fear', 2)).toEqual(['fear']);
    expect(toggleMultiOption(['fear'], 'fear', 2)).toEqual([]);
  });

  it('ignores taps beyond maxSelections instead of silently replacing', () => {
    const current = ['fear', 'boredom'];
    // same reference back = "nothing changed", so the UI can skip state updates and draft saves
    expect(toggleMultiOption(current, 'too-much', 2)).toBe(current);
  });

  it('"unsure" is exclusive in both directions', () => {
    expect(toggleMultiOption(['fear', 'boredom'], 'unsure', 2)).toEqual(['unsure']);
    expect(toggleMultiOption(['unsure'], 'fear', 2)).toEqual(['fear']);
  });
});

describe('deriveDominantTriggers', () => {
  it('maps Q1 options to check-in emotions', () => {
    expect(deriveDominantTriggers({ triggers: ['fear', 'too-much'] })).toEqual(['anxiety', 'overwhelm']);
    expect(deriveDominantTriggers({ triggers: ['no-energy', 'dont-know-where'] })).toEqual(['aversion', 'confusion']);
  });

  it('returns an empty list for "unsure" or missing answers', () => {
    expect(deriveDominantTriggers({ triggers: ['unsure'] })).toEqual([]);
    expect(deriveDominantTriggers({})).toEqual([]);
  });

  it('ignores unknown option ids (forward-compat with future quiz edits)', () => {
    expect(deriveDominantTriggers({ triggers: ['fear', 'brand-new-option'] })).toEqual(['anxiety']);
  });
});

describe('buildProfile', () => {
  const today = '2026-07-14';
  const now = '2026-07-14T09:00:00.000Z';

  it('throws on incomplete answers (UI must gate on isQuizComplete)', () => {
    expect(() => buildProfile({ triggers: ['fear'] }, 'pl', today, now)).toThrow();
  });

  it('builds the singleton profile with derived triggers and raw answers', () => {
    const profile = buildProfile(COMPLETE, 'en', today, now);
    expect(profile).toEqual({
      id: 'singleton',
      language: 'en',
      startDate: today,
      quiz: {
        answers: COMPLETE,
        dominantTriggers: ['anxiety', 'overwhelm'],
        completedAt: now,
      },
      createdAt: now,
    });
  });

  it('copies answers instead of aliasing the caller object', () => {
    const triggers = ['fear'];
    const answers: QuizAnswers = { ...COMPLETE, triggers };
    const profile = buildProfile(answers, 'pl', today, now);
    answers.dailyTime = '10min';
    triggers.push('boredom'); // deep copy: mutating the caller's array must not leak into the profile
    expect(profile.quiz.answers['dailyTime']).toBe('5min');
    expect(profile.quiz.answers['triggers']).toEqual(['fear']);
  });
});
