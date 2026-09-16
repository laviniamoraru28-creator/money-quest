# Money Quest — Money Life Simulator

## Why this is a different engine, not an extension of the game engine

The game engine (`src/game-engine/`) scores discrete rounds — each one has a checkable right answer. The simulator is fundamentally different: it's a **multi-week run with persistent state** where a savings goal accumulates, a balance carries forward, and an early decision (how much to set aside "just in case") changes what a later event (a bike repair) actually costs the child. There's no single "correct" allocation to check against — reusing `GameShell`/`AllocateMechanic` here would have meant forcing a real budgeting decision into a quiz-shaped box it doesn't fit. That's why `WeekAllocationPanel` is its own component even though it looks similar to the game engine's `AllocateMechanic` — see the comment at the top of that file.

## Architecture

```
src/simulator/
  types.ts          — currency-agnostic content model (SimScenario, SimWeek, SimEvent)
  engine.ts           — applyWeek(): the ONE pure state-transition function, no UI/side effects
  report.ts            — generateReportInsights(): pure function, real numbers -> real observations
  all-scenarios.ts       — the scenario registry
  scenarios/
    explorer-standard.ts   — 4 weeks, kite goal
    explorer-challenge.ts    — 5 weeks, bike helmet goal, more events
    builder-standard.ts        — proof the pattern extends past Explorer band
    strategist-standard.ts       — proof it extends to the oldest band too
  components/
    WeekAllocationPanel.tsx — the 5-category open-ended split for one week
    EventCard.tsx             — displays expense/opportunity/milestone/windfall events
    WeekSummaryCard.tsx         — consequence + running balance, before continuing
    FinalReportCard.tsx           — the required end-of-run figures + insights
    SimulatorShell.tsx              — orchestrates the whole run, same role GameShell plays for games
```

## Currency is never in the content

Per the brief's example scenarios ("You receive £10 this week" / "$20" / "€15"), every `SimWeek.incomeMinorUnits` is a plain number. `SimulatorShell` renders it through the exact same `formatCurrency(amount, currencyCode)` every other part of the app uses — the same 4-week Explorer scenario produces "You receive £10 this week" for a UK child and "You receive $10 this week" for a US child from the identical config object, with the currency resolved from `children.currency_code`, never written into scenario content.

## The five allocation categories and how "Unexpected expenses" actually works

The brief lists Needs, Wants, Savings, Giving, and Unexpected expenses as the five things a child allocates between. Rather than making "Unexpected" a category that only appears reactively when an event forces it, `WeekAllocationPanel` treats it as a genuine weekly choice — the child can proactively set some coins aside "just in case," every week, whether or not anything happens that week. This is a deliberate pedagogical choice: it's what makes an expense event's consequence actually depend on an earlier decision.

Concretely, in `engine.ts`'s `applyWeek()`:
1. Everything allocated to `savings` and `unexpected` adds to the running balance (money kept, not spent).
2. If that week has an `expense` event, its cost is drawn **first** from that week's `unexpected` allocation.
3. Anything the buffer doesn't cover is drawn from the overall balance instead — and the child sees a different, honest consequence message depending on which happened (`expenseConsequenceCovered` vs. `expenseConsequenceShortfall`).

This was verified, not assumed: `scripts/test-simulator-engine.ts` exercises both branches explicitly and checks the exact resulting balance by hand-computed arithmetic.

## Every decision has a consequence — concretely, not just in spirit

- **Expense events** always resolve to a specific, visible outcome: covered by the buffer, or a shortfall drawn from balance — both paths shown with distinct, honest copy.
- **Opportunity events** (the sale, the birthday) present a genuine 2-option choice, each with its own `consequence` string shown immediately after choosing.
- **Milestone events** (reaching the goal) are independently verified by the engine against the actual accumulated `totalSavingsMinorUnits` — a scenario can place a "check your goal" event at week 4, but if the child's own choices didn't actually save enough, `applyWeek()` shows the honest `notYetMessage`, never a false celebration. This is enforced in code, not left to a content author to remember.
- **Windfall events** visibly add to that week's spendable total, shown as a distinct "+ bonus this week!" line.

