// Showup — data export domain. Source of truth: docs/data-model.md §5.
// RULE: no React/storage imports; time is injected. The blob format is also the
// migration format — changing it requires a schemaVersion bump + a Migration.

import type { DailyEntry, ExportBlob, ISODate, ISODateTime, UserProfile } from './types';

/**
 * Assemble the export blob. The entries ARRAY is copied (a later push on the
 * caller's list must not grow the blob); profile and the entry objects are
 * referenced — the caller serializes to JSON immediately (ui), so object
 * aliasing cannot outlive the call.
 */
export function buildExportBlob(
  profile: UserProfile,
  entries: readonly DailyEntry[],
  schemaVersion: number,
  exportedAt: ISODateTime,
): ExportBlob {
  return {
    app: 'showup',
    schemaVersion,
    exportedAt,
    profile,
    entries: [...entries],
  };
}

/** File name fixed by data-model §5: showup-export-YYYY-MM-DD.json (local date). */
export function exportFilename(today: ISODate): string {
  return `showup-export-${today}.json`;
}
