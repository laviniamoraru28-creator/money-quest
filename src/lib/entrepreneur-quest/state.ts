import {
  EQ_STARTING_MONEY_MINOR_UNITS,
  EQ_TOTAL_POTENTIAL_CUSTOMERS,
  EQ_DEFAULT_COST_PER_UNIT_MINOR_UNITS,
  EQ_DEFAULT_PRICE_MINOR_UNITS,
  EQ_STARTING_REPUTATION,
  EQ_MIN_REPUTATION,
  EQ_MAX_REPUTATION,
  EQ_DECISION_EFFECTS,
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
export interface CompanyStats {
  salesCount: number;
  revenueMinorUnits: number;
  costsMinorUnits: number;
  /** 0-5, one decimal place of real precision — simulated customer
   * sentiment, moved only by specific decision-event effects (see
   * applyDecisionChoice below), never a real, postable review. */
  reputationOutOf5: number;
}

export function createDefaultCompanyStats(): CompanyStats {
  return { salesCount: 0, revenueMinorUnits: 0, costsMinorUnits: 0, reputationOutOf5: EQ_STARTING_REPUTATION };
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

export interface EntrepreneurQuestState {
  business: BusinessProfile;
  stats: CompanyStats;
  completedStageIds: string[];
  /** eventId -> which choice key the child picked — used both to show
   * a choice as already-made if a stage is revisited, and as the
   * record applyDecisionChoice's effect was already applied against
   * (so replaying a stage never double-applies the same effect). */
  decisionChoices: Record<string, string>;
  completedChallengeIds: string[];
  latestSimulatorRun: SimulatorRun | null;
  /** Which optional real-world missions the child has ticked off —
   * booleans only, never any text/photo/personal content. */
  realWorldMissionsDone: string[];
  pitchCompleted: boolean;
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
export function recordDecision(state: EntrepreneurQuestState, eventId: string, choiceKey: string): EntrepreneurQuestState {
  const alreadyDecided = state.decisionChoices[eventId] !== undefined;
  const withChoice = { ...state, decisionChoices: { ...state.decisionChoices, [eventId]: choiceKey } };
  if (alreadyDecided) return withChoice;

  const effect = EQ_DECISION_EFFECTS[eventId]?.[choiceKey];
  if (!effect) return withChoice;

  const nextReputation = Math.min(
    EQ_MAX_REPUTATION,
    Math.max(EQ_MIN_REPUTATION, withChoice.stats.reputationOutOf5 + (effect.reputationDelta ?? 0))
  );
  const salesDelta = effect.salesDelta ?? 0;
  const revenueDelta = salesDelta * withChoice.business.priceMinorUnits;

  return {
    ...withChoice,
    stats: {
      ...withChoice.stats,
      reputationOutOf5: Math.round(nextReputation * 10) / 10,
      salesCount: Math.max(0, withChoice.stats.salesCount + salesDelta),
      revenueMinorUnits: Math.max(0, withChoice.stats.revenueMinorUnits + revenueDelta),
    },
  };
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
    },
  };
}
