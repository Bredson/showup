# Data Model Rules (binding — decided in storage design phase, revised for Showup)

Full specification: `docs/data-model.md` (Showup version, post-review 2026-07-15).

## Binding decisions

1. **Single source of truth = `DailyEntry`.** Streak, program position (variant, bracket,
   block week), test history are ALWAYS derived from `DailyEntry` records via
   `computeProgram(entries, profile, program)`. `ProgramState` is an in-memory read
   model — never persist counters or positions that can drift out of sync.
   **Snapshot exception:** a written entry's `kind`/`variant` always wins over derivation;
   derivation only decides days not yet opened.
2. **Storage = IndexedDB** (database name `showup` — MUST differ from Unstuck, shared
   github.io origin) behind the inherited `StorageAdapter` interface. No direct IndexedDB
   calls from domain or UI code.
3. **Program parameters are static content, not user data.** They ship as a bundled
   `program.json` (with `programVersion`): brackets as % of max, thresholds, factors.
   Never written to IndexedDB. Instructional copy lives in i18n, not in program.json.
4. **Dates:** calendar dates as local-timezone `YYYY-MM-DD` strings; day boundary = local
   midnight. Timestamps as ISO 8601 strings. No Date objects in storage.
5. **Forgiving streak:** inherited mechanics unchanged. Semantics: a `completed` day of ANY
   kind (session / easy / test / pain-downgraded) counts toward the streak. Streak never
   depends on reps or test results.
6. **Day kind and variant are assigned once and persisted** in the entry at first open
   (immutable snapshot). Pain degradation is recorded in `downgradedTo`, never by mutating
   `kind`. Block position is counted in scheduled session SLOTS (3 per block week), not
   calendar weeks; pause > 14 days freezes position and forces a retest.
7. **Schema versioning:** `meta.schemaVersion` integer + ordered pure migration functions run
   at startup AND on JSON import. Export = full JSON blob with `app: 'showup'`
   (intentionally incompatible with Unstuck exports), never includes program content.
8. **`bracket` is purely derived from `lastMT`** (`bracketFor(lastMT)`). After variant
   graduation, `lastMT` is seeded (`variantSeedFactor × old MT`) until the first real test
   on the new variant.
