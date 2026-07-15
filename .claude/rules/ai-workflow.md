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

## Fork hygiene (lesson from Showup rebranding, 2026-07-15)

- Rebranding a fork must cover SEMANTICS, not just names: `.claude/rules/` files still
  described Unstuck's challenge/level model after the name-level rebrand — caught only by
  independent review. When forking: audit every rules/skills file for domain assumptions.
- Inherited docs that are not yet valid for this app must carry an explicit "superseded"
  stamp at the top (see `docs/ux-spec.md`) instead of being silently misleading.

## Spec review loop

- Before implementing an engine/spec, run an independent subagent review (verdict:
  SHIP / FIX FIRST / RETHINK). The Showup data-model review caught 4 blockers, all of them
  state-derivation gaps (undefined values after transitions, non-derivable positions).
  When reviewing derived-state designs, specifically probe: every transition (does each
  derived value stay defined?), pause/resume, and edge slots (first/last of a cycle).
- Record the review verdict and applied fixes in the doc itself (see data-model.md §8).

## Docs as source of truth

- Implementation phases read `docs/`, not conversation history.
- Current docs: `prd.md` (scope), `data-model.md` (data & storage + program engine),
  `pushup-program-research.md` (program skeleton §3), `fitness-research.md` (fork
  rationale), `titd-method.*.md` (method foundation). `ux-spec.md` and
  `design-direction.md` are inherited from Unstuck — ux-spec is superseded (stamped),
  design direction still binding (PRD §8).
