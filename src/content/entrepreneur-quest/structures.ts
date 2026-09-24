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

export type EQStageKind = "reflect-text" | "logo" | "product-category" | "customer-category" | "marketing-category" | "numeric" | "mission" | "simulator-handoff" | "pitch-handoff";

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
  { id: "name-your-business", order: 3, kind: "reflect-text" },
  { id: "create-your-logo", order: 4, kind: "logo" },
  { id: "choose-your-product", order: 5, kind: "product-category" },
  { id: "choose-your-customer", order: 6, kind: "customer-category" },
  { id: "understand-costs", order: 7, kind: "numeric" },
  { id: "set-your-price", order: 8, kind: "numeric" },
  { id: "create-your-marketing", order: 9, kind: "marketing-category", missionEventIds: ["product-unclear"] },
  { id: "make-your-first-sale", order: 10, kind: "simulator-handoff" },
  { id: "calculate-your-profit", order: 11, kind: "numeric" },
  { id: "handle-competition", order: 12, kind: "mission", missionEventIds: ["competitor-lower-price"] },
  { id: "handle-a-customer-problem", order: 13, kind: "mission", missionEventIds: ["materials-cost-increase", "too-expensive-feedback"] },
  { id: "make-a-business-decision", order: 14, kind: "mission", missionEventIds: ["more-orders-than-expected", "teammate-wants-change"] },
  { id: "grow-your-business", order: 15, kind: "mission", missionEventIds: ["fewer-sales-than-expected"] },
  { id: "create-your-final-pitch", order: 16, kind: "pitch-handoff" },
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
  "product-unclear",
  "competitor-lower-price",
  "materials-cost-increase",
  "too-expensive-feedback",
  "more-orders-than-expected",
  "teammate-wants-change",
  "fewer-sales-than-expected",
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
