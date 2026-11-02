import {
  EQ_STARTING_MONEY_MINOR_UNITS,
  EQ_TOTAL_POTENTIAL_CUSTOMERS,
  EQ_DEFAULT_COST_PER_UNIT_MINOR_UNITS,
  EQ_DEFAULT_PRICE_MINOR_UNITS,
  EQ_STARTING_REPUTATION,
  EQ_MIN_REPUTATION,
  EQ_MAX_REPUTATION,
  EQ_DECISION_EFFECTS,
  EQ_CUSTOMER_CATEGORY_IDS,
  EQ_PRODUCT_CATEGORY_IDS,
  EQ_RESCUE_SCENARIO,
  EQ_RESCUE_RESPONSE_EFFECTS,
  EQ_PRICING_EXPERIMENT_COST_PER_UNIT_MINOR_UNITS,
  type EQDecisionEffect,
} from "@/content/entrepreneur-quest/structures";

/**
 * Pure state-transition logic for Entrepreneur Quest's own virtual
 * company — deliberately a SEPARATE persisted entity from
 * LocalProgressState (see use-entrepreneur-quest.ts for the storage
 * key), not a set of fields bolted onto it. This mirrors how
 * src/simulator/engine.ts already keeps the Money Life Simulator's
 * week-by-week economy (SimRunningState) fully independent of the
 * shared wallet: a self-contained economic sandbox is the established
 * pattern in this codebase for "practice with numbers that don't
 * affect your real Money Quest wallet." Badges earned here still go
 * into the ONE shared `earnedBadgeIds` array in LocalProgressState
 * (via local-progress/state.ts's awardBadge) — that part IS meant to
 * be shared, so a child's badges live in one place regardless of which
 * part of the app awarded them.
 *
 * This is the CENTRAL, persistent record of the child's own company —
 * every stage, decision event, and the simulator all read from and
 * write into this ONE object (`EntrepreneurQuestState`), rather than
 * each owning an independent, disconnected mini-experience. A stage
 * completing adds or changes something about the company; a decision
 * choice measurably moves the company's own sales/reputation numbers;
 * the simulator's results accumulate into the company's running
 * revenue/costs, not just a one-off scorecard. That's what makes the
 * final pitch and the company dashboard genuinely reflect a company
 * the child built, step by step, rather than a quiz result.
 */

/** Curated category fields are stored as structural keys (e.g.
 * "crafts", "kids"), never as translated display strings — the exact
 * same principle already used for game/lesson content throughout this
 * app (see money-quest-currency-architecture.md's "never bake a
 * locale's words into saved data" rule, applied here to business data
 * instead of currency). The UI looks up the current locale's label for
 * a given key at render time; changing the child's language later
 * still shows their own company correctly, in the new language. */
export interface BusinessLogo {
  shape: string;
  colorKey: string;
  symbol: string;
}

export interface BusinessProfile {
  businessName: string;
  slogan: string;
  ideaDescription: string;
  problem: string;
  /** A curated category key (see EQ_PRODUCT_CATEGORY_IDS) plus a short
   * free-text specific description — the category keeps the data
   * structural/translatable, the free text lets a child describe their
   * own specific product within it. */
  productCategory: string;
  productDescription: string;
  /** A curated category key (see EQ_CUSTOMER_CATEGORY_IDS) — customers
   * are always described as a generic group, never as any real,
   * identifying information. */
  customerCategory: string;
  logo: BusinessLogo;
  /** The price the child charges per unit. Defaults to a safe non-zero
   * value (see EQ_DEFAULT_PRICE_MINOR_UNITS) so the simulator's
   * arithmetic never divides by, or multiplies by, an unset value
   * before a child has consciously chosen their own. */
  priceMinorUnits: number;
  /** The cost to make ONE unit — set in the "Understand Costs" stage,
   * read again by the simulator to work out how many units a given
   * materials budget can actually make. */
  costPerUnitMinorUnits: number;
  expectedSales: number;
  /** A curated marketing approach key (see EQ_MARKETING_APPROACH_IDS) —
   * a simulated choice only; nothing here publishes anything anywhere. */
  marketingApproach: string;
  goal: string;
  /** The last two lines of the final pitch template ("People might
   * choose my business because..." / "My next step would be...") —
   * collected on the final "Create Your Final Business Pitch" stage,
   * right before the assembled /pitch page is shown for the first time. */
  whyChooseUs: string;
  nextStep: string;
  /** Set directly (not via the decision-effects table) from the "Test
   * the Idea" stage's choice — purely flavor for later screens (e.g.
   * the final pitch), never load-bearing for any calculation. `null`
   * until that stage is completed. (v2) */
  testedIdeaFirst: boolean | null;
}

