// Daily-loop glue tests against the binding spec: docs/prd.md §4, docs/data-model.md §1/§4.
import { describe, expect, it } from 'vitest';
import type { DailyEntry, ISODate } from './types';
import {
  comebackKind,
  missedDaysBefore,
  nextStep,
  openDayEntry,
  resumeStep,
  stepsFor,
} from './loop';

// --- fixtures ---------------------------------------------------------------

function entry(partial: Partial<DailyEntry> & { date: ISODate }): DailyEntry {
  return {
    kind: 'session',
    variant: 'full',
    feelBefore: null,
    downgradedTo: null,
    status: 'in_progress',
    sets: null,
    testResult: null,
    easyContent: null,
    reflection: null,
    completedAt: null,
    updatedAt: `${partial.date}T18:00:00.000Z`,
    ...partial,
  };
}

// --- step machine -------------------------------------------------------------

describe('stepsFor / nextStep', () => {
  it('orders the three day kinds per PRD §4', () => {
    expect(stepsFor('session', false)).toEqual(['feel', 'sets', 'reflection', 'done']);
    expect(stepsFor('test', false)).toEqual(['feel', 'warmup', 'test', 'reflection', 'done']);
    expect(stepsFor('easy', false)).toEqual(['easy', 'done']);
  });

  it('pain degradation keeps the feel step, then runs the day as easy', () => {
    expect(stepsFor('session', true)).toEqual(['feel', 'easy', 'done']);
    expect(stepsFor('test', true)).toEqual(['feel', 'easy', 'done']);
  });

  it('advances step by step and clamps at done', () => {
    expect(nextStep('session', false, 'feel')).toBe('sets');
    expect(nextStep('test', false, 'test')).toBe('reflection');
    expect(nextStep('easy', false, 'done')).toBe('done');
  });

  it('throws on a step that is not part of the day (guards UI drift)', () => {
    expect(() => nextStep('easy', false, 'sets')).toThrow();
    expect(() => nextStep('session', true, 'sets')).toThrow();
  });
});

describe('resumeStep', () => {
  const d: ISODate = '2026-07-15';

  it('completed entries always resume at done', () => {
    expect(resumeStep(entry({ date: d, status: 'completed', kind: 'easy', easyContent: 'warmup' }), null)).toBe(
      'done',
    );
  });

  it('session: feel → sets (until every planned set is recorded) → reflection', () => {
    expect(resumeStep(entry({ date: d }), null)).toBe('feel');
    expect(resumeStep(entry({ date: d, feelBefore: 'ok' }), 5)).toBe('sets');
    expect(resumeStep(entry({ date: d, feelBefore: 'ok', sets: [5, 6] }), 5)).toBe('sets');
    expect(resumeStep(entry({ date: d, feelBefore: 'ok', sets: [5, 6, 4, 4, 7] }), 5)).toBe('reflection');
  });

  it('test: re-shows warmup until a result exists (costs nothing, keeps safety copy)', () => {
    expect(resumeStep(entry({ date: d, kind: 'test' }), null)).toBe('feel');
    expect(resumeStep(entry({ date: d, kind: 'test', feelBefore: 'fresh' }), null)).toBe('warmup');
    expect(resumeStep(entry({ date: d, kind: 'test', feelBefore: 'fresh', testResult: 12 }), null)).toBe(
      'reflection',
    );
  });

  it('easy and degraded days resume at the easy step; degraded without feel re-asks feel', () => {
    expect(resumeStep(entry({ date: d, kind: 'easy' }), null)).toBe('easy');
    expect(resumeStep(entry({ date: d, feelBefore: 'pain', downgradedTo: 'easy' }), null)).toBe('easy');
    expect(resumeStep(entry({ date: d, downgradedTo: 'easy' }), null)).toBe('feel');
  });
});

describe('openDayEntry', () => {
  it('creates the immutable snapshot of the day, in_progress with empty payload', () => {
    const e = openDayEntry('2026-07-15', 'session', 'knee', '2026-07-15T07:00:00.000Z');
    expect(e).toEqual({
      date: '2026-07-15',
      kind: 'session',
      variant: 'knee',
      feelBefore: null,
      downgradedTo: null,
      status: 'in_progress',
      sets: null,
      testResult: null,
      easyContent: null,
      reflection: null,
      completedAt: null,
      updatedAt: '2026-07-15T07:00:00.000Z',
    });
  });
});

// --- comeback -------------------------------------------------------------

describe('missedDaysBefore / comebackKind', () => {
  const today: ISODate = '2026-07-15';

  it('fresh profile has nothing to return to', () => {
    expect(missedDaysBefore([], today)).toBe(0);
    expect(missedDaysBefore([entry({ date: today })], today)).toBe(0);
  });

  it('counts entry-less days before today, ignoring today itself', () => {
    expect(missedDaysBefore([entry({ date: '2026-07-14' })], today)).toBe(0);
    expect(missedDaysBefore([entry({ date: '2026-07-13' })], today)).toBe(1);
    expect(missedDaysBefore([entry({ date: '2026-07-10' }), entry({ date: today })], today)).toBe(4);
  });

  it('oneDay only when the streak still lives — the copy must never lie', () => {
    expect(comebackKind(0, 5)).toBe('none');
    expect(comebackKind(1, 5)).toBe('oneDay');
    expect(comebackKind(1, 0)).toBe('multiDay');
    expect(comebackKind(3, 5)).toBe('multiDay');
  });
});
