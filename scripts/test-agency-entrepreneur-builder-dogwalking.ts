/** Run with: npx tsx scripts/test-agency-entrepreneur-builder-dogwalking.ts
 * Walks the Entrepreneur Quest / Builder pilot mission: the careful
 * path reaching all four decisions, and the breach (overcharging)
 * that skips the rest entirely. */
import { decide, startMission, validateMission } from "../src/lib/agency/engine";
import { ENTREPRENEUR_BUILDER_DOGWALKING } from "../src/lib/agency/missions/entrepreneur-builder-dogwalking";
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

const def = ENTREPRENEUR_BUILDER_DOGWALKING;

check("the mission is structurally well-formed", validateMission(def), []);
check("getMission finds it by id", getMission(def.id)?.id, def.id);
for (const [nodeId, node] of Object.entries(def.nodes)) {
  checkTrue(`node "${nodeId}" offers at most 3 choices (has ${node.choices.length})`, node.choices.length <= 3);
}

let careful = startMission(def);
careful = decide(def, careful, "charge-a-fair-price", 1); // coins 3 -> 13
careful = decide(def, careful, "always-show-up-on-time", 2); // reputation 5 -> 13
check("the careful path reaches marketing - the risky path below never does", careful.currentNodeId, "marketing");
careful = decide(def, careful, "rely-on-word-of-mouth", 3); // reputation 13 -> 15
careful = decide(def, careful, "chase-and-return-it-safely", 4); // reputation 15 -> 25
check("the careful path ends with a healthy coin balance and strong reputation", careful.resources, {
  coins: 13,
  reputation: 25,
});
check("it completes normally", careful.status, "completed");

let risky = startMission(def);
risky = decide(def, risky, "charge-too-much", 1); // coins 3 - 5 = -2
check("overcharging alone breaches the floor", risky.resources, { coins: -2, reputation: 5 });
check("the breach redirects to recovery - quality, marketing and the unexpected event are never reached", risky.currentNodeId, "recovery");

const recovered = decide(def, risky, "adjust-your-price", 2);
check("adjusting the price restores a workable balance without touching reputation", recovered.resources, {
  coins: 1,
  reputation: 5,
});
check("it still reaches a real completion", recovered.status, "completed");

console.log(
  failures === 0
    ? "\n✅ All Entrepreneur Quest Builder pilot mission tests passed."
    : `\n❌ ${failures} Entrepreneur Quest Builder pilot mission test(s) failed.`
);
process.exit(failures === 0 ? 0 : 1);
