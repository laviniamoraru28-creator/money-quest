/**
 * Structural (locale-independent) data for Entrepreneur Quest — the
 * same structural/translatable split every other content type in this
 * app already uses (curriculum, games, the Simulator, articles): ids,
 * ordering, and numbers live here; every word of prose lives under
 * `entrepreneurQuest.*` in messages/*.json. See get the localized copy
 * via `useTranslations()` in each page component, keyed off these ids.
 *
 * Entrepreneur Quest is deliberately ONE unified 8-14 track, not three
 * age-banded tracks like the core curriculum — its brief describes a
 * single progression, and splitting it into explorer/builder/strategist
 * variants would triple the authoring and translation work for a first
 * version with no request for that split.
 */

export type EQStageKind =
  | "reflect-text"
  | "logo"
  | "product-category"
  | "customer-category"
  | "marketing-category"
  | "numeric"
  | "mission"
  | "simulator-handoff"
  | "pitch-handoff"
  | "market-detective"
  | "test-idea";

export interface EQStageStructure {
  id: string;
  order: number;
  kind: EQStageKind;
  /** How many mission events this stage presents, in sequence, before
   * it counts as complete — only meaningful when kind is "mission".
   * Most mission stages show one; two stages show two, to reach 7
   * total decision events across the 16-stage journey (within the
   * brief's suggested 6-8) without needing a stage for every single one. */
  missionEventIds?: string[];
}

/**
 * Ordered so that the company's identity (name, logo, product,
 * customer) is established BEFORE any numbers are discussed — this is
 * the deliberate "build a company, not a course" sequencing: a child
 * has already created something of their own by stage 6, well before
 * the first numeric or decision-based stage. Renamed/reordered from
 * an earlier draft to keep "choose a business name" and "create a
 * logo" together early, and to give marketing its own dedicated
 * stage rather than folding it silently into a decision event.
 */
export const EQ_STAGES: EQStageStructure[] = [
  { id: "find-a-problem", order: 1, kind: "reflect-text" },
  { id: "create-an-idea", order: 2, kind: "reflect-text" },
  // Two new stages inserted here (v2): before committing to a name, logo, or
  // product, the brief's new starting philosophy — "don't build first,
  // investigate first" — asks the child to look at real-looking market data
  // and consider testing cheaply before investing heavily. Everything from
  // here onward keeps its EXACT same id and content as before; only the
  // `order` number shifts by +2, so no existing translation key, badge
  // trigger, or saved-progress reference needs to change.
  { id: "research-demand", order: 3, kind: "market-detective", missionEventIds: ["market-detective-reflection"] },
  { id: "test-the-idea", order: 4, kind: "test-idea", missionEventIds: ["test-before-invest"] },
  { id: "name-your-business", order: 5, kind: "reflect-text" },
  { id: "create-your-logo", order: 6, kind: "logo" },
  { id: "choose-your-product", order: 7, kind: "product-category" },
  { id: "choose-your-customer", order: 8, kind: "customer-category" },
  { id: "understand-costs", order: 9, kind: "numeric" },
  { id: "set-your-price", order: 10, kind: "numeric" },
  { id: "create-your-marketing", order: 11, kind: "marketing-category", missionEventIds: ["product-unclear"] },
  { id: "make-your-first-sale", order: 12, kind: "simulator-handoff" },
  { id: "calculate-your-profit", order: 13, kind: "numeric" },
  { id: "handle-competition", order: 14, kind: "mission", missionEventIds: ["competitor-lower-price"] },
  { id: "handle-a-customer-problem", order: 15, kind: "mission", missionEventIds: ["materials-cost-increase", "too-expensive-feedback"] },
  { id: "make-a-business-decision", order: 16, kind: "mission", missionEventIds: ["more-orders-than-expected", "teammate-wants-change"] },
  { id: "grow-your-business", order: 17, kind: "mission", missionEventIds: ["fewer-sales-than-expected"] },
  { id: "create-your-final-pitch", order: 18, kind: "pitch-handoff" },
];

export function getEQStageById(id: string): EQStageStructure | undefined {
  return EQ_STAGES.find((s) => s.id === id);
}

export function getEQStageByOrder(order: number): EQStageStructure | undefined {
  return EQ_STAGES.find((s) => s.order === order);
}

/** Every decision-event id referenced by any stage's missionEventIds,
 * plus the id itself, is what selects that event's prose from
 * `entrepreneurQuest.decisionEvents.<id>` in messages/*.json. Listed
 * here too (not just inline in EQ_STAGES) so validation scripts can
 * enumerate "every decision event" without walking every stage. */
