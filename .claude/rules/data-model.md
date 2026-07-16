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
7. **Schema versioning:** `meta.schemaVersion` integer, `CURRENT_SCHEMA_VERSION = 2`.
   v1→v2 has NO migration: v1 data is junk from the Unstuck clone, so the IDB upgrade
   wipes all stores and v1 blobs are rejected on import (`invalid`, "no migration");
   `schemaVersion > current` → `newer`. Future versions (3+) get ordered pure migration
   functions run at startup AND on JSON import. Export = full JSON blob with
   `app: 'showup'` (intentionally incompatible with Unstuck exports), never includes
   program content.
9. **Import validation enforces the §1 cross-field invariants**, not just field types:
   each result field (`sets`, `testResult`, `easyContent`, `reflection`, `feelBefore`,
   `downgradedTo`) may be non-null ONLY on the day shape it belongs to — a foreign value
   would poison `ProgramState` derivation. Deliberately unchecked: which fields must be
   non-null when `completed` (in_progress entries legitimately have nulls) and
   `completedAt` ⇔ status (not spec'd).
8. **`bracket` is purely derived from `lastMT`** (`bracketFor(lastMT)`). After variant
   graduation, `lastMT` is seeded (`variantSeedFactor × old MT`) until the first real test
   on the new variant.
10. **Additive field = no schema bump** (lesson: `longSetReps`, 2026-07-16). A new
    nullable field on `DailyEntry` keeps `schemaVersion` when: old records/blobs simply
    LACK the key (reads as `undefined`), every read site treats missing-as-null
    (`!= null`, not `!== null`), import accepts the missing key (`undefined` passes,
    only present-but-malformed rejects), and old IDB records are never re-persisted via
    spread (entries are always rewritten from freshly created objects). Import tests MUST
    include a delete-the-key "pre-feature blob" case — the shared fixture will have the
    key, so the backward-compat test must remove it explicitly.
11. **"Poisons derivation" (§9) includes offering/cadence predicates**, not just
    `ProgramState`: a forged degraded day with `easyContent: 'long-set'` never feeds the
    engine, yet suppresses `longSetOffered` for the whole week — that's derived-state
    poisoning too, so import rejects it. When adding a derivation over entries, re-ask
    which impossible shapes now become load-bearing.
