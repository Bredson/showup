# Project Instructions

This file contains team-wide instructions for AI assistants working on this project.
It should be committed to version control.

## Project Overview

<!-- Describe your project here -->

## Conventions

<!-- Add coding conventions, architecture decisions, and team standards -->

## Workflow

<!-- Describe the development workflow -->

## AI Assistant Rules

### Post-Stage Analysis (mandatory)

After completing every stage of work, the AI assistant must:

1. **Analyze** what was done — new features, patterns used, architectural decisions, problems encountered, solutions applied
2. **Update `.claude/`** based on that analysis:
   - New coding patterns → `.claude/rules/`
   - Reusable workflows → `.claude/skills/`
   - Specialized personas needed → `.claude/agents/`
   - Useful slash commands → `.claude/commands/`
3. **Never skip this step** — the `.claude/` directory is a living knowledge base that grows with the project
