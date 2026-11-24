/** Run with: npx tsx scripts/test-agency-entrepreneur-strategist-bakery.ts
 * Walks the Entrepreneur Quest / Strategist pilot mission: compound
 * dual-resource effects, the one breaching combination, and the two
 * recovery choices repairing different resources. */
import { decide, startMission, validateMission } from "../src/lib/agency/engine";
import { ENTREPRENEUR_STRATEGIST_BAKERY } from "../src/lib/agency/missions/entrepreneur-strategist-bakery";
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

const def = ENTREPRENEUR_STRATEGIST_BAKERY;

check("the mission is structurally well-formed", validateMission(def), []);
check("getMission finds it by id", getMission(def.id)?.id, def.id);
for (const [nodeId, node] of Object.entries(def.nodes)) {
  checkTrue(`node "${nodeId}" offers at most 3 choices (has ${node.choices.length})`, node.choices.length <= 3);
}

// --- Quality-first path: costs more up front, but builds satisfaction that sustains growth ---
let quality = startMission(def);
quality = decide(def, quality, "buy-quality-ingredients", 1); // profit 12-5=7, satisfaction 10+8=18
check("a single Strategist choice can move two resources in opposite directions", quality.resources, {
  profit: 7,
  customerSatisfaction: 18,
});
quality = decide(def, quality, "keep-prices-steady-absorb-cost", 2); // profit 7-6=1, satisfaction 18+5=23
check("staying solvent this way is a close call but doesn't breach", quality.resources, {
  profit: 1,
  customerSatisfaction: 23,
});
quality = decide(def, quality, "grow-slowly-and-steadily", 3); // profit 1+4=5, satisfaction 23+6=29
check("growing slowly ends the mission in healthy shape", quality.resources, { profit: 5, customerSatisfaction: 29 });
check("it completes normally", quality.status, "completed");

// --- The one combination that breaches: cheap ingredients, then raising prices on top of lost goodwill ---
let risky = startMission(def);
risky = decide(def, risky, "buy-cheaper-ingredients", 1); // profit 12+10=22, satisfaction 10-6=4
risky = decide(def, risky, "raise-prices-to-cover-costs", 2); // profit 22+8=30, satisfaction 4-5=-1
check("neither choice alone would breach customer satisfaction, but together they do", risky.resources, {
  profit: 30,
  customerSatisfaction: -1,
});
check("the breach redirects to recovery, skipping the expansion decision entirely", risky.currentNodeId, "recovery");

const viaHelp = decide(def, risky, "ask-for-help", 3);
check("'ask for help' repairs profit, leaving satisfaction as it was", viaHelp.resources, {
  profit: 40,
  customerSatisfaction: -1,
});
check("it reaches a real completion", viaHelp.status, "completed");

const viaQuality = decide(def, risky, "win-back-customers-with-quality", 4);
check("'win back customers with quality' repairs satisfaction instead, leaving profit as it was", viaQuality.resources, {
  profit: 30,
  customerSatisfaction: 7,
});
check("it also reaches a real completion - no single correct repair", viaQuality.status, "completed");

console.log(
  failures === 0
    ? "\n✅ All Entrepreneur Quest Strategist pilot mission tests passed."
    : `\n❌ ${failures} Entrepreneur Quest Strategist pilot mission test(s) failed.`
);
process.exit(failures === 0 ? 0 : 1);
