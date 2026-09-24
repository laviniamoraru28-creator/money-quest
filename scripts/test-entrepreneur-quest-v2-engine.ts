/** Run with: npx tsx scripts/test-entrepreneur-quest-v2-engine.ts
 * Exercises the v2 BUILD -> RUN -> RESCUE & GROW additions: the
 * inserted Research Demand/Test the Idea stages, the extended
 * decision-effect shape (cost/cash deltas), the Pricing Experiment's
 * authored arithmetic, Business Problem state transitions, Pivot/Grow
 * effects on the persistent business, and Rescue's isolated local
 * stats + deterministic outcome derivation. */
import {
  createDefaultState,
  recordDecision,
  updateBusinessField,
  completeRunActivity,
  completeProblem,
  setStockLevel,
  applyPivotChoice,
  applyGrowDecision,
  startRescue,
  recordRescueDecision,
  finishRescue,
  computeRescueOutcome,
  computePricingExperimentRow,
  type RescueStats,
} from "../src/lib/entrepreneur-quest/state";
import {
  EQ_STAGES,
  getEQStageById,
  getEQStageByOrder,
  EQ_PRICING_EXPERIMENT_ROWS,
  EQ_PRICING_EXPERIMENT_COST_PER_UNIT_MINOR_UNITS,
  EQ_CUSTOMER_CATEGORY_IDS,
  EQ_PRODUCT_CATEGORY_IDS,
  EQ_RESCUE_SCENARIO,
} from "../src/content/entrepreneur-quest/structures";

let failures = 0;
function check(label: string, actual: unknown, expected: unknown) {
  const pass = JSON.stringify(actual) === JSON.stringify(expected);
  console.log(`${pass ? "✅" : "❌"} ${label}: got ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)}`);
  if (!pass) failures++;
}

// --- Stage insertion: the existing 16 stages must be fully intact, ---
// --- just renumbered, with 2 new stages inserted at orders 3-4. ---
check("EQ_STAGES now has 18 stages", EQ_STAGES.length, 18);
check("research-demand inserted at order 3", getEQStageByOrder(3)?.id, "research-demand");
check("test-the-idea inserted at order 4", getEQStageByOrder(4)?.id, "test-the-idea");
check("name-your-business shifted to order 5 (was 3 in v1)", getEQStageById("name-your-business")?.order, 5);
check("create-your-final-pitch is still last, now at order 18", getEQStageById("create-your-final-pitch")?.order, 18);
check("find-a-problem and create-an-idea untouched at orders 1-2", [getEQStageById("find-a-problem")?.order, getEQStageById("create-an-idea")?.order], [1, 2]);

// --- Extended decision-effect shape: costs/cash deltas ---
let state = createDefaultState();
state = updateBusinessField(state, "priceMinorUnits", 500);
check("cash starts at the simulator's starting money", state.stats.cashMinorUnits, 5000);

state = recordDecision(state, "choose-a-supplier", "supplier-b");
check("supplier-b's costsDeltaMinorUnits (+300) is applied", state.stats.costsMinorUnits, 300);
check("supplier-b's reputationDelta (+0.1) is applied", state.stats.reputationOutOf5, 3.6);
check("cash falls by the same one-off cost (no revenue this time)", state.stats.cashMinorUnits, 5000 - 300);

// Cash Flow is deliberately self-contained conceptual practice (like
// the standalone Business Challenges) since its restaurant-scale
// numbers (hundreds/thousands) are intentionally much bigger than the
// child's own tiny starter economy — it must NOT touch the child's
// real persistent cash, or every choice would just zero it out.
let cashState = createDefaultState();
const cashBefore = cashState.stats.cashMinorUnits;
cashState = recordDecision(cashState, "cash-flow-decision", "ask-for-partial-payment-upfront");
check("cash-flow-decision leaves the child's own persistent cash untouched", cashState.stats.cashMinorUnits, cashBefore);

// --- Pricing Experiment: pure, authored arithmetic ---
for (const row of EQ_PRICING_EXPERIMENT_ROWS) {
  const computed = computePricingExperimentRow(row);
  const expectedRevenue = row.priceMinorUnits * row.unitsSold;
  const expectedCosts = EQ_PRICING_EXPERIMENT_COST_PER_UNIT_MINOR_UNITS * row.unitsSold;
  check(`Pricing row @${row.priceMinorUnits}: revenue`, computed.revenueMinorUnits, expectedRevenue);
  check(`Pricing row @${row.priceMinorUnits}: costs`, computed.costsMinorUnits, expectedCosts);
  check(`Pricing row @${row.priceMinorUnits}: profit`, computed.profitMinorUnits, expectedRevenue - expectedCosts);
}
// The lesson itself: the highest price is NOT automatically the most profitable.
const rowProfits = EQ_PRICING_EXPERIMENT_ROWS.map((r) => computePricingExperimentRow(r).profitMinorUnits);
const highestPriceIsMostProfitable = rowProfits[rowProfits.length - 1] === Math.max(...rowProfits);
check("higher price is NOT automatically the most profitable row (the lesson holds)", highestPriceIsMostProfitable, false);

// --- Business Problems: response effects + idempotent completion tracking ---
let problemState = createDefaultState();
problemState = recordDecision(problemState, "negative-review", "apologise-and-fix");
check("negative-review's apologise-and-fix moves reputation by +0.3", problemState.stats.reputationOutOf5, 3.8);
problemState = completeProblem(problemState, "negative-review");
problemState = completeProblem(problemState, "negative-review");
check("completeProblem is idempotent", problemState.completedProblemIds, ["negative-review"]);
problemState = completeRunActivity(problemState, "business-problems");
problemState = completeRunActivity(problemState, "business-problems");
check("completeRunActivity is idempotent", problemState.completedRunActivityIds, ["business-problems"]);

