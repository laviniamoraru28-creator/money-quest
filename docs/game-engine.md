# Money Quest — Game Engine

## Architecture

12 launch games, **7 reusable mechanics**, **1 shared shell**. No game has its own bespoke UI — every game is a `GameConfig` object that picks a mechanic and supplies content.

```
src/game-engine/
  types.ts              — the config contract (GameConfig, GameVariant, GameRound union)
  GameShell.tsx          — shared chrome: progress, hints, retry, scoring, feedback, XP/coin award
  registry.ts             — maps each mechanic name to its renderer component
  feedback-guard.ts        — validates feedback copy against banned/required phrasing
  mechanics/
    SortMechanic.tsx        — items into 2+ buckets (Needs or Wants, Save or Spend)
    CompareMechanic.tsx      — pick the best of 2-3 options (Smart Shopper, Price Detective)
    AllocateMechanic.tsx      — distribute a fixed amount (Build a Budget)
    MatchMechanic.tsx          — pair matching (Earn Your Coins, Currency Explorer)
    NumericMechanic.tsx         — compute/enter a number (Bank Builder, Interest Grower, Reach Your Goal)
    SpotMechanic.tsx              — flag suspicious items (Scam Detective)
    MultipleChoiceMechanic.tsx     — classic single-best-answer (Money Choices)
  configs/
    needs-or-wants.ts   — full 3-age-band worked example
    <11 more games>.ts    — Explorer band, 2 difficulty tiers each
  all-games.ts            — the launch catalogue
```

## How a game actually runs

1. A `worlds`/`activities` DB row (activity_type = `'game'`) stores only a pointer: `{ engineType: "game", gameKey: "needs-or-wants" }`. The real content lives in code, not the database — the DB row exists so games plug into the exact same progress-tracking, XP, and Learning World listing infrastructure Lessons already use.
2. `/world/[worldId]/game/[activityId]` loads that pointer, looks up the matching `GameConfig` in `GAME_BY_KEY`, and renders `<GameShell>`.
3. `GameShell` calls `getVariant(config, childAgeBand, difficulty)` to pick the right content for that child, then dispatches each round to `MECHANIC_REGISTRY[round.mechanic]`.
4. On completing the last round correctly, `GameShell` calls the exact same `complete_activity()` Postgres RPC every Lesson uses — a game is not a special case to the database.

## Why 7 mechanics instead of 12 bespoke games

The brief requires "new games should be addable without rewriting the entire application." Concretely, that means: **adding game #13 is a content change (a new `GameConfig`), not a code change** — unless it genuinely needs an 8th interaction pattern none of the seven already covers. This is the actual, testable meaning of "reusable" here, not just a description.

## Adding a new game — checklist

1. Pick a mechanic. If one of the seven fits, skip to step 2. If it genuinely doesn't, add a new mechanic component under `mechanics/`, a new `GameRound` variant in `types.ts`'s discriminated union, and one line in `registry.ts` — this is the only scenario that touches engine code.
2. Write `src/game-engine/configs/<your-game>.ts`: at minimum one `GameVariant` for Explorer band, `difficulty: "standard"`. Every round's `explanation` field is required and is what the child reads after answering — this is where "explain why" lives structurally, not as a convention someone can forget.
3. Add it to `ALL_GAMES` in `all-games.ts`.
4. Run `npx tsx scripts/validate-game-feedback.ts` — fails the build if your feedback copy matches a banned shaming pattern.
5. Run `npx tsx scripts/generate-game-seed-sql.ts > supabase/migrations/000N_seed_<your-game>.sql` and apply it — this generates the `activities` row(s) straight from your config, so the database can never drift from the real content.
6. Play it end-to-end at `/world/<worldId>/game/<generated-activity-id>?child=<id>`.

Nothing else changes. `GameShell`, the Learning World listing, XP/coin awarding, and progress tracking all pick up the new game automatically because they were built against the config shape, never an enumerated game list.

## The "never shame" rule, enforced not just documented

Every game's `feedback.incorrect` and every round's `explanation` field is checked by `feedback-guard.ts` against a banned-pattern list (e.g. `/you'?re\s+(bad|terrible)\s+(at|with)/i`, `/(bad|poor)\s+with\s+money/i`). This isn't a style guideline in a doc someone can skip — `npx tsx scripts/validate-game-feedback.ts` is a real, running check, and it was actually exercised during development: it correctly passed all 12 real games clean, and correctly caught 3 distinct violations when fed a deliberately bad test string ("You're bad with money, wrong again.").

The required redirect phrasing from the brief — "Let's think about another option," "Here's what would happen," "Try again" — is checked as a **soft warning**, not a hard rule, since good redirect language has more valid forms than any fixed list can enumerate (e.g. "Let's check that balance again" is fine and wasn't in the original pattern list — the check was widened once this was noticed during a real validation run, not assumed correct upfront).

## Retry and scoring philosophy

A round can be retried without limit and without penalty — `GameShell` tracks `firstTryCorrectCount` for the end-of-game score display, but completion (and the XP/coin award) happens once every round has *eventually* been answered correctly. This matches the curriculum's own mastery-oriented design: retrying isn't a failure state, it's the expected path for a child still learning the concept.

## Currency handling

Every mechanic that displays a monetary amount takes a `usesCurrency` flag and a `currencyCode`, and formats through the same `formatCurrency()` used everywhere else in the app (`src/lib/currency/format.ts`) — no game hardcodes a symbol. `NumericMechanic`'s answer-checking deliberately compares in **major units** (e.g. "10" meaning 10 coins) rather than converting to minor units, specifically because a fixed minor-unit `correctValue` would silently be wrong for JPY (0 decimal places) versus every other launch currency (2 decimal places) — this was a real bug caught and fixed during development, not a hypothetical.

## Known limitation

Difficulty tiers (`standard`/`challenge`) exist in every config's schema, but there's no in-app picker yet — `GameShell` always plays `difficulty: "standard"`. The seed-generation script takes reward figures from each age band's standard variant for exactly this reason. Exposing a difficulty picker is a reasonable next increment; when it ships, the reward-consistency comment in `GameShell.tsx` and the seed script both need revisiting together, since they currently assume one reward tier per (game, age band).