export function createDefaultBusinessProfile(): BusinessProfile {
  return {
    businessName: "",
    slogan: "",
    ideaDescription: "",
    problem: "",
    productCategory: "",
    productDescription: "",
    customerCategory: "",
    logo: { shape: "circle", colorKey: "teal", symbol: "🚀" },
    priceMinorUnits: EQ_DEFAULT_PRICE_MINOR_UNITS,
    costPerUnitMinorUnits: EQ_DEFAULT_COST_PER_UNIT_MINOR_UNITS,
    expectedSales: 10,
    marketingApproach: "",
    goal: "",
    whyChooseUs: "",
    nextStep: "",
    testedIdeaFirst: null,
  };
}

/**
 * The company's running scoreboard — accumulates across the WHOLE
 * journey (every simulator attempt, every decision-event effect),
 * rather than only reflecting the most recent action. This is what
 * lets the Company Dashboard show real totals ("Sales: 12", "Revenue:
 * £48") instead of just replaying the last thing that happened.
 * Profit is deliberately not stored — it's always `revenue - costs`,
 * computed at display time (see computeProfitMinorUnits below), so it
 * can never drift out of sync with the two numbers it's made of.
 */
export type EQStockLevel = "low" | "medium" | "high";
export type EQDemandLevel = "low" | "medium" | "high" | "seasonal-high" | "seasonal-low";

export interface CompanyStats {
  salesCount: number;
  revenueMinorUnits: number;
  costsMinorUnits: number;
  /** 0-5, one decimal place of real precision — simulated customer
   * sentiment, moved only by specific decision-event effects (see
   * applyDecisionChoice below), never a real, postable review. */
  reputationOutOf5: number;
  /** Money actually available right now — distinct from profit
   * (revenue - costs). Starts equal to the simulator's starting money
   * and otherwise moves 1:1 with normal revenue/costs, exactly like
   * profit would; it only genuinely DIVERGES from profit inside the
   * Cash Flow scenario (run/cash-flow), which is what actually teaches
   * "profit is not the same as cash you can spend today" — nothing
   * about the existing simulator or decision-effect math changes. (v2) */
  cashMinorUnits: number;
  /** A running count of distinct customers served — separate from
   * `salesCount` (units sold), since one customer can buy more than
   * once. (v2) */
  customersTotal: number;
  repeatCustomers: number;
  stockLevel: EQStockLevel;
  demandLevel: EQDemandLevel;
}

export function createDefaultCompanyStats(): CompanyStats {
  return {
    salesCount: 0,
    revenueMinorUnits: 0,
    costsMinorUnits: 0,
    reputationOutOf5: EQ_STARTING_REPUTATION,
    cashMinorUnits: EQ_STARTING_MONEY_MINOR_UNITS,
    customersTotal: 0,
    repeatCustomers: 0,
    stockLevel: "medium",
    demandLevel: "medium",
  };
}

export function computeProfitMinorUnits(stats: CompanyStats): number {
  return stats.revenueMinorUnits - stats.costsMinorUnits;
}

export interface SimulatorRun {
  startingMoneyMinorUnits: number;
  materialsMinorUnits: number;
  packagingMinorUnits: number;
  advertisingMinorUnits: number;
  savedAsideMinorUnits: number;
  unitsMade: number;
  unitsSold: number;
  salesMinorUnits: number;
  costsMinorUnits: number;
  profitMinorUnits: number;
  remainingMoneyMinorUnits: number;
}

/** A local, isolated copy of the fixed "Business Rescue" company's own
 * numbers — deliberately NOT the child's own CompanyStats shape, since
 * Rescue hands the child an already-existing whole company (see
 * EQ_RESCUE_SCENARIO) to reason about, not a per-unit business of
 * their own. Nothing here ever touches `stats` above. (v2) */