## Never shame — how the simulator applies the same standard as the game engine

Every `expenseConsequenceShortfall`, `notYetMessage`, and opportunity `consequence` in the four scenarios describes what happened and why, in the same register as the game engine's feedback rules ("that's exactly why a cushion helps," "there'll be other concerts") — never a statement about the child. This wasn't run through the game engine's automated `feedback-guard.ts` in this pass (that tool is scoped to `GameConfig` objects specifically); extending it to also validate `SimScenario` content is a reasonable next step, noted here rather than silently assumed to already be covered.

## The end-of-run report

`FinalReportCard` shows exactly the figures the brief specifies — starting balance, income, spending (broken down by needs/wants/giving), savings, remaining balance, and goal progress (as both an amount and a percentage) — plus 2-4 generated insights from `generateReportInsights()`. Every insight reads real numbers out of the final `SimRunningState`; none of them are fixed praise text disconnected from what actually happened. This was checked directly: a test run with a goal genuinely met produces a goal-met insight and correctly does *not* produce a false "buffer held up well" line when no expense event occurred to test the buffer at all — an actual bug caught and fixed during development, not a hypothetical.

## How completion plugs into the rest of the app

A simulator scenario is stored as an `activities` row with `activity_type = 'challenge'` — not a new type requiring a schema migration, and a deliberate one: the curriculum already defines Challenges as "bigger, often multi-step" tasks, which is exactly what a multi-week simulation is. The row's `content` is a thin pointer (`{ engineType: "simulator", scenarioKey }`); the real scenario lives in code. On completing the final week, `SimulatorShell` calls the same `complete_activity()` RPC every Lesson and Game uses, so XP, coins, and progress tracking all work identically across all three activity types with no special-casing anywhere in the database layer.

## Verified numerically, not just by inspection

Every scenario's savings goal was checked against actual total resources (starting balance + all weekly income, including windfalls) minus mandatory expense costs, to confirm the goal is genuinely reachable with a balanced allocation. This caught a real content bug: `builder-standard`'s original goal (6000) exactly equaled total resources (6000), but a mandatory 600-cost expense event meant the goal was mathematically impossible even if the child saved every other coin. `strategist-standard` was similarly too tight. Both were fixed and re-verified against the same check before being included here.

## Adding a new scenario

1. Write `src/simulator/scenarios/<key>.ts` — a `SimScenario` with `weeks`, a `savingsGoal`, and reward figures.
2. **Check goal reachability**: total resources (starting balance + Σ spendable income) minus total mandatory expense costs should comfortably exceed the goal — leave real room for needs/wants/giving, not just barely enough if 100% were saved.
3. Add it to `ALL_SCENARIOS` in `all-scenarios.ts`.
4. Run `npx tsx scripts/generate-simulator-seed-sql.ts > supabase/migrations/000N_seed_<name>.sql` and apply it.
5. Play it at `/simulator/<generated-id>?child=<id>`.

Nothing else changes — `SimulatorShell`, the report, and the reward wiring all work automatically because they're built against the `SimScenario` shape, never an enumerated scenario list.

## Known limitations

- Only one scenario each for Builder and Strategist bands (no "challenge" difficulty yet for those two, unlike Explorer's two tiers) — the pattern is proven, the remaining content isn't authored yet.
- `feedback-guard.ts`'s automated shaming-language check currently only runs against `GameConfig` objects, not `SimScenario` content — the four scenarios here were reviewed by hand against the same standard, but an automated check would close the gap the same way it does for games.
- The dashboard link to the simulator resolves only the *standard*-difficulty scenario for a child's age band; there's no in-app way to reach the Explorer challenge scenario yet without navigating directly to its URL.
