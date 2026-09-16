# End-to-end tests — currently empty, honestly

Every journey previously here (onboarding, learning, savings goals, parent access, account deletion, cross-family access) tested the account-based architecture removed in this session's privacy-first redesign — sign-up, login, parent dashboards, and Grown-up Mode no longer exist, so those specs no longer describe anything real. Removing them was more honest than leaving broken tests referencing deleted pages.

## What replaced them at the unit level

`scripts/test-local-progress-state.ts` covers the new architecture's core logic (22 checks) — but that's state-transition logic, not a real browser journey.

## What's still missing

Real end-to-end coverage of the new architecture: opening the site with no prior visit, choosing a level, completing a lesson and a game, checking progress persists across a reload, and confirming "Reset Progress" actually clears everything. This is a genuine, named gap — see `docs/final-architecture-report.md`'s roadmap section — not something quietly dropped.
