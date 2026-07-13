# Product Principles (binding for all agents)

These principles bind every product and code decision in this project. When in doubt, re-read.

## 1. One challenge per day

The home screen shows exactly one challenge. Any feature competing for attention on the home
screen is rejected by default.

## 2. Don't over-engineer

Procrastination is an emotion regulation problem (Sirois & Pychyl 2013), not a productivity
problem. This app is NOT a todo list, NOT a planner, NOT a time tracker. Reject features that
drift toward productivity tooling.

## 3. Self-compassion over pressure

- A missed day never triggers guilt mechanics (no broken-streak shaming, no red warnings).
- Forgiving streak: one missed day does not reset progress.
- Copy tone: warm, non-judgmental, never commanding.

## 4. The daily loop is sacred

emotion check → challenge → IF-THEN → do it (2-min rule) → reflection → reinforcement.
Full loop must take < 5 minutes. Every added second needs justification.

## 5. Privacy first

All user data (emotions, journal) stays on device. No external analytics, no accounts in MVP.

## 6. Bilingual by design

Every user-facing string goes through i18n (PL/EN). Hardcoded strings = bug.

## Source of truth

- Method: `docs/titd-method.en.md`
- Scope: `docs/prd.md` — features listed as "out of MVP" are out. Adding them requires
  explicit user approval.