export interface RescueStats {
  revenueMinorUnits: number;
  costsMinorUnits: number;
  customersTotal: number;
  reputationOutOf5: number;
  stockLevel: EQStockLevel;
  demandLevel: EQDemandLevel;
}

export interface RescueState {
  started: boolean;
  stats: RescueStats;
  completedProblemIds: string[];
  /** Derived deterministically once every rescue problem is answered
   * (see computeRescueOutcome) — never random. `null` until then. */
  outcome: string | null;
}

/** The reflective, optional "Business Review" prompts (brief section
 * 23) — free text, never scored, revisitable any time from Rescue &
 * Grow. Deliberately the ONE place structured reflection text is
 * collected, rather than adding a reflection field to every individual
 * activity. (v2) */
export interface BusinessReview {
  whatWorked: string;
  whatDidntWork: string;
  whatWouldChange: string;
}

export interface EntrepreneurQuestState {
  business: BusinessProfile;
  stats: CompanyStats;
  completedStageIds: string[];
  /** eventId -> which choice key the child picked — used both to show
   * a choice as already-made if a stage is revisited, and as the
   * record applyDecisionChoice's effect was already applied against
   * (so replaying a stage never double-applies the same effect). This
   * ONE map already covers every decision event, business problem
   * response, pivot choice, and grow choice (v2) — no separate
   * "which pivot did they pick" field is needed since `decisionChoices["business-pivot"]`
   * already answers that, exactly like every other decision. */
  decisionChoices: Record<string, string>;
  completedChallengeIds: string[];
  latestSimulatorRun: SimulatorRun | null;
  /** Which optional real-world missions the child has ticked off —
   * booleans only, never any text/photo/personal content. */
  realWorldMissionsDone: string[];
  pitchCompleted: boolean;
  /** Phase 2 (Run Your Business) — which of EQ_RUN_ACTIVITY_IDS have
   * been tried at least once. (v2) */
  completedRunActivityIds: string[];
  /** Which of EQ_BUSINESS_PROBLEM_IDS have been worked through (the
   * response itself is recorded in decisionChoices, keyed by the same
   * problem id). (v2) */
  completedProblemIds: string[];
  /** Which of EQ_AI_LAB_QA_IDS + the other 3 AI Lab facets have been
   * viewed/completed. (v2) */
  aiLabCompletedIds: string[];
  rescue: RescueState;
  businessReview: BusinessReview;
}

export function createDefaultState(): EntrepreneurQuestState {
  return {
    business: createDefaultBusinessProfile(),
    stats: createDefaultCompanyStats(),
    completedStageIds: [],
    decisionChoices: {},
    completedChallengeIds: [],
    latestSimulatorRun: null,
    realWorldMissionsDone: [],
    pitchCompleted: false,
    completedRunActivityIds: [],
    completedProblemIds: [],
    aiLabCompletedIds: [],
    rescue: { started: false, stats: { ...EQ_RESCUE_SCENARIO.startingStats }, completedProblemIds: [], outcome: null },
    businessReview: { whatWorked: "", whatDidntWork: "", whatWouldChange: "" },
  };
}

export function updateBusinessField<K extends keyof BusinessProfile>(
  state: EntrepreneurQuestState,
  field: K,
  value: BusinessProfile[K]
): EntrepreneurQuestState {
  return { ...state, business: { ...state.business, [field]: value } };
}

export function updateLogo<K extends keyof BusinessLogo>(state: EntrepreneurQuestState, field: K, value: BusinessLogo[K]): EntrepreneurQuestState {
  return { ...state, business: { ...state.business, logo: { ...state.business.logo, [field]: value } } };
}

export function completeStage(state: EntrepreneurQuestState, stageId: string): EntrepreneurQuestState {
  if (state.completedStageIds.includes(stageId)) return state;
  return { ...state, completedStageIds: [...state.completedStageIds, stageId] };
}

