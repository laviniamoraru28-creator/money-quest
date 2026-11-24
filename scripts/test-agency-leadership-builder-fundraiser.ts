/** Run with: npx tsx scripts/test-agency-leadership-builder-fundraiser.ts
 * Walks the Leadership Quest / Builder pilot mission: the careful
 * path reaching all four decisions, and the breach (assigning tasks
 * yourself, then letting a disagreement go unresolved) that skips the
 * final two decisions entirely. */
import { decide, startMission, validateMission } from "../src/lib/agency/engine";
import { LEADERSHIP_BUILDER_FUNDRAISER } from "../src/lib/agency/missions/leadership-builder-fundraiser";
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

const def = LEADERSHIP_BUILDER_FUNDRAISER;

check("the mission is structurally well-formed", validateMission(def), []);
check("getMission finds it by id", getMission(def.id)?.id, def.id);
for (const [nodeId, node] of Object.entries(def.nodes)) {
  checkTrue(`node "${nodeId}" offers at most 3 choices (has ${node.choices.length})`, node.choices.length <= 3);
}

let careful = startMission(def);
careful = decide(def, careful, "let-everyone-pick", 1); // teamMorale 5 -> 13
careful = decide(def, careful, "help-them-find-a-compromise", 2); // 13 -> 18
check("the careful path reaches the final two decisions - the risky path below never does", careful.currentNodeId, "falling-behind");
careful = decide(def, careful, "ask-who-needs-help", 3); // 18 -> 24
careful = decide(def, careful, "share-credit-with-team", 4); // 24 -> 31
check("the careful path ends with high team morale and no project progress tracked yet", careful.resources, {
  teamMorale: 31,
  projectProgress: 0,
});
check("it completes normally", careful.status, "completed");

let risky = startMission(def);
risky = decide(def, risky, "assign-tasks-yourself", 1); // projectProgress 0 -> 10, morale untouched (5)
risky = decide(def, risky, "let-them-work-it-out", 2); // morale 5 - 6 = -1
check("assigning tasks yourself then letting a disagreement fester breaches the floor", risky.resources, {
  teamMorale: -1,
  projectProgress: 10,
});
check("the breach redirects to recovery - 'falling behind' and 'credit' are never reached", risky.currentNodeId, "recovery");

const recovered = decide(def, risky, "apologize-and-reset", 3);
check("apologising restores morale without erasing the progress already made", recovered.resources, {
  teamMorale: 3,
  projectProgress: 10,
});
check("it still reaches a real completion", recovered.status, "completed");

console.log(
  failures === 0
    ? "\n✅ All Leadership Quest Builder pilot mission tests passed."
    : `\n❌ ${failures} Leadership Quest Builder pilot mission test(s) failed.`
);
process.exit(failures === 0 ? 0 : 1);
