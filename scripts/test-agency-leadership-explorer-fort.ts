/** Run with: npx tsx scripts/test-agency-leadership-explorer-fort.ts
 * Walks the Leadership Quest / Explorer pilot mission: sharing vs.
 * keeping the best blocks, and the breach reachable only by keeping
 * them. */
import { decide, startMission, validateMission } from "../src/lib/agency/engine";
import { LEADERSHIP_EXPLORER_FORT } from "../src/lib/agency/missions/leadership-explorer-fort";
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

const def = LEADERSHIP_EXPLORER_FORT;

check("the mission is structurally well-formed", validateMission(def), []);
check("getMission finds it by id", getMission(def.id)?.id, def.id);
check("it's assigned to the Leadership quest", def.quest, "leadership");
check("it's assigned to the Explorer band", def.band, "explorer");
for (const [nodeId, node] of Object.entries(def.nodes)) {
  checkTrue(`Explorer rule: node "${nodeId}" offers at most 3 choices (has ${node.choices.length})`, node.choices.length <= 3);
}

let sharing = startMission(def);
sharing = decide(def, sharing, "share-the-blocks", 1); // 3 -> 6
sharing = decide(def, sharing, "invite-them-in", 2); // 6 -> 10
check("sharing and including others stays well above the floor", sharing.resources, { teamSpirit: 10 });
check("this path completes without ever needing recovery", sharing.status, "completed");

let keeping = startMission(def);
keeping = decide(def, keeping, "keep-best-blocks", 1); // 3 - 5 = -2
check("keeping the best blocks breaches the floor", keeping.resources, { teamSpirit: -2 });
check("the breach redirects to recovery, skipping the 'left out' decision entirely", keeping.currentNodeId, "recovery");

const helped = decide(def, keeping, "ask-for-help", 2);
check("asking for help restores team spirit", helped.resources, { teamSpirit: 3 });
check("it still reaches a real completion", helped.status, "completed");

console.log(
  failures === 0 ? "\n✅ All Leadership Quest Explorer pilot mission tests passed." : `\n❌ ${failures} Leadership Quest Explorer pilot mission test(s) failed.`
);
process.exit(failures === 0 ? 0 : 1);
