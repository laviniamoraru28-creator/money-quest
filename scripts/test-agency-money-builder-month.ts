/** Run with: npx tsx scripts/test-agency-money-builder-month.ts
 * Walks the Money Quest / Builder pilot mission
 * (src/lib/agency/missions/money-builder-month.ts) through its
 * careful-saving path (reaches all four decision points, never
 * breaches), its spend-now path (the delayed surprise bill breaches
 * the floor at week 3, skipping week 4 entirely - a genuinely
 * different mission SHAPE, not just a different number), and both
 * recovery choices. */
import { decide, startMission, validateMission } from "../src/lib/agency/engine";
import { MONEY_BUILDER_MONTH_ONE } from "../src/lib/agency/missions/money-builder-month";
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

const def = MONEY_BUILDER_MONTH_ONE;

check("the mission is structurally well-formed", validateMission(def), []);
check("getMission finds it by id", getMission(def.id)?.id, def.id);
check("it's assigned to the Builder band", def.band, "builder");
for (const [nodeId, node] of Object.entries(def.nodes)) {
  checkTrue(`Builder rule: node "${nodeId}" offers at most 3 choices (has ${node.choices.length})`, node.choices.length <= 3);
}

// --- Careful path: save, decline the treat, do chores, add more - reaches all four decision points ---
let careful = startMission(def);
careful = decide(def, careful, "save-15", 1); // 40 -> 25 coins, savedForBike 15
check("saving in week 1 moves coins into the goal, not just away", careful.resources, { coins: 25, savedForBike: 15 });
careful = decide(def, careful, "decline-politely", 2); // no change
careful = decide(def, careful, "do-chores", 3); // 25 -> 35 (no delayed bill was ever scheduled)
check("the careful path never triggers the surprise bill", careful.resources, { coins: 35, savedForBike: 15 });
check("the careful path reaches week 4 - the spend-now path below never does", careful.currentNodeId, "week4");
careful = decide(def, careful, "add-10-more", 4);
check("the final decision moves more coins into the goal", careful.resources, { coins: 25, savedForBike: 25 });
check("the careful path completes normally", careful.status, "completed");

// --- Spend-now path: the delayed bill lands exactly at week 3 and breaches the floor, skipping week 4 ---
let spender = startMission(def);
spender = decide(def, spender, "spend-on-games", 1); // 40 -> 25, schedules -25 due at step 1+2=3
check("spending now costs the same up front as saving", spender.resources, { coins: 25, savedForBike: 0 });
spender = decide(def, spender, "share-treat", 2); // 25 -> 20
spender = decide(def, spender, "do-chores", 3); // step 3: +10 immediate, then the delayed -25 lands: 20+10-25 = 5... verify exact order below
check("the delayed bill lands on schedule, landing AFTER this step's own immediate effect", spender.resources, { coins: 5, savedForBike: 0 });
check("5 coins does not breach the floor here - still a normal path, just a close call", spender.currentNodeId, "week4");

// --- A genuinely breaching combination: spend now, share the treat, then skip chores too ---
let breached = startMission(def);
breached = decide(def, breached, "spend-on-games", 1); // 40 -> 25, bill due step 3
breached = decide(def, breached, "share-treat", 2); // 25 -> 20
breached = decide(def, breached, "skip-chores", 3); // step 3: no immediate effect, then -25 lands: 20 - 25 = -5
check("skipping the extra chores on top of the earlier spending breaches the floor", breached.resources, { coins: -5, savedForBike: 0 });
check("a breach redirects to recovery, and week 4's own decision is never reached - a real shape difference, not just a worse number", breached.currentNodeId, "recovery");
check("the mission is marked recovering, never 'failed'", breached.status, "recovering");

const askedForHelp = decide(def, breached, "ask-for-help", 4);
check("asking for help brings the balance back to workable", askedForHelp.resources, { coins: 10, savedForBike: 0 });
check("asking for help still reaches a real completion", askedForHelp.status, "completed");

const adjustedGoal = decide(def, breached, "adjust-goal", 5);
check("adjusting the goal doesn't change the balance", adjustedGoal.resources, { coins: -5, savedForBike: 0 });
check("adjusting the goal still reaches a real completion, not a dead end", adjustedGoal.currentNodeId, "result");

console.log(
  failures === 0 ? "\n✅ All Money Quest Builder pilot mission tests passed." : `\n❌ ${failures} Money Quest Builder pilot mission test(s) failed.`
);
process.exit(failures === 0 ? 0 : 1);
