// Tests for the export blob — format is binding (docs/data-model.md §5).
import { describe, expect, it } from 'vitest';
import { buildExportBlob, exportFilename } from './export';
import type { DailyEntry, UserProfile } from './types';

const profile: UserProfile = {
  id: 'singleton',
  language: 'pl',
  startDate: '2026-07-01',
  sessionDays: [1, 3, 5],
  ifThen: null,
  disclaimerAcceptedAt: '2026-07-01T10:00:00.000Z',
  createdAt: '2026-07-01T10:00:00.000Z',
};

const entry: DailyEntry = {
  date: '2026-07-02',
  kind: 'session',
  variant: 'knee',
  feelBefore: 'fresh',
  downgradedTo: null,
  status: 'completed',
  sets: [4, 5, 3, 3, 6],
  testResult: null,
  easyContent: null,
  longSetReps: null,
  reflection: 'ok',
  completedAt: '2026-07-02T12:00:00.000Z',
  updatedAt: '2026-07-02T12:00:00.000Z',
};

describe('buildExportBlob', () => {
  it('produces the binding blob shape', () => {
    const blob = buildExportBlob(profile, [entry], 2, '2026-07-14T09:00:00.000Z');
    expect(blob).toEqual({
      app: 'showup',
      schemaVersion: 2,
      exportedAt: '2026-07-14T09:00:00.000Z',
      profile,
      entries: [entry],
    });
  });

  it('copies the entries array so later list changes do not leak into the blob', () => {
    const entries = [entry];
    const blob = buildExportBlob(profile, entries, 2, '2026-07-14T09:00:00.000Z');
    entries.pop();
    expect(blob.entries).toHaveLength(1);
  });

  it('round-trips through JSON without loss', () => {
    const blob = buildExportBlob(profile, [entry], 2, '2026-07-14T09:00:00.000Z');
    expect(JSON.parse(JSON.stringify(blob))).toEqual(blob);
  });
});

describe('exportFilename', () => {
  it('uses the local date in the binding format', () => {
    expect(exportFilename('2026-07-14')).toBe('showup-export-2026-07-14.json');
  });
});
