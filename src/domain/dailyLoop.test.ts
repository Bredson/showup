import { describe, expect, it } from 'vitest';
import type { DailyEntry } from './types';
import {
  completeEntry,
  dayPartFor,
  LOOP_STEPS,
  nextStep,
  resumeStep,
  setEmotion,
  setIfThen,
  shouldHideIfThenEducation,
} from './dailyLoop';

const NOW = '2026-07-14T10:00:00.000Z';

function entry(overrides: Partial<DailyEntry> = {}): DailyEntry {
  return {
    date: '2026-07-14',
    challengeId: 'l1-001',
    emotionBefore: null,
    ifThen: null,
    status: 'in_progress',
    reflection: null,
    completedAt: null,
    updatedAt: '2026-07-14T09:00:00.000Z',
    ...overrides,
  };
}

describe('transitions', () => {
  it('setEmotion records the check-in and touches updatedAt only', () => {
    const result = setEmotion(entry(), 'anxiety', NOW);
    expect(result.emotionBefore).toBe('anxiety');
    expect(result.updatedAt).toBe(NOW);
    expect(result.status).toBe('in_progress');
  });

  it('transitions never mutate the input entry', () => {
    const original = entry();
    setEmotion(original, 'boredom', NOW);
    setIfThen(original, 'plan', NOW);
    expect(original).toEqual(entry());
  });

  it('setIfThen trims and stores empty/whitespace as null (skip), never as ""', () => {
    expect(setIfThen(entry(), '  po kawie, otworzę raport  ', NOW).ifThen).toBe('po kawie, otworzę raport');
    expect(setIfThen(entry(), '   ', NOW).ifThen).toBeNull();
    expect(setIfThen(entry(), null, NOW).ifThen).toBeNull();
  });

  it('completeEntry sets status, trimmed reflection and completedAt', () => {
    const result = completeEntry(entry({ emotionBefore: 'overwhelm' }), ' start był najtrudniejszy ', NOW);
    expect(result.status).toBe('completed');
    expect(result.reflection).toBe('start był najtrudniejszy');
    expect(result.completedAt).toBe(NOW);
  });

  it('completeEntry rejects an empty reflection — mandatory per Dylemat 2', () => {
    expect(() => completeEntry(entry(), '   ', NOW)).toThrow(/reflection/);
  });
});

describe('resumeStep — loop resumes where it makes sense after × / restart', () => {
  it('fresh entry starts at the emotion check-in', () => {
    expect(resumeStep(entry())).toBe('emotion');
  });

  it('after the check-in resumes at the challenge content', () => {
    expect(resumeStep(entry({ emotionBefore: 'aversion' }))).toBe('challenge');
  });

  it('with a saved if-then resumes at execution', () => {
    expect(resumeStep(entry({ emotionBefore: 'aversion', ifThen: 'po obiedzie' }))).toBe('execution');
  });

  it('a completed entry resumes at the reinforcement screen', () => {
    expect(resumeStep(entry({ emotionBefore: 'boredom', status: 'completed', reflection: 'ok' }))).toBe('reinforce');
  });
});

describe('nextStep', () => {
  it('walks the 6 steps in spec order and ends with null', () => {
    expect(LOOP_STEPS).toHaveLength(6);
    const walked = [];
    let step: ReturnType<typeof nextStep> = 'emotion';
    while (step !== null) {
      walked.push(step);
      step = nextStep(step);
    }
    expect(walked).toEqual(['emotion', 'challenge', 'ifThen', 'execution', 'reflection', 'reinforce']);
  });
});

describe('shouldHideIfThenEducation', () => {
  const done = (date: string, ifThen: string | null): DailyEntry =>
    entry({ date, ifThen, status: 'completed', reflection: 'ok' });

  it('hides after 3 consecutive finished days without an if-then', () => {
    expect(shouldHideIfThenEducation([done('2026-07-11', null), done('2026-07-12', null), done('2026-07-13', null)])).toBe(true);
  });

  it('keeps education when any of the last 3 had a plan, or history is shorter', () => {
    expect(shouldHideIfThenEducation([done('2026-07-11', null), done('2026-07-12', 'po kawie'), done('2026-07-13', null)])).toBe(false);
    expect(shouldHideIfThenEducation([done('2026-07-12', null), done('2026-07-13', null)])).toBe(false);
  });

  it('ignores today\u2019s in_progress entry when counting', () => {
    const history = [done('2026-07-11', null), done('2026-07-12', null), done('2026-07-13', null), entry({ date: '2026-07-14' })];
    expect(shouldHideIfThenEducation(history)).toBe(true);
  });
});

describe('dayPartFor', () => {
  it('maps hours to morning / midday / evening', () => {
    expect(dayPartFor(5)).toBe('morning');
    expect(dayPartFor(11)).toBe('morning');
    expect(dayPartFor(12)).toBe('midday');
    expect(dayPartFor(17)).toBe('midday');
    expect(dayPartFor(18)).toBe('evening');
    expect(dayPartFor(23)).toBe('evening');
    expect(dayPartFor(0)).toBe('evening');
    expect(dayPartFor(4)).toBe('evening');
  });
});
