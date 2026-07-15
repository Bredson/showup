// Showup — data export domain. Source of truth: docs/data-model.md §5.
// RULE: no React/storage imports; time is injected. The blob format is also the
// migration format — changing it requires a schemaVersion bump + a Migration.

import type { LegacyDailyEntry, LegacyExportBlob, ISODate, ISODateTime, LegacyUserProfile } from './types';

/**
 * Assemble the export blob. Inputs are referenced, not copied — the caller
 * serializes to JSON immediately (ui), so no aliasing can outlive the call.
 */
export function buildExportBlob(
  profile: LegacyUserProfile,
  entries: readonly LegacyDailyEntry[],
  schemaVersion: number,
  exportedAt: ISODateTime,
): LegacyExportBlob {
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
