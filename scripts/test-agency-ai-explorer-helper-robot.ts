/** Run with: npx tsx scripts/test-agency-ai-explorer-helper-robot.ts
 * Walks the AI Quest / Explorer pilot mission: the robot's two
 * answers (one wrong, one right), the breach reachable only by
 * blindly trusting the wrong one, and both recovery choices. */
import { decide, startMission, validateMission } from "../src/lib/agency/engine";
import { AI_EXPLORER_HELPER_ROBOT } from "../src/lib/agency/missions/ai-explorer-helper-robot";
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

const def = AI_EXPLORER_HELPER_ROBOT;

check("the mission is structurally well-formed", validateMission(def), []);
check("getMission finds it by id", getMission(def.id)?.id, def.id);
check("it's assigned to the AI quest", def.quest, "ai");
check("it's assigned to the Explorer band", def.band, "explorer");
for (const [nodeId, node] of Object.entries(def.nodes)) {
  checkTrue(`Explorer rule: node "${nodeId}" offers at most 3 choices (has ${node.choices.length})`, node.choices.length <= 3);
}

// --- Checking first, both times - a safe path that never needs recovery ---
let careful = startMission(def);
careful = decide(def, careful, "check-with-grownup", 1); // 3 -> 5
careful = decide(def, careful, "check-with-grownup", 2); // 5 -> 6
check("checking both times stays well above the floor", careful.resources, { confidence: 6 });
check("this path completes without ever needing recovery", careful.status, "completed");

// --- Trusting blindly on the wrong answer breaches the floor immediately ---
let trusting = startMission(def);
trusting = decide(def, trusting, "trust-the-robot", 1); // 3 - 5 = -2
check("trusting the robot's wrong answer breaches the floor", trusting.resources, { confidence: -2 });
check("a breach redirects to recovery, skipping question 2 entirely", trusting.currentNodeId, "recovery");
check("the mission is marked recovering, never 'failed'", trusting.status, "recovering");

const askedForHelp = decide(def, trusting, "ask-for-help", 2);
check("asking for help restores a workable confidence level", askedForHelp.resources, { confidence: 3 });
check("asking for help still reaches a real completion", askedForHelp.status, "completed");

const triedAgain = decide(def, trusting, "try-again", 3);
check("trying again doesn't change confidence but still completes", triedAgain.resources, { confidence: -2 });
check("trying again reaches the terminal node, not a dead end", triedAgain.currentNodeId, "result");

// --- Trusting the robot's correct second answer is also a legitimate choice ---
let mixed = startMission(def);
mixed = decide(def, mixed, "check-with-grownup", 1); // 3 -> 5
mixed = decide(def, mixed, "trust-the-robot", 2); // 5 -> 8 (the robot is right here)
check("trusting a correct answer is rewarded too - it's not 'checking' alone that matters", mixed.resources, { confidence: 8 });
check("this path completes normally", mixed.status, "completed");

console.log(
  failures === 0 ? "\n✅ All AI Quest Explorer pilot mission tests passed." : `\n❌ ${failures} AI Quest Explorer pilot mission test(s) failed.`
);
process.exit(failures === 0 ? 0 : 1);
