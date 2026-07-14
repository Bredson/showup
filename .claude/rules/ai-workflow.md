# AI Workflow Rules

Rules for how AI agents work in this project (meta-level).

## Subagent deliverables

- Every subagent deliverable (spec, analysis, design) MUST be persisted to a file
  (usually `docs/`) by the main agent or the subagent itself. Task results in conversation
  are not artifacts — files are.
- Subagent prompts must include: files to read first (context), explicit scope
  (research/design vs code), and what to return.
- ALWAYS verify a subagent's work yourself (git status / file contents / tests) — an empty
  or confident result proves nothing. If a subagent returns empty twice, fall back to doing
  the work in the main session while still applying the agent's persona file.

## Decision dilemmas

- Key product/UX/architecture dilemmas are never decided silently. Present 2 variants
  with a recommendation and let the user decide.
- Record every user decision in the relevant doc (e.g. "Rozstrzygnięcia dylematów" section).

## Docs as source of truth

- Implementation phases read `docs/`, not conversation history.
- Current docs: `prd.md` (scope), `ux-spec.md` (screens), `data-model.md` (data & storage),
  `design-direction.md` (visuals), `titd-method.*.md` (method foundation).