export const EQ_DECISION_EVENT_IDS: string[] = [
  "market-detective-reflection",
  "test-before-invest",
  "product-unclear",
  "competitor-lower-price",
  "materials-cost-increase",
  "too-expensive-feedback",
  "more-orders-than-expected",
  "teammate-wants-change",
  "fewer-sales-than-expected",
  // v2 — Run Your Business
  "pricing-experiment-reflection",
  "choose-a-supplier",
  "stock-management-scenario",
  "cash-flow-decision",
  // v2 — Business Problems (each problem id doubles as its own decision event id)
  "not-enough-customers",
  "costs-increased",
  "negative-review",
  "sales-falling",
  "rising-costs-eating-profit",
  "profit-but-no-cash",
  "too-much-stock",
  // v2 — AI Business Lab
  "ai-wrong-answer",
  // v2 — Rescue & Grow
  "business-pivot",
  "grow-or-stay-small",
  "misleading-ad",
  "hiding-a-problem",
  "cheap-questionable-supplier",
];

/**
 * Five of the brief's nine named challenges, curated for the widest
 * spread of distinct skills (money, pricing, customer insight,
 * marketing, resilience) rather than overlapping ones — the remaining
 * four (Competition, Growth, Team, Mistake Challenges) are close
 * cousins of decision events already covered above and are left for a
 * future phase rather than diluting this set.
 */
export const EQ_CHALLENGE_IDS: string[] = [
  "five-pound-challenge",
  "pricing-challenge",
  "customer-challenge",
  "marketing-challenge",
  "bad-review-challenge",
];

/** Four of the brief's real-world missions — optional, no personal
 * data collected, just a local "done" checkbox per id (see
 * lib/entrepreneur-quest/state.ts). */
export const EQ_REAL_WORLD_MISSION_IDS: string[] = [
  "find-a-problem-at-home",
  "notice-what-people-buy",
  "improve-a-product-you-use",
  "ask-someone-what-they-would-change",
];

/**
 * Curated product categories — stored as structural keys (never
 * translated strings) in BusinessProfile.productCategory, so the UI
 * can show a correctly-translated label in any of the 9 locales for
 * the exact same underlying business. Kept to a fixed, child-friendly
 * set rather than a free-for-all list.
 */
export const EQ_PRODUCT_CATEGORY_IDS = [
  "food", "art", "crafts", "games", "pets", "sports", "fashion", "technology", "education", "environment", "helping-people", "other",
];

/** Curated customer categories, same structural-key reasoning as
 * product categories above — deliberately generic groups, never a
 * request for any real, identifying information about a customer. */
export const EQ_CUSTOMER_CATEGORY_IDS = [
  "kids", "families", "teens", "adults", "school-community", "neighbors", "animal-lovers", "other",
];

/** Curated marketing approaches — a simulated choice only; none of
 * these actually publish anything anywhere (see the brief's explicit
 * "no real social media publishing feature" requirement). */
export const EQ_MARKETING_APPROACH_IDS = ["poster", "social-style-advert", "word-of-mouth", "school-community-idea", "special-offer"];

/** The lightweight logo builder's three independent choices — background
 * shape, background color (reusing the same brand color tokens as
 * elsewhere in this app), and one symbol/emoji. 4 shapes x 4 colors x 8
 * symbols = 128 combinations from a small, curated, child-friendly set
 * — deliberately not "hundreds" of bespoke assets, and rendered as a
 * plain inline SVG (no image files, no design-service dependency). */
export const EQ_LOGO_SHAPE_IDS = ["circle", "square", "hexagon", "star"];
export const EQ_LOGO_COLOR_IDS = ["teal", "coral", "gold", "soft-blue"];
export const EQ_LOGO_SYMBOL_OPTIONS = ["🚀", "🌟", "🎨", "🍪", "🛠️", "🌱", "🐝", "📚"];

/** Reputation is a simple 0-5 "stars" figure representing simulated
 * customer sentiment — it starts at a neutral-positive baseline (not
 * 0, which would read as "already failing" before a child has made
 * any real decision) and moves in small, explainable steps as an
 * effect of specific decision-event choices (see EQ_DECISION_EFFECTS
 * below). This is entirely internal to the simulation — nothing here
 * ever asks a child to seek or post a real review anywhere. */
export const EQ_STARTING_REPUTATION = 3.5;
export const EQ_MAX_REPUTATION = 5;
export const EQ_MIN_REPUTATION = 0;

