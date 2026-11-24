/** Run with: npx tsx scripts/test-agency-ai-strategist-business-plan.ts
 * Walks the AI Quest / Strategist pilot mission: compound
 * dual-resource effects, the one combination that breaches the floor,
 * and the two recovery choices deliberately repairing DIFFERENT
 * resources (plan quality vs. trustworthiness). */
import { decide, startMission, validateMission } from "../src/lib/agency/engine";
import { AI_STRATEGIST_BUSINESS_PLAN } from "../src/lib/agency/missions/ai-strategist-business-plan";
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

const def = AI_STRATEGIST_BUSINESS_PLAN;

check("the mission is structurally well-formed", validateMission(def), []);
check("getMission finds it by id", getMission(def.id)?.id, def.id);
for (const [nodeId, node] of Object.entries(def.nodes)) {
  checkTrue(`node "${nodeId}" offers at most 3 choices (has ${node.choices.length})`, node.choices.length <= 3);
}

// --- Verifying stats affects BOTH resources at once - compound effects, not one-resource-per-choice ---
let diligent = startMission(def);
diligent = decide(def, diligent, "verify-with-real-sources", 1); // planQuality 15->25, trustworthiness 12->15
check("a single Strategist choice can move two resources at once", diligent.resources, { planQuality: 25, trustworthiness: 15 });

// --- Full honest path reaches a real completion with both resources healthy ---
diligent = decide(def, diligent, "revise-and-personalize", 2); // planQuality 25 -> 33
diligent = decide(def, diligent, "disclose-ai-assistance", 3); // trustworthiness 15 -> 21
check("the fully diligent path ends with both resources improved", diligent.resources, { planQuality: 33, trustworthiness: 21 });
check("it completes normally", diligent.status, "completed");

// --- The one combination that breaches: unverified stats, then an unedited pitch ---
let careless = startMission(def);
careless = decide(def, careless, "use-stats-directly", 1); // planQuality 15 -> 3
careless = decide(def, careless, "submit-ai-pitch-unedited", 2); // planQuality 3 -> -2, trustworthiness 12 -> 7
check("neither choice alone would breach, but together they do", careless.resources, { planQuality: -2, trustworthiness: 7 });
check("the breach redirects to recovery, skipping the AI-image question entirely", careless.currentNodeId, "recovery");

// --- The two recovery choices repair genuinely different resources - no single "correct" repair ---
const viaHelp = decide(def, careless, "ask-for-help", 3);
check("'ask for help' repairs plan quality specifically", viaHelp.resources, { planQuality: 8, trustworthiness: 7 });
check("it reaches a real completion", viaHelp.status, "completed");

const viaHonesty = decide(def, careless, "rebuild-honestly", 4);
check("'rebuild honestly' repairs trustworthiness instead, leaving plan quality as it was", viaHonesty.resources, {
  planQuality: -2,
  trustworthiness: 12,
});
check("it also reaches a real completion - there is no single correct repair strategy", viaHonesty.status, "completed");

console.log(
  failures === 0
    ? "\n✅ All AI Quest Strategist pilot mission tests passed."
    : `\n❌ ${failures} AI Quest Strategist pilot mission test(s) failed.`
);
process.exit(failures === 0 ? 0 : 1);
