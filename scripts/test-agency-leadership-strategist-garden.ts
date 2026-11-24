/** Run with: npx tsx scripts/test-agency-leadership-strategist-garden.ts
 * Walks the Leadership Quest / Strategist pilot mission: compound
 * dual-resource effects, the one breaching combination, and the two
 * recovery choices repairing trust through different means. */
import { decide, startMission, validateMission } from "../src/lib/agency/engine";
import { LEADERSHIP_STRATEGIST_GARDEN } from "../src/lib/agency/missions/leadership-strategist-garden";
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

const def = LEADERSHIP_STRATEGIST_GARDEN;

check("the mission is structurally well-formed", validateMission(def), []);
check("getMission finds it by id", getMission(def.id)?.id, def.id);
for (const [nodeId, node] of Object.entries(def.nodes)) {
  checkTrue(`node "${nodeId}" offers at most 3 choices (has ${node.choices.length})`, node.choices.length <= 3);
}

// --- Enforcing safety rules costs some community impact but builds trust - a real trade-off ---
let ethical = startMission(def);
ethical = decide(def, ethical, "enforce-the-safety-rules", 1); // trust 10->16, impact 5->3
check("a single Strategist choice can move two resources at once, in opposite directions", ethical.resources, {
  teamTrust: 16,
  communityImpact: 3,
});
ethical = decide(def, ethical, "prioritize-team-tools", 2); // trust 16 -> 21
ethical = decide(def, ethical, "bring-the-whole-team-to-the-interview", 3); // trust 21->28, impact 3->7
check("the fully team-first path ends with strong trust and a healthy community impact", ethical.resources, {
  teamTrust: 28,
  communityImpact: 7,
});
check("it completes normally", ethical.status, "completed");

// --- The one combination that breaches: let the shortcut slide, then prioritise community over team ---
let risky = startMission(def);
risky = decide(def, risky, "let-it-slide-to-save-time", 1); // trust 10-8=2, impact 5+3=8
risky = decide(def, risky, "prioritize-community-benefit", 2); // trust 2-3=-1, impact 8+8=16
check("neither choice alone would breach, but together they do", risky.resources, { teamTrust: -1, communityImpact: 16 });
check("the breach redirects to recovery, skipping the interview decision entirely", risky.currentNodeId, "recovery");

const viaHelp = decide(def, risky, "ask-for-help", 3);
check("'ask for help' restores trust directly", viaHelp.resources, { teamTrust: 7, communityImpact: 16 });
check("it reaches a real completion", viaHelp.status, "completed");

const viaAction = decide(def, risky, "rebuild-trust-through-action", 4);
check("'rebuild trust through action' repairs both resources together - a different valid strategy", viaAction.resources, {
  teamTrust: 2,
  communityImpact: 19,
});
check("it also reaches a real completion - no single correct repair", viaAction.status, "completed");

console.log(
  failures === 0
    ? "\n✅ All Leadership Quest Strategist pilot mission tests passed."
    : `\n❌ ${failures} Leadership Quest Strategist pilot mission test(s) failed.`
);
process.exit(failures === 0 ? 0 : 1);
