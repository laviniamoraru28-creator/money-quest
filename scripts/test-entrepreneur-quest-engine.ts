/** Run with: npx tsx scripts/test-entrepreneur-quest-engine.ts
 * Exercises runSimulator()'s arithmetic across all three price-to-cost
 * "buyFraction" tiers, the unitsMade-vs-demand capping logic, and the
 * floor-at-zero on remaining money — the exact places a formula bug
 * would silently show a child a wrong or confusing number. Also
 * exercises the EQ state-transition pure functions and the shared
 * awardBadge() function they compose with. */
import {
  runSimulator,
  createDefaultBusinessProfile,
  createDefaultState,
  completeStage,
  completeChallenge,
  toggleRealWorldMission,
  updateBusinessField,
  completePitch,
  recordDecision,
} from "../src/lib/entrepreneur-quest/state";
import { createDefaultState as createDefaultProgressState, awardBadge } from "../src/lib/local-progress/state";
import { EQ_BADGE_IDS, EQ_DECISION_EFFECTS } from "../src/content/entrepreneur-quest/structures";

let failures = 0;
function check(label: string, actual: unknown, expected: unknown) {
  const pass = JSON.stringify(actual) === JSON.stringify(expected);
  console.log(`${pass ? "✅" : "❌"} ${label}: got ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)}`);
  if (!pass) failures++;
}

const business = { ...createDefaultBusinessProfile(), costPerUnitMinorUnits: 200, priceMinorUnits: 500 };

// Case 1: mid-range price-to-cost ratio (2.5 -> 0.7 buyFraction), demand
// is the binding constraint (potentialBuyers < unitsMade), and the
// resulting loss floors remaining money at 0 rather than going negative.
const run1 = runSimulator(business, { materialsMinorUnits: 2000, packagingMinorUnits: 500, advertisingMinorUnits: 1000, savedAsideMinorUnits: 1500 });
check("Case 1: unitsMade (materials / cost-per-unit)", run1.unitsMade, 10);
check("Case 1: unitsSold (capped by demand, not by units made)", run1.unitsSold, 3);
check("Case 1: sales", run1.salesMinorUnits, 1500);
check("Case 1: costs (materials + packaging + advertising)", run1.costsMinorUnits, 3500);
check("Case 1: profit (can be negative — a real loss is honest)", run1.profitMinorUnits, -2000);
check("Case 1: remaining money floors at 0, never negative", run1.remainingMoneyMinorUnits, 0);

// Case 2: cheapest tier (ratio <= 2 -> buyFraction 1.0, everyone reached buys).
const business2 = { ...business, costPerUnitMinorUnits: 100, priceMinorUnits: 200 };
const run2 = runSimulator(business2, { materialsMinorUnits: 1000, packagingMinorUnits: 250, advertisingMinorUnits: 1250, savedAsideMinorUnits: 2500 });
check("Case 2: unitsMade", run2.unitsMade, 10);
check("Case 2: unitsSold (all 5 reached customers buy at a fair price)", run2.unitsSold, 5);
check("Case 2: profit", run2.profitMinorUnits, -1500);
check("Case 2: remaining money", run2.remainingMoneyMinorUnits, 1000);

// Case 3: most expensive tier (ratio > 3 -> buyFraction 0.4).
const business3 = { ...business, costPerUnitMinorUnits: 100, priceMinorUnits: 400 };
const run3 = runSimulator(business3, { materialsMinorUnits: 500, packagingMinorUnits: 0, advertisingMinorUnits: 1250, savedAsideMinorUnits: 3250 });
check("Case 3: unitsMade", run3.unitsMade, 5);
check("Case 3: unitsSold (a high price puts off most of the people reached)", run3.unitsSold, 2);
check("Case 3: profit", run3.profitMinorUnits, -950);
check("Case 3: remaining money", run3.remainingMoneyMinorUnits, 2300);

// Case 4: unitsSold capped by what was actually MADE, not by demand —
// spending almost everything on advertising reaches plenty of people,
// but there's barely any product to sell them.
const business4 = { ...business, costPerUnitMinorUnits: 100, priceMinorUnits: 150 };
const run4 = runSimulator(business4, { materialsMinorUnits: 200, packagingMinorUnits: 0, advertisingMinorUnits: 4800, savedAsideMinorUnits: 0 });
check("Case 4: unitsMade is the binding constraint", run4.unitsMade, 2);
check("Case 4: unitsSold capped at unitsMade despite high demand", run4.unitsSold, 2);
check("Case 4: a big loss still floors at 0, not negative", run4.remainingMoneyMinorUnits, 0);

