# AI Workflow Rules

Rules for how AI agents work in this project (meta-level).

## Subagent deliverables

- Every subagent deliverable (spec, analysis, design) MUST be persisted to a file
  (usually `docs/`) by the main agent or the subagent itself. Task results in conversation
  are not artifacts — files are.
- Subagent prompts must include: files to read first (context), explicit scope
  (research/design vs code), and what to return.
- ALWAYS verify a subagent's work yourself (git status / file contents / tests) — an empty
  or confident result proves nothing.
- If a subagent ends its turn with an empty final message: resume it via `task_id` with a
  hard demand ("write the FULL report as plain text in your final message; a partial report
  with honest gaps is acceptable; an empty message is not; do not end your turn before the
  report is in the message"). This recovered the full report on the 2nd resume (fitness
  research, 2026-07-14). Only after 2 failed resumes fall back to doing the work in the
  main session while still applying the agent's persona file.
- Long subagent reports can get truncated in the transcript. If the tail is cut, resume via
  `task_id` asking for ONLY the missing section with a line cap — cheap and accurate.

## Decision dilemmas

- Key product/UX/architecture dilemmas are never decided silently. Present 2 variants
  with a recommendation and let the user decide.
- Record every user decision in the relevant doc (e.g. "Rozstrzygnięcia dylematów" section).

## Docs as source of truth

- Implementation phases read `docs/`, not conversation history.
- Current docs: `prd.md` (scope), `ux-spec.md` (screens), `data-model.md` (data & storage),
  `design-direction.md` (visuals), `titd-method.*.md` (method foundation),
  `fitness-research.md` (fitness sibling-app research + decisions).