/**
 * Records which choice was picked AND applies that choice's real
 * effect (see EQ_DECISION_EFFECTS) to the company's own running
 * stats — reputation moves (clamped to [0, 5]) and/or a small number
 * of simulated units are added to or subtracted from the cumulative
 * sales count and revenue, at the company's current price. Guarded
 * against double-application: revisiting an already-decided event
 * (e.g. navigating back) records the same choice again but does not
 * re-apply its effect a second time.
 */
/** Applies one EQDecisionEffect to a CompanyStats, clamping reputation
 * and flooring every cumulative figure at 0 — shared by recordDecision
 * below and every v2 activity that moves the child's own persistent
 * stats (pivot, grow, business problems, cash flow, suppliers/stock),
 * so all of them stay consistent with each other and with the
 * original v1 behavior. */
function applyEffectToStats(stats: CompanyStats, effect: EQDecisionEffect, priceMinorUnits: number): CompanyStats {
  const nextReputation = Math.min(EQ_MAX_REPUTATION, Math.max(EQ_MIN_REPUTATION, stats.reputationOutOf5 + (effect.reputationDelta ?? 0)));
  const salesDelta = effect.salesDelta ?? 0;
  const revenueDelta = salesDelta * priceMinorUnits;
  return {
    ...stats,
    reputationOutOf5: Math.round(nextReputation * 10) / 10,
    salesCount: Math.max(0, stats.salesCount + salesDelta),
    revenueMinorUnits: Math.max(0, stats.revenueMinorUnits + revenueDelta),
    costsMinorUnits: Math.max(0, stats.costsMinorUnits + (effect.costsDeltaMinorUnits ?? 0)),
    cashMinorUnits: Math.max(0, stats.cashMinorUnits + (effect.cashDeltaMinorUnits ?? 0) + revenueDelta - (effect.costsDeltaMinorUnits ?? 0)),
  };
}

/**
 * Records which choice was picked AND applies that choice's real
 * effect (see EQ_DECISION_EFFECTS) to the company's own running
 * stats — reputation moves (clamped to [0, 5]), simulated units
 * sold/lost, one-off cost changes, and cash changes, so a child can
 * see a decision actually move their company's numbers, not just read
 * a sentence about it. Guarded against double-application: revisiting
 * an already-decided event (e.g. navigating back) records the same
 * choice again but does not re-apply its effect a second time. Used
 * for every decision in the app: the original 7 v1 decision events,
 * the 2 new Build-phase reflections, every Run-phase activity
 * (suppliers, stock, cash flow, business problems), and every
 * Rescue & Grow decision (pivot, grow, ethics) — one function, one
 * effects table, no special cases. (v2: extended to also apply cost/
 * cash deltas via applyEffectToStats.)
 */
export function recordDecision(state: EntrepreneurQuestState, eventId: string, choiceKey: string): EntrepreneurQuestState {
  const alreadyDecided = state.decisionChoices[eventId] !== undefined;
  const withChoice = { ...state, decisionChoices: { ...state.decisionChoices, [eventId]: choiceKey } };
  if (alreadyDecided) return withChoice;

  const effect = EQ_DECISION_EFFECTS[eventId]?.[choiceKey];
  if (!effect) return withChoice;

  return { ...withChoice, stats: applyEffectToStats(withChoice.stats, effect, withChoice.business.priceMinorUnits) };
}

/** "Business Pivot" (brief section 14) — records the choice like any
 * other decision, and additionally changes the persistent business
 * itself for the two choices that represent a real strategic change:
 * shifting to a customer/product category the child hasn't already
 * chosen (deterministic — the first id in the curated list that isn't
 * their current one — never random). (v2) */
export function applyPivotChoice(state: EntrepreneurQuestState, choiceKey: string): EntrepreneurQuestState {
  const decided = recordDecision(state, "business-pivot", choiceKey);
  if (choiceKey === "change-customer") {
    const nextCategory = EQ_CUSTOMER_CATEGORY_IDS.find((id) => id !== decided.business.customerCategory) ?? decided.business.customerCategory;
    return updateBusinessField(decided, "customerCategory", nextCategory);
  }
  if (choiceKey === "change-product") {
    const nextCategory = EQ_PRODUCT_CATEGORY_IDS.find((id) => id !== decided.business.productCategory) ?? decided.business.productCategory;
    return updateBusinessField(decided, "productCategory", nextCategory);
  }
  return decided;
}

