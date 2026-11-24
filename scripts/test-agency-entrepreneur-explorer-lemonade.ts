/** Run with: npx tsx scripts/test-agency-entrepreneur-explorer-lemonade.ts
 * Walks the Entrepreneur Quest / Explorer pilot mission: fair vs.
 * high pricing, and the breach reachable only by overpricing. */
import { decide, startMission, validateMission } from "../src/lib/agency/engine";
import { ENTREPRENEUR_EXPLORER_LEMONADE } from "../src/lib/agency/missions/entrepreneur-explorer-lemonade";
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

const def = ENTREPRENEUR_EXPLORER_LEMONADE;

check("the mission is structurally well-formed", validateMission(def), []);
check("getMission finds it by id", getMission(def.id)?.id, def.id);
check("it's assigned to the Entrepreneur quest", def.quest, "entrepreneur");
check("it's assigned to the Explorer band", def.band, "explorer");
for (const [nodeId, node] of Object.entries(def.nodes)) {
  checkTrue(`Explorer rule: node "${nodeId}" offers at most 3 choices (has ${node.choices.length})`, node.choices.length <= 3);
}

let fair = startMission(def);
fair = decide(def, fair, "price-it-fair", 1); // 2 -> 7
fair = decide(def, fair, "move-under-a-tent", 2); // 7 -> 11
check("pricing fairly and adapting to weather stays well above the floor", fair.resources, { coins: 11 });
check("this path completes without ever needing recovery", fair.status, "completed");

let high = startMission(def);
high = decide(def, high, "price-it-high", 1); // 2 - 3 = -1
check("pricing too high breaches the floor", high.resources, { coins: -1 });
check("the breach redirects to recovery, skipping the weather decision entirely", high.currentNodeId, "recovery");

const helped = decide(def, high, "ask-for-help", 2);
check("asking for help restores a workable balance", helped.resources, { coins: 4 });
check("it still reaches a real completion", helped.status, "completed");

console.log(
  failures === 0
    ? "\n✅ All Entrepreneur Quest Explorer pilot mission tests passed."
    : `\n❌ ${failures} Entrepreneur Quest Explorer pilot mission test(s) failed.`
);
process.exit(failures === 0 ? 0 : 1);