export interface EQDecisionEffect {
  /** Applied directly to the running reputation figure, then clamped
   * to [EQ_MIN_REPUTATION, EQ_MAX_REPUTATION]. */
  reputationDelta?: number;
  /** A small number of simulated extra/fewer units sold as a direct
   * result of this choice — added to the cumulative sales count, and
   * (at the business's current price) to cumulative revenue, so a
   * child can see a decision actually move their company's numbers,
   * not just read a sentence about it. */
  salesDelta?: number;
  /** A one-off cost this choice incurs (or saves, if negative) — e.g.
   * buying equipment, paying a supplier. Added to cumulative costs.
   * (v2) */
  costsDeltaMinorUnits?: number;
  /** A one-off change to money actually available right now, separate
   * from costs/revenue — this is what makes "profit is not the same
   * as cash you can spend today" a real, felt mechanic rather than
   * just a sentence (see the Cash Flow scenario below). (v2) */
  cashDeltaMinorUnits?: number;
}

/**
 * Which numeric effect each decision-event choice has on the child's
 * own company — this is what makes "the consequence should affect
 * appropriate virtual values" concrete rather than just narrative
 * flavor text. Deliberately NOT applied to the 5 standalone Business
 * Challenges (EQ_CHALLENGE_IDS) — those remain lower-stakes practice
 * that doesn't touch the persistent company, exactly as their
 * "standalone" framing above already establishes.
 */
export const EQ_DECISION_EFFECTS: Record<string, Record<string, EQDecisionEffect>> = {
  // Purely reflective (v2) — the point is investigating and thinking, not
  // a right answer, so no choice here moves any stat. recordDecision()
  // already handles an event with no matching effect entry gracefully
  // (it just records the choice), so these two need no special-casing.
  "market-detective-reflection": {},
  "test-before-invest": {},
  "product-unclear": {
    "explain-simply": { reputationDelta: 0.3, salesDelta: 2 },
    "add-picture": { reputationDelta: 0.2, salesDelta: 1 },
    "do-nothing": { reputationDelta: -0.2, salesDelta: -1 },
  },
  "competitor-lower-price": {
    "lower-price": { salesDelta: 2 },
    "explain-value": { reputationDelta: 0.3, salesDelta: 1 },
    "ignore": { reputationDelta: -0.1, salesDelta: -2 },
  },
  "materials-cost-increase": {
    "raise-price": { reputationDelta: -0.1, salesDelta: -1 },
    "absorb-cost": { reputationDelta: 0.1 },
    "find-cheaper-materials": { reputationDelta: 0.2, salesDelta: 1 },
  },
  "too-expensive-feedback": {
    "ask-why": { reputationDelta: 0.2 },
    "offer-smaller-version": { reputationDelta: 0.1, salesDelta: 2 },
    "stand-firm": { reputationDelta: -0.1, salesDelta: -1 },
  },
  "more-orders-than-expected": {
    "make-more": { reputationDelta: 0.1, salesDelta: 3 },
    "raise-price-slightly": { salesDelta: 1 },
    "waitlist": { reputationDelta: 0.2, salesDelta: 2 },
  },
  "teammate-wants-change": {
    "hear-them-out": { reputationDelta: 0.2 },
    "say-no": { reputationDelta: -0.1 },
    "try-a-test-version": { reputationDelta: 0.3, salesDelta: 1 },
  },
  "fewer-sales-than-expected": {
    "ask-customers": { reputationDelta: 0.2, salesDelta: 1 },
    "try-something-new": { reputationDelta: 0.1, salesDelta: 2 },
    "keep-going": {},
  },
};

/** Every badge Entrepreneur Quest can award, each prefixed `eq-` so it
 * can never collide with a future Money Quest badge id sharing the
 * same underlying `earnedBadgeIds` array (see
 * lib/local-progress/state.ts's awardBadge). Kept to five, matching
 * the brief's "do not overuse badges." */
export const EQ_BADGE_IDS = {
  problemSolver: "eq-problem-solver", // awarded on completing "find-a-problem"
  ideaFinder: "eq-idea-finder", // awarded on completing "create-an-idea"
  moneyManager: "eq-money-manager", // awarded on completing "calculate-your-profit"
  marketingExplorer: "eq-marketing-explorer", // awarded on completing "create-your-marketing"
  youngFounder: "eq-young-founder", // awarded on completing the final pitch
} as const;

