# Product Principles (binding for all agents — Showup)

These principles bind every product and code decision in this project. When in doubt, re-read.

## 1. One program day per screen

The home screen shows exactly today's program day (session / easy / test) and nothing else.
Any feature competing for attention on the home screen is rejected by default.

## 2. Habit = showing up, not the result

The streak rewards presence (2-minute minimum), never rep counts or test results
(Phillips & Gardner 2016). Ability progression is gated ONLY by scheduled Max Tests —
"your test decides, not the calendar". NO gamification of daily max attempts, ever.

## 3. Self-compassion over pressure

- A missed day never triggers guilt mechanics (no broken-streak shaming, no red warnings).
- Forgiving streak: one missed day does not reset progress.
- A failed test is a "consolidation block", never a failure message.
- Copy tone: warm, non-judgmental, never commanding.

## 4. The daily loop is sacred

Hard session: feel check → session plan (auto-adjusted) → log sets → reflection →
reinforcement, < 60 s of app interaction. Easy day: 2-min minimum → check off, < 20 s.
Every added second needs justification.

## 5. Safety is built into the loop

Feel check gates every session and test ("pain" → day downgraded to easy + red-flags copy).
Deloads and rest days are features, not obstacles. Health disclaimer before every Max Test.

## 6. Privacy first

All user data (feel, sets, tests, journal) stays on device. No external analytics,
no accounts in MVP.

## 7. Bilingual by design

Every user-facing string goes through i18n (PL/EN). Hardcoded strings = bug.

## Source of truth

- Program: `docs/pushup-program-research.md` §3 (binding rule details: `docs/data-model.md` §4)
- Scope: `docs/prd.md` — features listed as "out of MVP" are out. Adding them requires
  explicit user approval.
