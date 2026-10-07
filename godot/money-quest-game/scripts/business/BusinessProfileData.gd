class_name BusinessProfileData
extends Resource
## BusinessProfileData — the ONE business a child builds, step by step,
## across all 18 real Entrepreneur Quest BUILD stages (ports the real
## website's `BusinessProfile` — see src/lib/entrepreneur-quest/state.ts).
## Held by the `BusinessBuilder` autoload, persisted via `SaveManager`
## exactly like every other piece of progress — see its own doc comment
## for why this is the first Entrepreneur Quest feature with its own
## multi-step persistent state, rather than one self-contained quest.
##
## Deliberately does NOT track the real website's running
## `reputationOutOf5`/`revenueMinorUnits`/`costsMinorUnits` stats — those
## accumulate from numeric effects on EVERY decision across BUILD, RUN,
## and RESCUE & GROW, which the 26 already-ported Godot quests don't
## carry (they pay a flat xp/coin reward instead). Showing a fabricated
## running reputation here would be inventing a number this project
## never actually computed — an honest gap, not ported.
##
## All money fields are plain major-unit integers (no currency symbol,
## no minor-unit cents) — the same simplification already used for
## Phase 52's Pricing Experiment/Cash Flow quests, since this project's
## virtual economy has no real-currency formatting to apply to them.

@export var problem: String = ""
@export var idea_description: String = ""
@export var business_name: String = ""
@export var logo: BusinessLogoData = BusinessLogoData.new()
@export var slogan: String = ""
@export var product_category: String = ""
@export var product_description: String = ""
@export var customer_category: String = ""
@export var cost_per_unit: int = 2
@export var price: int = 5
@export var marketing_approach: String = ""
@export var why_choose_us: String = ""
@export var next_step: String = ""

## Stage ids completed so far, in order — see BusinessBuilder.STAGE_IDS.
## Resuming always continues at `completed_stage_ids.size()`, the same
## simple linear assumption the real website's own `currentOrder =
## completedStageIds.length + 1` makes.
@export var completed_stage_ids: Array[String] = []
@export var pitch_completed: bool = false

## The most recent Business Simulator attempt, if any has been run yet
## — `has_simulator_run` distinguishes "never run" from "ran and made
## nothing," the same reason the real website's `latestSimulatorRun` is
## nullable.
@export var has_simulator_run: bool = false
@export var last_units_made: int = 0
@export var last_units_sold: int = 0
@export var last_sales: int = 0
@export var last_costs: int = 0
@export var last_profit: int = 0
@export var last_remaining_money: int = 0

## Money is a tool: what the child decided to do with the profit (stage
## "calculate-your-profit"): "stock", "save", "equipment", "learn" or
## "help" ("" = not decided yet), and what that changed. No choice is the
## right one; each has its own effect.
@export var profit_plan: String = ""
@export var business_savings: int = 0
@export var stock_ready: int = 0
@export var equipment_level: int = 0
@export var goodwill: int = 0
@export var learn_level: int = 0