/**
 * The simulator's starting virtual money, in minor units — "50" major
 * units in whichever currency the child's Money Quest profile already
 * uses (see formatCurrency() call sites; this number is NEVER shown
 * directly, always run through the child's own currency formatting).
 * A round, easy-to-split number matching the brief's own worked
 * example (£50 -> £20/£5/£10/£15).
 */
export const EQ_STARTING_MONEY_MINOR_UNITS = 5000;

/**
 * A fixed, simple, currency-independent stand-in for "how many people
 * could realistically buy from a small first business" — deliberately
 * a plain number of people, not a currency-scaled figure, so the
 * simulator's logic never has to reason about minor-unit precision
 * differences between currencies (e.g. JPY has 0 decimal places,
 * GBP/EUR have 2) to decide how many customers exist. See
 * lib/entrepreneur-quest/state.ts's runSimulator() for exactly how
 * this is used and why each step is easy to explain to a child.
 */
export const EQ_TOTAL_POTENTIAL_CUSTOMERS = 20;

/** Sensible non-zero defaults so a business profile is always safe to
 * run through the simulator's arithmetic, even before a child has
 * consciously changed these — avoids ever dividing by zero or pricing
 * at zero, without forcing every field to be nullable everywhere. */
export const EQ_DEFAULT_COST_PER_UNIT_MINOR_UNITS = 200; // "2" major units
export const EQ_DEFAULT_PRICE_MINOR_UNITS = 500; // "5" major units

/** The two challenges whose brief-supplied examples use a smaller
 * budget than the main £50 simulator ("You have £5..." and "...£10
 * virtual money for marketing") — kept as their own named constants
 * rather than reusing EQ_STARTING_MONEY_MINOR_UNITS, since they're
 * deliberately smaller, standalone practice amounts. */
export const EQ_FIVE_CHALLENGE_AMOUNT_MINOR_UNITS = 500; // "5" major units
export const EQ_MARKETING_CHALLENGE_AMOUNT_MINOR_UNITS = 1000; // "10" major units

// =====================================================================
// v2: BUILD -> RUN -> RESCUE & GROW
//
// Everything below is additive: no id, order, or content above this
// line changes meaning. New decision-event ids used below (pivot, grow,
// business problems, cash flow, stock, ethics) are added to
// EQ_DECISION_EFFECTS above the line "product-unclear": {...} started —
// see the "market-detective-reflection"/"test-before-invest" entries
// there, and the additional entries further down this section.
// =====================================================================

/**
 * The ONE fixed fictional market used by the "Research Demand" stage's
 * Market Detective activity — deliberately not many scenarios (the
 * brief explicitly allows shipping less breadth for more depth here).
 * Matches the brief's own Fresh Trout example so the lesson ("high
 * demand does not automatically mean high profit; low competition does
 * not automatically mean a good opportunity") is concrete and
 * checkable, not abstract.
 */
export const EQ_MARKET_DETECTIVE_SCENARIO = {
  id: "fresh-trout",
  productCategoryId: "food",
  interestedCustomers: 300,
  recentBuyers: 75,
  competitorCount: 4,
  competitorPriceMinorUnits: 800,
  productionCostMinorUnits: 500,
  weekendDemand: "high" as const,
  winterDemand: "low" as const,
};

/** The Idea -> Interest -> Demand -> Purchases -> Repeat-customers
 * ladder from the brief, section 5 ("Demand Analysis") — a fixed,
 * illustrative funnel shown as plain width-bars (see BarRow.tsx),
 * teaching that liking an idea is not the same as paying for it. */
export const EQ_DEMAND_LADDER: { key: string; value: number }[] = [
  { key: "likeTheIdea", value: 100 },
  { key: "mightBuy", value: 40 },
  { key: "actuallyBuy", value: 15 },
  { key: "becomeRepeatCustomers", value: 5 },
];

/**
 * "Test Before You Invest" (brief section 6) — a single, sharp choice
 * between spending everything up front vs. spending a little to test
 * first. No numeric effect on the persistent business (nothing has
 * been built yet at this point in the journey); the lesson lives
 * entirely in the two choices' consequence text. `business.testedIdeaFirst`
 * is set directly from the chosen key by the build page, purely for
 * later flavor text (e.g. on the final pitch).
 */
export const EQ_TEST_IDEA_SPEND_ALL_KEY = "spend-it-all-now";
export const EQ_TEST_IDEA_TEST_FIRST_KEY = "test-a-little-first";