/** "Grow or Stay Small" (brief section 21) — a normal decision event;
 * kept as its own named function only so page components don't need
 * to know the literal event id string. (v2) */
export function applyGrowDecision(state: EntrepreneurQuestState, choiceKey: string): EntrepreneurQuestState {
  return recordDecision(state, "grow-or-stay-small", choiceKey);
}

export function completeRunActivity(state: EntrepreneurQuestState, activityId: string): EntrepreneurQuestState {
  if (state.completedRunActivityIds.includes(activityId)) return state;
  return { ...state, completedRunActivityIds: [...state.completedRunActivityIds, activityId] };
}

/** Marks a Business Problem as worked through — call once the
 * response step (recordDecision(problemId, responseKey)) has
 * completed. Kept separate from decisionChoices because a problem is
 * "done" the moment its response is chosen, but decisionChoices alone
 * doesn't distinguish a Business Problem id from any other decision
 * event id when a page just wants "which problems has the child
 * tried." (v2) */
export function completeProblem(state: EntrepreneurQuestState, problemId: string): EntrepreneurQuestState {
  if (state.completedProblemIds.includes(problemId)) return state;
  return { ...state, completedProblemIds: [...state.completedProblemIds, problemId] };
}

export function setStockLevel(state: EntrepreneurQuestState, level: EQStockLevel): EntrepreneurQuestState {
  return { ...state, stats: { ...state.stats, stockLevel: level } };
}

export function completeAiLabActivity(state: EntrepreneurQuestState, activityId: string): EntrepreneurQuestState {
  if (state.aiLabCompletedIds.includes(activityId)) return state;
  return { ...state, aiLabCompletedIds: [...state.aiLabCompletedIds, activityId] };
}

export function updateBusinessReview<K extends keyof BusinessReview>(state: EntrepreneurQuestState, field: K, value: BusinessReview[K]): EntrepreneurQuestState {
  return { ...state, businessReview: { ...state.businessReview, [field]: value } };
}

/**
 * "Business Rescue" (brief section 20) — starts (idempotently) the
 * child's limited-time period working on a company that already
 * exists, using its OWN local `rescue.stats` snapshot rather than the
 * child's real business. (v2)
 */
export function startRescue(state: EntrepreneurQuestState): EntrepreneurQuestState {
  if (state.rescue.started) return state;
  return { ...state, rescue: { ...state.rescue, started: true, stats: { ...EQ_RESCUE_SCENARIO.startingStats } } };
}

/** Applies one of the 3 Rescue problem responses to the LOCAL rescue
 * stats (see EQ_RESCUE_RESPONSE_EFFECTS — a simpler whole-company
 * model than the per-unit EQDecisionEffect table, since Rescue hands
 * the child an already-existing company rather than one built unit by
 * unit). Guarded the same way as recordDecision: revisiting an
 * already-answered rescue problem doesn't double-apply it. (v2) */
export function recordRescueDecision(state: EntrepreneurQuestState, problemId: string, responseKey: string): EntrepreneurQuestState {
  const alreadyDone = state.rescue.completedProblemIds.includes(problemId);
  if (alreadyDone) return state;

  const effect = EQ_RESCUE_RESPONSE_EFFECTS[problemId]?.[responseKey];
  const nextStats: RescueStats = effect
    ? {
        ...state.rescue.stats,
        revenueMinorUnits: Math.max(0, state.rescue.stats.revenueMinorUnits + (effect.revenueDeltaMinorUnits ?? 0)),
        costsMinorUnits: Math.max(0, state.rescue.stats.costsMinorUnits + (effect.costsDeltaMinorUnits ?? 0)),
        reputationOutOf5: Math.round(Math.min(EQ_MAX_REPUTATION, Math.max(EQ_MIN_REPUTATION, state.rescue.stats.reputationOutOf5 + (effect.reputationDelta ?? 0))) * 10) / 10,
      }
    : state.rescue.stats;

  return {
    ...state,
    decisionChoices: { ...state.decisionChoices, [problemId]: responseKey },
    rescue: { ...state.rescue, stats: nextStats, completedProblemIds: [...state.rescue.completedProblemIds, problemId] },
  };
}