// --- State-transition pure functions ---
let eqState = createDefaultState();

eqState = completeStage(eqState, "find-a-problem");
check("completeStage adds the stage id", eqState.completedStageIds, ["find-a-problem"]);
eqState = completeStage(eqState, "find-a-problem");
check("completeStage is idempotent (no duplicate on repeat)", eqState.completedStageIds, ["find-a-problem"]);

eqState = completeChallenge(eqState, "pricing-challenge");
eqState = completeChallenge(eqState, "pricing-challenge");
check("completeChallenge is idempotent", eqState.completedChallengeIds, ["pricing-challenge"]);

eqState = toggleRealWorldMission(eqState, "notice-what-people-buy");
check("toggleRealWorldMission adds on first call", eqState.realWorldMissionsDone, ["notice-what-people-buy"]);
eqState = toggleRealWorldMission(eqState, "notice-what-people-buy");
check("toggleRealWorldMission removes on second call", eqState.realWorldMissionsDone, []);

eqState = updateBusinessField(eqState, "businessName", "Sticker Splash");
check("updateBusinessField updates only the targeted field", eqState.business.businessName, "Sticker Splash");

check("pitchCompleted starts false", eqState.pitchCompleted, false);
eqState = completePitch(eqState);
check("completePitch sets pitchCompleted", eqState.pitchCompleted, true);

// --- Shared badge system (local-progress/state.ts's awardBadge) ---
let progressState = createDefaultProgressState();
progressState = awardBadge(progressState, EQ_BADGE_IDS.ideaFinder);
check("awardBadge adds the badge id", progressState.earnedBadgeIds, [EQ_BADGE_IDS.ideaFinder]);
progressState = awardBadge(progressState, EQ_BADGE_IDS.ideaFinder);
check("awardBadge is idempotent (no duplicate on repeat)", progressState.earnedBadgeIds, [EQ_BADGE_IDS.ideaFinder]);
progressState = awardBadge(progressState, EQ_BADGE_IDS.youngFounder);
check("awardBadge accumulates distinct badges", progressState.earnedBadgeIds, [EQ_BADGE_IDS.ideaFinder, EQ_BADGE_IDS.youngFounder]);

// --- Decision effects: a choice should measurably move the company's
// own running stats, not just show narrative flavor text. ---
let effectState = createDefaultState();
effectState = updateBusinessField(effectState, "priceMinorUnits", 500);
check("stats start at the neutral baseline", effectState.stats, { salesCount: 0, revenueMinorUnits: 0, costsMinorUnits: 0, reputationOutOf5: 3.5 });

effectState = recordDecision(effectState, "product-unclear", "explain-simply");
check("a decision with reputationDelta +0.3 moves reputation", effectState.stats.reputationOutOf5, 3.8);
check("a decision with salesDelta +2 adds to salesCount", effectState.stats.salesCount, 2);
check("sales revenue is added at the business's current price (2 x 500)", effectState.stats.revenueMinorUnits, 1000);

// Re-deciding the SAME event (e.g. navigating back to an already-answered
// stage) must not double-apply its effect a second time.
effectState = recordDecision(effectState, "product-unclear", "explain-simply");
check("re-recording the same decision does not double-apply its effect", effectState.stats.salesCount, 2);

// Reputation clamps at the maximum of 5 rather than climbing forever.
let clampState = createDefaultState();
for (const eventId of ["competitor-lower-price", "materials-cost-increase", "too-expensive-feedback", "more-orders-than-expected", "teammate-wants-change"]) {
  const bestChoiceKey = Object.keys(EQ_DECISION_EFFECTS[eventId] ?? {})[0]!;
  clampState = recordDecision(clampState, eventId, bestChoiceKey);
}
check("reputation never exceeds the 0-5 scale", clampState.stats.reputationOutOf5 <= 5, true);
check("reputation never drops below the 0-5 scale", clampState.stats.reputationOutOf5 >= 0, true);

console.log(failures === 0 ? "\n✅ All Entrepreneur Quest engine checks passed." : `\n❌ ${failures} check(s) failed.`);
process.exit(failures === 0 ? 0 : 1);
