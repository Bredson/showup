// Tests for the export blob — format is binding (docs/data-model.md §5).
import { describe, expect, it } from 'vitest';
import { buildExportBlob, exportFilename } from './export';
import type { DailyEntry, UserProfile } from './types';

const profile: UserProfile = {
  id: 'singleton',
  language: 'pl',
  startDate: '2026-07-01',
  quiz: { answers: { triggers: ['fear'] }, dominantTriggers: ['anxiety'], completedAt: '2026-07-01T10:00:00.000Z' },
  createdAt: '2026-07-01T10:00:00.000Z',
};

const entry: DailyEntry = {
  date: '2026-07-02',
  challengeId: 'l1-001',
  emotionBefore: 'anxiety',
  ifThen: null,
  status: 'completed',
  reflection: 'ok',
  completedAt: '2026-07-02T12:00:00.000Z',
  updatedAt: '2026-07-02T12:00:00.000Z',
};

describe('buildExportBlob', () => {
  it('produces the binding blob shape', () => {
    const blob = buildExportBlob(profile, [entry], 1, '2026-07-14T09:00:00.000Z');
    expect(blob).toEqual({
      app: 'unstuck',
      schemaVersion: 1,
      exportedAt: '2026-07-14T09:00:00.000Z',
      profile,
      entries: [entry],
    });
  });

  it('copies the entries array so later list changes do not leak into the blob', () => {
    const entries = [entry];
    const blob = buildExportBlob(profile, entries, 1, '2026-07-14T09:00:00.000Z');
    entries.pop();
    expect(blob.entries).toHaveLength(1);
  });

  it('round-trips through JSON without loss', () => {
    const blob = buildExportBlob(profile, [entry], 1, '2026-07-14T09:00:00.000Z');
    expect(JSON.parse(JSON.stringify(blob))).toEqual(blob);
  });
});

describe('exportFilename', () => {
  it('uses the local date in the binding format', () => {
    expect(exportFilename('2026-07-14')).toBe('unstuck-export-2026-07-14.json');
  });
});
