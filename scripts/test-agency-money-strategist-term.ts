/** Run with: npx tsx scripts/test-agency-money-strategist-term.ts
 * Walks the Money Quest / Strategist pilot mission
 * (src/lib/agency/missions/money-strategist-term.ts): the investment
 * path's delayed payoff landing exactly on schedule, the one
 * combination of choices that genuinely breaches the floor (none of
 * the three choices involved is costly enough alone - it's the
 * combination that creates real scarcity), and that community
 * contribution is tracked as its own resource, never framed as right
 * or wrong relative to keeping the coins. */
import { decide, startMission, validateMission } from "../src/lib/agency/engine";
import { MONEY_STRATEGIST_TERM_ONE } from "../src/lib/agency/missions/money-strategist-term";
import { getMission } from "../src/lib/agency/missions";

let failures = 0;
function check(label: string, actual: unknown, expected: unknown) {
  const pass = JSON.stringify(actual) === JSON.stringify(expected);
  console.log(`${pass ? "✅" : "❌"} ${label}: got ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)}`);
  if (!pass) failures++;
}
function checkTrue(label: string, actual: boolean) {
  console.log(`${actual ? "✅" : "❌"} ${label}`);
  if (!actual) failures++;
}

const def = MONEY_STRATEGIST_TERM_ONE;

check("the mission is structurally well-formed", validateMission(def), []);
check("getMission finds it by id", getMission(def.id)?.id, def.id);
check("it's assigned to the Strategist band", def.band, "strategist");
for (const [nodeId, node] of Object.entries(def.nodes)) {
  checkTrue(`node "${nodeId}" offers at most 3 choices (has ${node.choices.length})`, node.choices.length <= 3);
}
checkTrue("Strategist tracks a second resource beyond spendable coins", "communityImpact" in def.startingResources);

// --- Invest, contribute, then pay for the repair - the delayed payoff covers the cost ---
let investor = startMission(def);
investor = decide(def, investor, "invest-half", 1); // 35 -> 15, +35 due at step 1+2=3
investor = decide(def, investor, "contribute-to-fundraiser", 2); // 15 -> 0, communityImpact -> 10
check("contributing is tracked as its own resource, separate from the coin balance", investor.resources, {
  coins: 0,
  communityImpact: 10,
});
investor = decide(def, investor, "pay-for-repair", 3); // step 3: -30 immediate, then +35 delayed lands: 0-30+35=5
check("the earlier investment's delayed payoff lands just in time to cover the repair", investor.resources, {
  coins: 5,
  communityImpact: 10,
});
check("this path completes without ever needing recovery", investor.status, "completed");

// --- The one combination that genuinely breaches the floor: no investment, contribute anyway, then the repair ---
let shortfall = startMission(def);
shortfall = decide(def, shortfall, "keep-liquid", 1); // 35, unchanged
shortfall = decide(def, shortfall, "contribute-to-fundraiser", 2); // 35 -> 20, communityImpact 10
shortfall = decide(def, shortfall, "pay-for-repair", 3); // 20 -> -10, no delayed payoff to cushion it
check("without the earlier investment, the same contribution + repair combination breaches the floor", shortfall.resources, {
  coins: -10,
  communityImpact: 10,
});
check("this breach redirects to recovery - not a dead end, and not a judgment of contributing", shortfall.currentNodeId, "recovery");
check("none of the three choices that led here was costly enough alone - it's the real combination that matters", shortfall.status, "recovering");

const askedForHelp = decide(def, shortfall, "ask-for-help", 4);
check("asking for help restores a workable balance", askedForHelp.resources, { coins: 10, communityImpact: 10 });
check("the community impact earned earlier is never erased by needing help afterward", askedForHelp.resources.communityImpact, 10);

// --- Keeping liquid and declining to contribute is a legitimate strategy too - never penalised relative to the others ---
let cautious = startMission(def);
cautious = decide(def, cautious, "keep-liquid", 1);
cautious = decide(def, cautious, "keep-for-yourself", 2);
cautious = decide(def, cautious, "delay-repair", 3);
check("the fully cautious path simply keeps every coin - a valid strategy, not a lesser one", cautious.resources, {
  coins: 35,
  communityImpact: 0,
});
check("it completes normally like every other valid strategy", cautious.status, "completed");

console.log(
  failures === 0
    ? "\n✅ All Money Quest Strategist pilot mission tests passed."
    : `\n❌ ${failures} Money Quest Strategist pilot mission test(s) failed.`
);
process.exit(failures === 0 ? 0 : 1);
