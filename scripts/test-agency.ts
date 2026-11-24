/** Run with: npx tsx scripts/test-agency.ts
 * Exercises the shared Agency decision/consequence engine
 * (src/lib/agency/engine.ts) against a small synthetic mission built
 * in this file - branching, resource floors + recovery redirect,
 * delayed effects, affordability gating, replay, and validateMission's
 * own structural checks. The pilot mission's own content (every real
 * outcomeTag/node reachable, the specific worked-example numbers) is
 * covered separately in test-agency-money-explorer-week.ts. */
import {
  startMission,
  decide,
  requestRecovery,
  resetMission,
  availableChoices,
  previewChoice,
  validateMission,
  type MissionDefinition,
} from "../src/lib/agency/engine";

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

// A small synthetic mission exercising every engine feature: two
// branches from the start node, a resource floor that one path can
// breach, a recovery node, a delayed effect, and a terminal node.
const MISSION: MissionDefinition = {
  id: "test-mission",
  quest: "money",
  band: "explorer",
  startNodeId: "start",
  startingResources: { coins: 10 },
  resourceFloors: { coins: 0 },
  recoveryNodeId: "recovery",
  nodes: {
    start: {
      id: "start",
      choices: [
        { id: "cheap", consequence: { immediate: { coins: -2 }, nextNodeId: "mid", outcomeTag: "cheap" } },
        {
          id: "expensive",
          requires: { coins: 8 },
          consequence: { immediate: { coins: -8 }, nextNodeId: "mid", outcomeTag: "expensive" },
        },
        {
          id: "delayed-cost",
          consequence: {
            immediate: {},
            delayed: [{ delaySteps: 1, effect: { coins: -3 } }],
            nextNodeId: "mid",
            outcomeTag: "delayed-cost",
          },
        },
      ],
    },
    mid: {
      id: "mid",
      choices: [
        // No `requires` guard - can legitimately push coins below 0,
        // which is exactly what should redirect to the recovery node.
        { id: "forced-expense", consequence: { immediate: { coins: -5 }, nextNodeId: "end", outcomeTag: "forced-expense" } },
        { id: "free-choice", consequence: { immediate: {}, nextNodeId: "end", outcomeTag: "free-choice" } },
      ],
    },
    recovery: {
      id: "recovery",
      isRecoveryNode: true,
      choices: [
        { id: "top-up", consequence: { immediate: { coins: 5 }, nextNodeId: "end", outcomeTag: "topped-up" } },
        // No resource change at all - models "reorganise and carry on
        // with what's left" rather than a magic top-up.
        { id: "carry-on", consequence: { immediate: {}, nextNodeId: "end", outcomeTag: "carried-on" } },
      ],
    },
    end: { id: "end", choices: [] },
  },
};

// --- startMission ---
let state = startMission(MISSION);
check("startMission sets starting resources", state.resources, { coins: 10 });
check("startMission starts at the start node", state.currentNodeId, "start");
check("startMission status is in-progress for a non-terminal start node", state.status, "in-progress");
check("startMission has empty history", state.history, []);
check("startMission has zero pending effects", state.pendingEffects, []);

// --- basic decide: immediate effect + branching ---
state = decide(MISSION, state, "cheap", 1000);
check("cheap choice deducts its cost", state.resources, { coins: 8 });
check("cheap choice advances to its nextNodeId", state.currentNodeId, "mid");
check("history records the choice and resulting resources", state.history, [
  { nodeId: "start", choiceId: "cheap", resourcesAfter: { coins: 8 }, timestamp: 1000 },
]);

// --- decide() never mutates the state it was given ---
const before = startMission(MISSION);
decide(MISSION, before, "cheap");
check("decide() does not mutate its input state", before.resources, { coins: 10 });

// --- unaffordable choice is a no-op ---
// "expensive" requires 8 coins and only exists at the start node, so
// simulate having 3 coins while still at start (as if a prior,
// separately-tested decision had already spent most of the budget).
const lowBalanceAtStart = { ...startMission(MISSION), resources: { coins: 3 } };
const afterUnaffordable = decide(MISSION, lowBalanceAtStart, "expensive", 5);
check("an unaffordable choice (requires 8, has 3) is a complete no-op", afterUnaffordable, lowBalanceAtStart);

// --- unknown choice id / unknown state are safely no-ops ---
const afterUnknownChoice = decide(MISSION, startMission(MISSION), "does-not-exist");
check("an unknown choiceId is a no-op", afterUnknownChoice, startMission(MISSION));

// --- a normal (non-breaching) forced expense just applies the cost ---
let normalPath = startMission(MISSION);
normalPath = decide(MISSION, normalPath, "cheap", 1); // 10 -> 8, at mid
const afterNormalExpense = decide(MISSION, normalPath, "forced-expense", 2); // 8 - 5 = 3, no breach
check("a forced expense that stays above the floor just applies the cost", afterNormalExpense.resources, { coins: 3 });
check("staying above the floor leads straight to the terminal node, not recovery", afterNormalExpense.currentNodeId, "end");

// --- resource floor breach redirects to the recovery node ---
// Simulate having already spent down to 2 coins and being at 'mid' -
// the next forced expense (-5) would breach the floor of 0.
const lowerStart = { ...startMission(MISSION), resources: { coins: 2 }, currentNodeId: "mid" };
const afterForcedExpense = decide(MISSION, lowerStart, "forced-expense", 3); // 2 - 5 = -3, breaches floor 0
check("a floor breach redirects to the recovery node", afterForcedExpense.currentNodeId, "recovery");
check("a floor breach sets status to recovering", afterForcedExpense.status, "recovering");
check("a floor breach still applies the resource change (balance can go negative internally)", afterForcedExpense.resources, {
  coins: -3,
});