let stockState = createDefaultState();
stockState = setStockLevel(stockState, "low");
check("setStockLevel updates stats.stockLevel", stockState.stats.stockLevel, "low");

// --- Business Pivot: two choices genuinely change the business ---
let pivotState = createDefaultState();
pivotState = updateBusinessField(pivotState, "customerCategory", EQ_CUSTOMER_CATEGORY_IDS[0]!);
pivotState = applyPivotChoice(pivotState, "change-customer");
check("change-customer picks a DIFFERENT customer category than the current one", pivotState.business.customerCategory !== EQ_CUSTOMER_CATEGORY_IDS[0], true);

let pivotState2 = createDefaultState();
pivotState2 = updateBusinessField(pivotState2, "productCategory", EQ_PRODUCT_CATEGORY_IDS[0]!);
pivotState2 = applyPivotChoice(pivotState2, "change-product");
check("change-product picks a DIFFERENT product category than the current one", pivotState2.business.productCategory !== EQ_PRODUCT_CATEGORY_IDS[0], true);

let pivotState3 = createDefaultState();
const originalCustomer = pivotState3.business.customerCategory;
const originalProduct = pivotState3.business.productCategory;
pivotState3 = applyPivotChoice(pivotState3, "keep-model");
check("keep-model changes nothing about the business", [pivotState3.business.customerCategory, pivotState3.business.productCategory], [originalCustomer, originalProduct]);
check("business-pivot choice is recorded like any other decision", pivotState3.decisionChoices["business-pivot"], "keep-model");

// --- Grow or Stay Small ---
let growState = createDefaultState();
growState = applyGrowDecision(growState, "stay-small");
check("stay-small has zero stat effect", [growState.stats.costsMinorUnits, growState.stats.salesCount], [0, 0]);

let growState2 = createDefaultState();
growState2 = applyGrowDecision(growState2, "buy-equipment");
check("buy-equipment costs money AND increases sales/reputation", [growState2.stats.costsMinorUnits > 0, growState2.stats.salesCount > 0, growState2.stats.reputationOutOf5 > 3.5], [true, true, true]);

// --- Business Rescue: isolated local stats, never touches the child's own business ---
let rescueParent = createDefaultState();
rescueParent = updateBusinessField(rescueParent, "businessName", "My Real Company");
const beforeStartStats = { ...rescueParent.stats };
rescueParent = startRescue(rescueParent);
check("starting Rescue does not touch the child's own stats", rescueParent.stats, beforeStartStats);
check("Rescue's local stats start from EQ_RESCUE_SCENARIO's fixed dataset", rescueParent.rescue.stats, EQ_RESCUE_SCENARIO.startingStats);

rescueParent = startRescue(rescueParent); // idempotent
check("startRescue is idempotent (started flag only flips once)", rescueParent.rescue.started, true);

for (const problemId of EQ_RESCUE_SCENARIO.problemIds) {
  const responseId = problemId === "sales-falling" ? "run-a-special-offer" : problemId === "too-much-stock" ? "run-a-clearance-sale" : "ask-for-faster-payment";
  rescueParent = recordRescueDecision(rescueParent, problemId, responseId);
}
check("all 3 rescue problems recorded", rescueParent.rescue.completedProblemIds.length, 3);
check("the child's OWN business is still completely untouched after Rescue", rescueParent.business.businessName, "My Real Company");

rescueParent = finishRescue(rescueParent);
check("finishRescue sets a non-null outcome once all problems are done", rescueParent.rescue.outcome !== null, true);

// Idempotent re-application of the same rescue problem doesn't double-count.
let doubleApplyState = createDefaultState();
doubleApplyState = startRescue(doubleApplyState);
const afterFirst = recordRescueDecision(doubleApplyState, "sales-falling", "run-a-special-offer");
const afterSecond = recordRescueDecision(afterFirst, "sales-falling", "refresh-the-product");
check("re-answering an already-completed rescue problem does not change its stats again", afterSecond.rescue.stats, afterFirst.rescue.stats);

// Deterministic outcome thresholds (never random).
const healthyStats: RescueStats = { revenueMinorUnits: 500000, costsMinorUnits: 400000, customersTotal: 40, reputationOutOf5: 4, stockLevel: "medium", demandLevel: "medium" };
const strugglingStats: RescueStats = { revenueMinorUnits: 300000, costsMinorUnits: 500000, customersTotal: 20, reputationOutOf5: 3, stockLevel: "high", demandLevel: "low" };
const brokenTrustStats: RescueStats = { revenueMinorUnits: 350000, costsMinorUnits: 400000, customersTotal: 15, reputationOutOf5: 1.5, stockLevel: "high", demandLevel: "low" };
check("a healthy profit + good reputation -> 'improved'", computeRescueOutcome(healthyStats), "improved");
check("a big ongoing loss -> 'still-struggling'", computeRescueOutcome(strugglingStats), "still-struggling");
check("very low reputation -> 'needs-pivot' regardless of the numbers", computeRescueOutcome(brokenTrustStats), "needs-pivot");

console.log(failures === 0 ? "\n✅ All Entrepreneur Quest v2 engine checks passed." : `\n❌ ${failures} check(s) failed.`);
process.exit(failures === 0 ? 0 : 1);