/**
 * "Pricing Experiment" (brief section 11) — pre-authored rows (not
 * live-random) so the lesson ("higher price does not automatically
 * mean higher profit; lower price does not automatically mean more
 * profit either") always lands the same, checkable way. Revenue/
 * cost/profit are computed at render time by computePricingExperimentRow
 * in state.ts, never stored, so they can never drift from these two
 * authored numbers.
 */
export const EQ_PRICING_EXPERIMENT_COST_PER_UNIT_MINOR_UNITS = 200; // "2" major units
export const EQ_PRICING_EXPERIMENT_ROWS: { priceMinorUnits: number; unitsSold: number }[] = [
  { priceMinorUnits: 300, unitsSold: 100 },
  { priceMinorUnits: 500, unitsSold: 70 },
  { priceMinorUnits: 800, unitsSold: 30 },
];

/**
 * "Suppliers and Stock" (brief section 10) — three suppliers with
 * genuine, comparable trade-offs (never a single obviously-correct
 * one); attributes are structural low/medium/high levels, translated
 * for display, matched to a decision event ("choose-a-supplier", see
 * EQ_DECISION_EFFECTS) so picking one has a real, small effect on the
 * company's costs/reputation.
 */
export const EQ_SUPPLIER_OPTION_IDS = ["supplier-a", "supplier-b", "supplier-c"];
export type EQSupplierLevel = "low" | "medium" | "high";
export const EQ_SUPPLIER_OPTIONS: Record<string, { priceLevel: EQSupplierLevel; deliverySpeed: EQSupplierLevel; minimumOrder: EQSupplierLevel; reliability: EQSupplierLevel; quality: EQSupplierLevel }> = {
  "supplier-a": { priceLevel: "low", deliverySpeed: "low", minimumOrder: "high", reliability: "medium", quality: "medium" },
  "supplier-b": { priceLevel: "high", deliverySpeed: "high", minimumOrder: "low", reliability: "medium", quality: "medium" },
  "supplier-c": { priceLevel: "medium", deliverySpeed: "medium", minimumOrder: "medium", reliability: "high", quality: "high" },
};

/** The stock mini-scenario from brief section 10 — also updates
 * `stats.stockLevel` directly (a qualitative enum, not something
 * modeled generically in EQDecisionEffect), handled by the run/
 * supplier-and-stock page calling setStockLevel() alongside recordDecision(). */
export const EQ_STOCK_SCENARIO_STOCK_LEVEL_BY_CHOICE: Record<string, "low" | "medium" | "high"> = {
  "order-a-lot": "high",
  "order-just-enough": "medium",
  "order-a-little-and-restock": "low",
};

/** "Cash Flow" (brief section 9) — the restaurant/30-days example,
 * teaching PROFIT != CASH. Kept deliberately simple: the upfront costs
 * must be paid now regardless of choice; only how much cash is
 * recovered immediately differs (see the "cash-flow-decision" entry in
 * EQ_DECISION_EFFECTS). */
export const EQ_CASH_FLOW_SCENARIO = {
  id: "restaurant-order",
  orderAmountMinorUnits: 200000, // "2000" major units
  paymentDelayDays: 30,
  upfrontCostsMinorUnits: 60000, // "600" major units — materials + wages + electricity + transport, due now
};

/**
 * The reusable "Business Problems" library (brief sections 7-9).
 * Each problem is PROBLEM -> a few investigate "clues" (progressive
 * disclosure, no wrong taps) -> pick a likely cause (reflective, not
 * scored) -> choose a response (a normal decision event, so it reuses
 * recordDecision()/EQ_DECISION_EFFECTS exactly like every other
 * decision in this app) -> consequence. `category` is drawn from the
 * brief's own 15-category taxonomy so more problems can be added later
 * as pure data, without new code — v1 ships 7, curated for the widest
 * spread of distinct causes rather than every possible scenario.
 */
export type EQBusinessProblemCategory =
  | "demand" | "pricing" | "customers" | "marketing" | "cash-flow" | "costs" | "stock"
  | "competition" | "supplier" | "ai" | "customer-complaint" | "growth" | "risk" | "ethics" | "business-rescue";

export interface EQBusinessProblem {
  id: string;
  category: EQBusinessProblemCategory;
  clueIds: string[];
  causeIds: string[];
  responseIds: string[];
}

export const EQ_BUSINESS_PROBLEM_IDS = [
  "not-enough-customers",
  "costs-increased",
  "negative-review",
  "sales-falling",
  "rising-costs-eating-profit",
  "profit-but-no-cash",
  "too-much-stock",
];