/**
 * Derives the Rescue outcome deterministically from the final local
 * stats — never randomly, and never framed as failure/punishment (see
 * the brief's own "do not make failure feel like punishment"): every
 * outcome is a legitimate, explainable result of the choices made.
 */
export function computeRescueOutcome(stats: RescueStats): "improved" | "stabilised" | "needs-pivot" | "still-struggling" {
  const profit = stats.revenueMinorUnits - stats.costsMinorUnits;
  if (stats.reputationOutOf5 < 2.5) return "needs-pivot";
  if (profit > 0 && stats.reputationOutOf5 >= 3.5) return "improved";
  if (profit >= -20000) return "stabilised";
  return "still-struggling";
}

/** Finalizes Rescue once every scenario problem has been answered —
 * safe to call repeatedly (does nothing once an outcome already
 * exists, and does nothing until all problems are answered). (v2) */
export function finishRescue(state: EntrepreneurQuestState): EntrepreneurQuestState {
  if (state.rescue.outcome !== null) return state;
  const allDone = EQ_RESCUE_SCENARIO.problemIds.every((id) => state.rescue.completedProblemIds.includes(id));
  if (!allDone) return state;
  return { ...state, rescue: { ...state.rescue, outcome: computeRescueOutcome(state.rescue.stats) } };
}

/** "Pricing Experiment" (brief section 11) — pure arithmetic over one
 * authored row (see EQ_PRICING_EXPERIMENT_ROWS), never stored, so the
 * lesson's numbers can never drift. (v2) */
export function computePricingExperimentRow(
  row: { priceMinorUnits: number; unitsSold: number },
  costPerUnitMinorUnits: number = EQ_PRICING_EXPERIMENT_COST_PER_UNIT_MINOR_UNITS
): { revenueMinorUnits: number; costsMinorUnits: number; profitMinorUnits: number } {
  const revenueMinorUnits = row.priceMinorUnits * row.unitsSold;
  const costsMinorUnits = costPerUnitMinorUnits * row.unitsSold;
  return { revenueMinorUnits, costsMinorUnits, profitMinorUnits: revenueMinorUnits - costsMinorUnits };
}

export function completeChallenge(state: EntrepreneurQuestState, challengeId: string): EntrepreneurQuestState {
  if (state.completedChallengeIds.includes(challengeId)) return state;
  return { ...state, completedChallengeIds: [...state.completedChallengeIds, challengeId] };
}

export function toggleRealWorldMission(state: EntrepreneurQuestState, missionId: string): EntrepreneurQuestState {
  const isDone = state.realWorldMissionsDone.includes(missionId);
  return {
    ...state,
    realWorldMissionsDone: isDone
      ? state.realWorldMissionsDone.filter((id) => id !== missionId)
      : [...state.realWorldMissionsDone, missionId],
  };
}

export function completePitch(state: EntrepreneurQuestState): EntrepreneurQuestState {
  return { ...state, pitchCompleted: true };
}

export interface SimulatorInput {
  materialsMinorUnits: number;
  packagingMinorUnits: number;
  advertisingMinorUnits: number;
  savedAsideMinorUnits: number;
}

/**
 * The whole simulator, worked out in explicit, traceable steps so
 * every number a child sees can be explained rather than feeling like
 * a black box — deliberately not a single opaque formula.
 *
 * 1. unitsMade: how many the child's materials budget can produce,
 *    using the per-unit cost they set in "Understand Costs".
 * 2. reachedCustomers: of a fixed, currency-independent 20 "people
 *    nearby who might buy", how many hear about the business — a
 *    plain fraction of the starting money spent on advertising, so
 *    the number of potential customers never depends on which
 *    currency the child's family uses.
 * 3. buyFraction: of the people who heard about it, how many actually
 *    buy depends on how the price compares to what it cost to make -
 *    a price at or below double the making-cost feels fair (nearly
 *    everyone who heard about it buys); up to triple still sells
 *    reasonably; beyond that, most people who heard about it decide
 *    not to buy. This is the same "price vs. value" idea taught
 *    elsewhere in Money Quest's Price Detective and Smart Shopper
 *    games, applied from the seller's side instead of the buyer's.
 * 4. unitsSold: can never exceed what was actually made.
 * 5. Sales, Costs, Profit, Remaining money: exactly the formulas in
 *    the brief (Profit = Sales - Costs), with Costs meaning the money
 *    actually spent running the business this round (materials +
 *    packaging + advertising) - not the child's original starting
 *    amount, since the leftover savedAside was never at risk.
 */
