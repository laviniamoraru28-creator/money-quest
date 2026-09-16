# Money Quest — Final Architecture Report (Privacy-First Redesign)

Not a legal compliance certification. This describes what was actually built and verified this session — full type-check clean, all 8 remaining automated test suites passing (22 checks in the new core logic alone) — and states plainly what's still incomplete.

## Final architecture

```
Browser
  |
  |-- Static content (bundled at build time, no network call)
  |     |-- src/content/worlds.ts       (7 worlds)
  |     |-- src/content/curriculum/     (21 lessons)
  |     `-- src/game-engine/configs/    (12 games)
  |
  |-- localStorage (src/lib/local-progress/)
  |     `-- one key: moneyquest_local_progress_v1
  |           (level choice, currency, XP, wallet, completed
  |            activities, savings goals -- never transmitted anywhere)
  |
  `-- Next.js app (src/app/[locale]/)
        |-- /            marketing landing page
        |-- /play        level selector -> world map -> lesson/game -> goals
        |-- /learn       static SEO article hub (unrelated to accounts)
        |-- /parent-info plain-language parent explainer
        |-- /privacy     in-app privacy summary
        |-- /contact
        `-- /api/health  process-liveness check only, no DB to check
```

No database. No authentication. No accounts. No server-side personal data of any kind.

## The redesign, in one sentence

Every feature that used to require a server-side profile (progress tracking, savings goals, badges) was rebuilt to run entirely in the browser, and every feature that used to require an account (parent settings, Grown-up Mode, data export) was removed outright because there is no longer a profile for those features to act on.

## What was removed entirely

Supabase (database + auth), the whole `/parent` area, sign-up/login/onboarding, the Grown-up Mode PIN gate, server-side XP/wallet/goals/badges, login rate limiting, the advertising and sponsorship systems, first-party analytics, and 12 now-broken test scripts along with 6 e2e journey specs that tested deleted flows.

## A genuine improvement made possible by the rebuild

The old server-side XP system awarded XP on activity completion, not correctness -- a documented design debt from an earlier session that couldn't safely be fixed without touching every dependent system. The new local engine has no such legacy constraint: XP and coins are gated on correctness from the first line of `src/lib/local-progress/state.ts`, tested explicitly against a wrong-answer case.

## Honest gaps -- not silently dropped

- The Money Life Simulator is currently unreachable via any page. Its pure engine (`src/simulator/engine.ts`) and its shell component still exist and compile cleanly (decoupled from the deleted Server Action the same way GameShell was), but no `/play` route renders it yet. A real, deliberate scope decision given this session's size, not an oversight.
- No end-to-end browser tests exist for the new architecture. The old ones tested a system that no longer exists and were removed rather than left broken; nothing has replaced them yet at the browser level (see `e2e/README.md`).
- Romanian and other locale translations for the two new pages (Parent Information, and the rewritten copy on `/privacy`) are English-only -- they weren't part of the existing translated key set and weren't retrofitted into the full translation pipeline this session.