export const EQ_BUSINESS_PROBLEMS: Record<string, EQBusinessProblem> = {
  "not-enough-customers": {
    id: "not-enough-customers",
    category: "demand",
    clueIds: ["footTraffic", "onlineViews", "competitorActivity"],
    causeIds: ["wrong-customer-group", "weak-marketing", "price-too-high"],
    responseIds: ["improve-marketing", "research-customers", "lower-price-temporarily"],
  },
  "costs-increased": {
    id: "costs-increased",
    category: "costs",
    clueIds: ["supplierPriceNotice", "fuelPrices", "wageChanges"],
    causeIds: ["supplier-price-rise", "inflation", "more-materials-needed"],
    responseIds: ["absorb-the-cost", "raise-your-price", "find-a-cheaper-supplier"],
  },
  "negative-review": {
    id: "negative-review",
    category: "customer-complaint",
    clueIds: ["reviewText", "otherReviews", "returnRequests"],
    causeIds: ["product-fault", "unclear-instructions", "slow-response"],
    responseIds: ["apologise-and-fix", "offer-replacement", "ignore-and-move-on"],
  },
  "sales-falling": {
    id: "sales-falling",
    category: "pricing",
    clueIds: ["salesChart", "competitorPrices", "customerFeedback"],
    causeIds: ["price-too-high-now", "new-competitor", "product-losing-novelty"],
    responseIds: ["run-a-special-offer", "refresh-the-product", "ask-customers-directly"],
  },
  "rising-costs-eating-profit": {
    id: "rising-costs-eating-profit",
    category: "costs",
    clueIds: ["priceHistory", "productionCostHistory", "advertisingSpend"],
    causeIds: ["advertising-spend-too-high", "waste-in-production", "discounts-too-generous"],
    responseIds: ["review-advertising-spend", "reduce-waste", "adjust-discounts"],
  },
  "profit-but-no-cash": {
    id: "profit-but-no-cash",
    category: "cash-flow",
    clueIds: ["unpaidInvoices", "cashOnHand", "upcomingBills"],
    causeIds: ["customers-pay-late", "spent-too-much-on-equipment", "stock-tied-up-money"],
    responseIds: ["ask-for-faster-payment", "use-savings", "delay-a-purchase"],
  },
  "too-much-stock": {
    id: "too-much-stock",
    category: "stock",
    clueIds: ["stockRoomPhoto", "unsoldItemsList", "seasonalTrend"],
    causeIds: ["over-ordered", "demand-was-seasonal", "product-less-popular-than-expected"],
    responseIds: ["run-a-clearance-sale", "donate-or-repurpose", "order-less-next-time"],
  },
};

export const EQ_RUN_ACTIVITY_IDS = ["pricing-experiment", "supplier-and-stock", "cash-flow", "business-problems"];

/** "Business Pivot" (brief section 14) — up to 4 choices, matching
 * every other decision event in this app. Two of the four also change
 * the persistent business itself (see applyPivotChoice in state.ts),
 * making this a genuine strategic decision rather than flavor text. */
export const EQ_PIVOT_OPTION_IDS = ["keep-model", "change-customer", "change-product", "stop-idea"];

/** "Grow or Stay Small" (brief section 21) — growth increases both
 * potential upside AND cost/risk; staying small is a genuinely valid,
 * zero-effect choice, never framed as the "wrong" one. */
export const EQ_GROW_OPTION_IDS = ["stay-small", "hire-help", "buy-equipment", "expand-to-new-market"];

/** "Business Ethics" (brief section 22) — 3 short, values-based
 * scenarios. Reputation moves modestly with each choice so the
 * trade-off (short-term gain vs. trust) is felt, not just read. */
export const EQ_ETHICS_SCENARIO_IDS = ["misleading-ad", "hiding-a-problem", "cheap-questionable-supplier"];

/**
 * "Business Rescue" (brief section 20) — the child receives a company
 * that already exists (NOT their own), with its own local stats copy
 * (see EntrepreneurQuestState.rescue in state.ts) so nothing here ever
 * touches the child's own business. Reuses 3 of the 7 Business
 * Problems above (same content, same responses/effects) applied
 * against this fixed starting dataset instead. The outcome is derived
 * deterministically from the final local stats, never randomly (see
 * computeRescueOutcome in state.ts).
 */
