# Data Model Rules (binding — decided in storage design phase)

Full specification: see design doc delivered in the storage-design session (docs/prd.md §5, §9 context).

## Binding decisions

1. **Single source of truth = `DailyEntry`.** Streak, completion counters, difficulty level and
   used-challenge set are ALWAYS derived from `DailyEntry` records. `ProgressState` is an
   in-memory read model — never persist counters that can drift out of sync.
2. **Storage = IndexedDB** behind a thin `StorageAdapter` interface (get/put/getAll/delete per
   store). No direct IndexedDB calls from domain or UI code. This keeps a future Capacitor
   SQLite swap trivial.
3. **Challenges are static content, not user data.** They ship as a bundled `challenges.json`
   (with `contentVersion`), are never written to IndexedDB, and are referenced by stable `id`.
   Challenge IDs are immutable forever (journal entries point at them).
4. **Dates:** calendar dates as local-timezone `YYYY-MM-DD` strings; day boundary = local
   midnight. Timestamps as ISO 8601 strings. No Date objects in storage.
5. **Forgiving streak:** every single-day gap is forgiven (repeatable grace); 2+ consecutive
   missed days reset. A pending "today" never breaks a streak. Streak counts only completed
   days (forgiven gap days do not increment it).
6. **Challenge of the day is assigned once and persisted** in `DailyEntry.challengeId` at first
   open; selection before persistence is deterministic (hash of date over sorted eligible pool).
7. **Schema versioning:** `meta.schemaVersion` integer + ordered pure migration functions run
   at startup AND on JSON import. Export = full JSON blob of user data (profile + entries +
   schemaVersion), never includes challenge content.