// --- requestRecovery: always available, never costs anything, never "punished" in history ---
const recoveredState = requestRecovery(MISSION, lowerStart, 4);
check("requestRecovery moves to the recovery node", recoveredState.currentNodeId, "recovery");
check("requestRecovery does not change resources", recoveredState.resources, lowerStart.resources);
check("requestRecovery sets status to recovering", recoveredState.status, "recovering");
check("requestRecovery is recorded with the __recovery__ marker, not a real choice id", recoveredState.history.at(-1)?.choiceId, "__recovery__");

// --- a choice taken FROM the recovery node must resolve as authored,
// even if it leaves a resource still below the floor - otherwise a
// "reorganise and carry on with what's left" choice (no resource
// change) would bounce straight back to recovery forever. ---
const stillNegativeButMovingOn = decide(MISSION, afterForcedExpense, "carry-on", 4.5); // afterForcedExpense is -3 coins, on 'recovery'; "carry-on" makes no resource change at all
check("carry-on leaves the balance unchanged", stillNegativeButMovingOn.resources, { coins: -3 });
check(
  "a recovery-node choice always honors its own nextNodeId, even while still below the floor - never re-redirects to recovery",
  stillNegativeButMovingOn.currentNodeId,
  "end"
);

// --- recovering from the recovery node with a top-up, then reaching the terminal node ---
const recoveredAndToppedUp = decide(MISSION, afterForcedExpense, "top-up", 5);
check("the recovery node's choice tops up resources", recoveredAndToppedUp.resources, { coins: 2 });
check("reaching the terminal node (zero choices) marks the mission completed", recoveredAndToppedUp.status, "completed");
check("the terminal node has no further choices", availableChoices(MISSION, recoveredAndToppedUp), []);

// --- decide() on an already-completed mission is a no-op ---
const afterCompletion = decide(MISSION, recoveredAndToppedUp, "top-up", 6);
check("deciding again after completion is a no-op", afterCompletion, recoveredAndToppedUp);

// --- delayed effects land on the step they're due, not before ---
let delayedState = startMission(MISSION);
delayedState = decide(MISSION, delayedState, "delayed-cost", 1); // schedules coins:-3 due at step 2, at 'mid' with 10 coins still
check("a delayed effect does not apply on the step it's scheduled", delayedState.resources, { coins: 10 });
check("a delayed effect is tracked as pending", delayedState.pendingEffects, [{ dueAtStep: 2, effect: { coins: -3 } }]);
const afterDelayedLands = decide(MISSION, delayedState, "free-choice", 2); // step 2 - the delayed effect should now land
check("the delayed effect lands on its due step", afterDelayedLands.resources, { coins: 7 });
check("a landed delayed effect is cleared from pending", afterDelayedLands.pendingEffects, []);

// --- availableChoices reports affordability without mutating anything ---
const lowBalanceChoices = availableChoices(MISSION, lowBalanceAtStart);
checkTrue("cheap is affordable at 3 coins", lowBalanceChoices.find((c) => c.id === "cheap")!.affordable);
checkTrue("expensive is NOT affordable at 3 coins", !lowBalanceChoices.find((c) => c.id === "expensive")!.affordable);
check("availableChoices did not mutate lowBalanceAtStart", lowBalanceAtStart.resources, { coins: 3 });

// --- previewChoice matches decide() exactly but the caller just discards it ---
const previewed = previewChoice(MISSION, startMission(MISSION), "cheap", 1);
const decided = decide(MISSION, startMission(MISSION), "cheap", 1);
check("previewChoice produces the exact same result as decide()", previewed, decided);

// --- resetMission / replay ---
let played = decide(MISSION, startMission(MISSION), "expensive", 1);
check("played state differs from a fresh one", played.resources, { coins: 2 });
const replayed = resetMission(MISSION);
check("resetMission always returns to the untouched starting state, regardless of prior play", replayed, startMission(MISSION));

// --- validateMission catches authoring mistakes ---
check("validateMission finds no errors on the well-formed test mission", validateMission(MISSION), []);
const brokenMission: MissionDefinition = {
  ...MISSION,
  startNodeId: "does-not-exist",
  recoveryNodeId: "also-missing",
  nodes: {
    ...MISSION.nodes,
    start: {
      id: "start",
      choices: [{ id: "cheap", consequence: { immediate: {}, nextNodeId: "nowhere", outcomeTag: "cheap" } }],
    },
  },
};
const brokenErrors = validateMission(brokenMission);
checkTrue("validateMission flags a bad startNodeId", brokenErrors.some((e) => e.message.includes("startNodeId")));
checkTrue("validateMission flags a bad recoveryNodeId", brokenErrors.some((e) => e.message.includes("recoveryNodeId")));
checkTrue(
  "validateMission flags a choice's bad nextNodeId",
  brokenErrors.some((e) => e.choiceId === "cheap" && e.message.includes("nextNodeId"))
);

console.log(failures === 0 ? "\n✅ All Agency engine tests passed." : `\n❌ ${failures} Agency engine test(s) failed.`);
process.exit(failures === 0 ? 0 : 1);