export const EQ_RESCUE_SCENARIO = {
  id: "trout-farm",
  startingStats: {
    revenueMinorUnits: 400000, // "4000"
    costsMinorUnits: 450000, // "4500"
    customersTotal: 32,
    reputationOutOf5: 3,
    stockLevel: "high" as const,
    demandLevel: "seasonal-low" as const,
  },
  problemIds: ["sales-falling", "too-much-stock", "profit-but-no-cash"],
};

/**
 * Rescue reuses the SAME problem/clue/cause/response text as the three
 * Business Problems above (so nothing new needs writing or
 * translating), but applies its own, simpler whole-company effect
 * table rather than the per-unit-sale EQDecisionEffect model — a fixed
 * existing company (not a per-unit business the child is still
 * building) is better modeled as direct revenue/cost/reputation
 * nudges than as "extra units sold at the current price."
 */
export interface EQRescueResponseEffect {
  revenueDeltaMinorUnits?: number;
  costsDeltaMinorUnits?: number;
  reputationDelta?: number;
}
export const EQ_RESCUE_RESPONSE_EFFECTS: Record<string, Record<string, EQRescueResponseEffect>> = {
  "sales-falling": {
    "run-a-special-offer": { revenueDeltaMinorUnits: 30000, costsDeltaMinorUnits: 5000 },
    "refresh-the-product": { revenueDeltaMinorUnits: 20000, costsDeltaMinorUnits: 15000, reputationDelta: 0.2 },
    "ask-customers-directly": { reputationDelta: 0.1 },
  },
  "too-much-stock": {
    "run-a-clearance-sale": { revenueDeltaMinorUnits: 15000, reputationDelta: 0.05 },
    "donate-or-repurpose": { reputationDelta: 0.2 },
    "order-less-next-time": { reputationDelta: 0.05 },
  },
  "profit-but-no-cash": {
    "ask-for-faster-payment": { revenueDeltaMinorUnits: 10000 },
    "use-savings": { costsDeltaMinorUnits: -5000, reputationDelta: 0.1 },
    "delay-a-purchase": { costsDeltaMinorUnits: -10000, revenueDeltaMinorUnits: -10000 },
  },
};

/**
 * "AI Business Lab" (brief sections 15-18) — 100% pre-written/scripted
 * content, never a live model call. Four facets, one guided page
 * (ai-lab/page.tsx): what AI can help with (pure lookup), prompt
 * quality (a genuine correct-answer case, per the brief's own "unless
 * explicitly teaching a factual safety rule" exception), an AI-gave-a-
 * wrong-looking-answer scenario (reflective, no correct answer flagged
 * beyond "check it"), and an AI-and-privacy safety check (also a
 * genuine correct-answer case).
 */
export const EQ_AI_LAB_QA_IDS = ["brainstorm-ideas", "customer-research-questions", "marketing-ideas", "analyse-feedback", "compare-options"];
export const EQ_AI_PROMPT_QUALITY_OPTION_IDS = ["poor", "better", "best"];
export const EQ_AI_PROMPT_QUALITY_CORRECT_ID = "best";
export const EQ_AI_WRONG_ANSWER_EVENT_ID = "ai-wrong-answer";
export const EQ_AI_PRIVACY_QUIZ_SAFE_OPTION_ID = "product-name";
export const EQ_AI_PRIVACY_QUIZ_OPTION_IDS = ["product-name", "real-address", "customer-phone-number"];

/** Extra decision effects introduced by v2 — appended here (rather
 * than edited into the original table above) to keep the v1 table's
 * diff minimal and this section self-contained. Merged into the same
 * EQ_DECISION_EFFECTS object below. */