export function runSimulator(business: BusinessProfile, input: SimulatorInput): SimulatorRun {
  const costPerUnit = business.costPerUnitMinorUnits > 0 ? business.costPerUnitMinorUnits : EQ_DEFAULT_COST_PER_UNIT_MINOR_UNITS;
  const price = business.priceMinorUnits > 0 ? business.priceMinorUnits : EQ_DEFAULT_PRICE_MINOR_UNITS;

  const unitsMade = Math.floor(input.materialsMinorUnits / costPerUnit);

  const reachedCustomers = Math.round(
    (input.advertisingMinorUnits / EQ_STARTING_MONEY_MINOR_UNITS) * EQ_TOTAL_POTENTIAL_CUSTOMERS
  );

  const priceToCostRatio = price / costPerUnit;
  const buyFraction = priceToCostRatio <= 2 ? 1 : priceToCostRatio <= 3 ? 0.7 : 0.4;

  const potentialBuyers = Math.round(reachedCustomers * buyFraction);
  const unitsSold = Math.min(unitsMade, potentialBuyers);

  const salesMinorUnits = unitsSold * price;
  const costsMinorUnits = input.materialsMinorUnits + input.packagingMinorUnits + input.advertisingMinorUnits;
  const profitMinorUnits = salesMinorUnits - costsMinorUnits;
  // Floored at 0 rather than allowed to go negative: a real loss is a
  // genuine, honest possible outcome here (that's what the "explanationLoss"
  // copy is for), but this app has no borrowing/debt concept anywhere
  // else, so showing a negative currency amount to a child would look
  // like a broken number rather than a lesson. Losing everything you
  // put in is a strong enough, still-true consequence on its own.
  const remainingMoneyMinorUnits = Math.max(0, input.savedAsideMinorUnits + profitMinorUnits);

  return {
    startingMoneyMinorUnits: EQ_STARTING_MONEY_MINOR_UNITS,
    materialsMinorUnits: input.materialsMinorUnits,
    packagingMinorUnits: input.packagingMinorUnits,
    advertisingMinorUnits: input.advertisingMinorUnits,
    savedAsideMinorUnits: input.savedAsideMinorUnits,
    unitsMade,
    unitsSold,
    salesMinorUnits,
    costsMinorUnits,
    profitMinorUnits,
    remainingMoneyMinorUnits,
  };
}

/**
 * Folds one simulator attempt into the company's PERMANENT running
 * totals (stats.salesCount/revenue/costs), in addition to keeping the
 * attempt itself for the "here's what happened" explanation screen.
 * This is what makes the simulator part of the same one company
 * rather than a disconnected side-game: running it again later (after
 * changing price, or after a decision event nudged reputation) keeps
 * building on the same running Sales/Revenue/Costs the dashboard and
 * final pitch show, not a fresh, disconnected scorecard each time.
 */
export function applySimulatorRun(state: EntrepreneurQuestState, run: SimulatorRun): EntrepreneurQuestState {
  return {
    ...state,
    latestSimulatorRun: run,
    stats: {
      ...state.stats,
      salesCount: state.stats.salesCount + run.unitsSold,
      revenueMinorUnits: state.stats.revenueMinorUnits + run.salesMinorUnits,
      costsMinorUnits: state.stats.costsMinorUnits + run.costsMinorUnits,
      // A simulator run's own net result (sales minus costs) moves cash
      // by exactly the same amount profit moves by — cash only
      // genuinely diverges from profit inside the dedicated Cash Flow
      // scenario (v2). Each unit sold is counted as one customer served
      // (a simple, honest upper bound — this app has no per-customer
      // purchase history to be more precise than that).
      cashMinorUnits: Math.max(0, state.stats.cashMinorUnits + run.salesMinorUnits - run.costsMinorUnits),
      customersTotal: state.stats.customersTotal + run.unitsSold,
    },
  };
}
