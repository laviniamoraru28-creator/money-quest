/** Run with: npx tsx scripts/test-agency-money-explorer-week.ts
 * Walks the actual Money Quest / Explorer pilot mission
 * (src/lib/agency/missions/money-explorer-week.ts) end to end through
 * both its "everything stays affordable" path and its "an unexpected
 * expense breaches the floor -> recovery" path, and checks it against
 * the Explorer band's own rules (brief section 5): at most 2-3 choices
 * per decision point, no permanent penalty for running short. */
import { decide, requestRecovery, startMission, validateMission } from "../src/lib/agency/engine";
import { MONEY_EXPLORER_WEEK_ONE } from "../src/lib/agency/missions/money-explorer-week";
import { getMission, AGENCY_MISSIONS } from "../src/lib/agency/missions";

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

const def = MONEY_EXPLORER_WEEK_ONE;

check("the mission is structurally well-formed", validateMission(def), []);
check("getMission finds it by id", getMission(def.id)?.id, def.id);
checkTrue("it's registered in AGENCY_MISSIONS", def.id in AGENCY_MISSIONS);
check("it's assigned to the Explorer band", def.band, "explorer");
check("it starts with the brief's own worked-example amount", def.startingResources, { coins: 25 });

for (const [nodeId, node] of Object.entries(def.nodes)) {
  checkTrue(
    `Explorer rule: node "${nodeId}" offers at most 3 choices (has ${node.choices.length})`,
    node.choices.length <= 3
  );
}

// --- Path 1: save on Monday, skip the trip - never runs short, never touches recovery ---
let cautious = startMission(def);
cautious = decide(def, cautious, "save", 1);
check("saving Monday keeps all 25 coins", cautious.resources, { coins: 25 });
cautious = decide(def, cautious, "skip-trip", 2);
check("skipping the trip spends nothing further", cautious.resources, { coins: 25 });
check("this path reaches Friday directly, never the recovery node", cautious.currentNodeId, "friday");
check("this path never enters a recovering status", cautious.status, "completed");

// --- Path 2: the big treat, then the trip comes up and the budget breaches ---
let spender = startMission(def);
spender = decide(def, spender, "treat", 1); // 25 - 20 = 5
check("the Monday treat costs 20, leaving 5", spender.resources, { coins: 5 });
spender = decide(def, spender, "pay-trip", 2); // 5 - 10 = -5, breaches the floor of 0
check("paying for the trip without enough saved breaches the floor", spender.resources, { coins: -5 });
check("a breach lands on the recovery node, not a dead end", spender.currentNodeId, "recovery");
check("the mission is marked recovering, never 'failed'", spender.status, "recovering");

// --- Recovering by asking for help - never penalised, resources genuinely improve ---
const askedForHelp = decide(def, spender, "ask-for-help", 3);
check("asking for help adds the top-up", askedForHelp.resources, { coins: 5 });
check("after help, the mission reaches its terminal (completed) node", askedForHelp.currentNodeId, "friday");
check("asking for help is never recorded as a failure outcome", askedForHelp.status, "completed");

// --- Recovering by reorganising instead - still reaches a real completion, no top-up needed ---
const reorganised = decide(def, spender, "reorganise-budget", 4);
check("reorganising doesn't change the balance", reorganised.resources, { coins: -5 });
check("reorganising still reaches Friday", reorganised.currentNodeId, "friday");

// --- Explicit requestRecovery is always available even before any breach ---
const earlyHelp = requestRecovery(def, startMission(def), 5);
check("a child can ask for help at any time, not only after running short", earlyHelp.currentNodeId, "recovery");
check("asking early costs nothing", earlyHelp.resources, def.startingResources);

// --- Replay: trying again never carries over a previous run's shortfall ---
const triedAgain = startMission(def);
check("starting over always returns to the full starting balance", triedAgain.resources, { coins: 25 });

console.log(
  failures === 0
    ? "\n✅ All Money Quest Explorer pilot mission tests passed."
    : `\n❌ ${failures} Money Quest Explorer pilot mission test(s) failed.`
);
process.exit(failures === 0 ? 0 : 1);