Object.assign(EQ_DECISION_EFFECTS, {
  // Exploratory practice with authored numbers, like the standalone
  // Business Challenges — never overwrites the price the child already
  // set for their own real business in Build.
  "pricing-experiment-reflection": {
    "pick-low-price": {},
    "pick-middle-price": {},
    "pick-high-price": {},
  },
  "choose-a-supplier": {
    "supplier-a": { costsDeltaMinorUnits: -200, reputationDelta: -0.1 },
    "supplier-b": { costsDeltaMinorUnits: 300, reputationDelta: 0.1 },
    "supplier-c": { costsDeltaMinorUnits: 100, reputationDelta: 0.2, salesDelta: 1 },
  },
  "stock-management-scenario": {
    "order-a-lot": { costsDeltaMinorUnits: 150 },
    "order-just-enough": {},
    "order-a-little-and-restock": { reputationDelta: -0.1, salesDelta: -1 },
  },
  // The restaurant example's amounts (hundreds/thousands) are on a
  // deliberately different, "imagine a bigger business" scale than the
  // child's own tiny starter economy (EQ_STARTING_MONEY_MINOR_UNITS =
  // "50") - applying them directly to the child's real cash would just
  // zero it out regardless of choice, which would teach nothing.
  // Exactly like the standalone Business Challenges, this is
  // self-contained conceptual practice: the "profit != cash" lesson
  // lives entirely in the scenario text and each choice's own
  // consequence, never in a persisted stat change.
  "cash-flow-decision": {
    "wait-for-payment": {},
    "use-savings-to-cover-costs": {},
    "ask-for-partial-payment-upfront": {},
  },
  "not-enough-customers": {
    "improve-marketing": { salesDelta: 2, costsDeltaMinorUnits: 100 },
    "research-customers": { reputationDelta: 0.1 },
    "lower-price-temporarily": { salesDelta: 3, reputationDelta: -0.05 },
  },
  "costs-increased": {
    "absorb-the-cost": { costsDeltaMinorUnits: 150 },
    "raise-your-price": { salesDelta: -1 },
    "find-a-cheaper-supplier": { costsDeltaMinorUnits: -50, reputationDelta: -0.1 },
  },
  "negative-review": {
    "apologise-and-fix": { reputationDelta: 0.3 },
    "offer-replacement": { reputationDelta: 0.2, costsDeltaMinorUnits: 50 },
    "ignore-and-move-on": { reputationDelta: -0.3, salesDelta: -1 },
  },
  "sales-falling": {
    "run-a-special-offer": { salesDelta: 2, costsDeltaMinorUnits: 30 },
    "refresh-the-product": { costsDeltaMinorUnits: 100, reputationDelta: 0.2, salesDelta: 1 },
    "ask-customers-directly": { reputationDelta: 0.1 },
  },
  "rising-costs-eating-profit": {
    "review-advertising-spend": { costsDeltaMinorUnits: -80 },
    "reduce-waste": { costsDeltaMinorUnits: -60, reputationDelta: 0.1 },
    "adjust-discounts": { costsDeltaMinorUnits: -40, salesDelta: -1 },
  },
  "profit-but-no-cash": {
    "ask-for-faster-payment": { cashDeltaMinorUnits: 80 },
    "use-savings": { cashDeltaMinorUnits: -40, reputationDelta: 0.1 },
    "delay-a-purchase": { cashDeltaMinorUnits: 20, salesDelta: -1 },
  },
  "too-much-stock": {
    "run-a-clearance-sale": { cashDeltaMinorUnits: 60, reputationDelta: 0.05 },
    "donate-or-repurpose": { reputationDelta: 0.2 },
    "order-less-next-time": { reputationDelta: 0.05 },
  },
  "business-pivot": {
    "keep-model": {},
    "change-customer": { reputationDelta: 0.1, salesDelta: 1 },
    "change-product": { reputationDelta: 0.1, salesDelta: 1 },
    "stop-idea": {},
  },
  "grow-or-stay-small": {
    "stay-small": {},
    "hire-help": { costsDeltaMinorUnits: 200, salesDelta: 2 },
    "buy-equipment": { costsDeltaMinorUnits: 250, salesDelta: 1, reputationDelta: 0.1 },
    "expand-to-new-market": { costsDeltaMinorUnits: 150, salesDelta: 3, reputationDelta: -0.1 },
  },
  "misleading-ad": {
    "honest-ad": { reputationDelta: 0.2 },
    "slightly-exaggerate": { salesDelta: 1, reputationDelta: -0.1 },
    "mislead-customers": { salesDelta: 2, reputationDelta: -0.3 },
  },
  "hiding-a-problem": {
    "tell-customers": { reputationDelta: 0.2 },
    "fix-quietly": {},
    "hide-it": { reputationDelta: -0.3, salesDelta: -1 },
  },
  "cheap-questionable-supplier": {
    "choose-ethical-supplier": { costsDeltaMinorUnits: 50, reputationDelta: 0.2 },
    "choose-cheap-supplier": { costsDeltaMinorUnits: -50, reputationDelta: -0.2 },
    "ask-questions-first": { reputationDelta: 0.1 },
  },
  // Purely reflective — the point is checking the data, not a "correct" pick.
  "ai-wrong-answer": {
    "trust-the-ai": {},
    "check-the-data-first": {},
    "ask-ai-to-explain": {},
  },
} satisfies Record<string, Record<string, EQDecisionEffect>>);
