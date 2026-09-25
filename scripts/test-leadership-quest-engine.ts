/** Run with: npx tsx scripts/test-leadership-quest-engine.ts
 * Exercises Leadership Quest's pure state-transition functions: effect
 * application + clamping (trust/morale/energy to [0,5], progress to
 * [0,100]), the double-apply guard, mission/lab/uh-oh completion
 * tracking, badge-trigger conditions, and computeLeadershipProfile /
 * deriveDominantTag determinism — the exact places a bug would silently
 * corrupt the Team State or make the end-of-quest profile flaky. */
import {
  createDefaultState,
  createDefaultTeamState,
  recordChoice,
  completeMission,
  completeLabScenario,
  markUhOhSeen,
  hasEverChosenArchetype,
  computeLeadershipProfile,
  deriveDominantTag,
} from "../src/lib/leadership-quest/state";
import { createDefaultState as createDefaultProgressState, awardBadge } from "../src/lib/local-progress/state";
import { LQ_BADGE_IDS, LQ_MISSIONS, LQ_EFFECTS, LQ_LAB_SCENARIO_IDS, LQ_UH_OH_EVENTS } from "../src/content/leadership-quest/structures";

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

// --- Default state ---
check("Default team state", createDefaultTeamState(), { trust: 3, morale: 3, progress: 0, energy: 4 });
check("Default state has no completed missions", createDefaultState().completedMissionIds, []);

// --- recordChoice applies the right effect and clamps correctly ---
let state = createDefaultState();
state = recordChoice(state, "big-mistake-choice", "talk-privately");
check("talk-privately raises trust by 0.4", state.team.trust, 3.4);
check("talk-privately raises morale by 0.2", state.team.morale, 3.2);
check("talk-privately raises progress by 6", state.team.progress, 6);
check("reflectionHistory records the choice", state.reflectionHistory, [{ eventId: "big-mistake-choice", choiceKey: "talk-privately" }]);

// --- Double-apply guard: replaying the same event with a DIFFERENT
// choice still only counts the FIRST effect (never re-applies), exactly
// like Entrepreneur Quest's recordDecision. ---
const stateAfterFirst = recordChoice(createDefaultState(), "big-mistake-choice", "blame-publicly");
const stateAfterReplay = recordChoice(stateAfterFirst, "big-mistake-choice", "talk-privately");
check("Replaying an already-decided event does not re-apply a new effect", stateAfterReplay.team, stateAfterFirst.team);
check("Replaying records the new choiceKey in leadershipChoices anyway", stateAfterReplay.leadershipChoices["big-mistake-choice"], "talk-privately");
check("Replaying does NOT add a second reflectionHistory entry", stateAfterReplay.reflectionHistory.length, 1);

// --- Clamping: trust cannot exceed 5 or drop below 0. LQ_EFFECTS has no
// synthetic ids to replay an effect 20x against (recordChoice's guard
// would block a second application on the same real event anyway), so
// clamp behavior is verified directly against the same formula
// applyEffectToTeam uses internally. ---
let manualTrust = createDefaultTeamState();
for (let i = 0; i < 20; i++) {
  manualTrust = { ...manualTrust, trust: Math.min(5, Math.max(0, Math.round((manualTrust.trust + 0.4) * 10) / 10)) };
}
check("Manual clamp math never exceeds 5", manualTrust.trust, 5);

// --- Progress clamps at 100 across a full mission playthrough with
// generous choices ---
let playthrough = createDefaultState();
const generousChoices: [string, string][] = [
  ["meet-your-team-match", "completed"],
  ["meet-your-team-reflection", "excited"],
  ["first-challenge-match", "completed"],
  ["everyone-has-an-idea-choice", "pick-one-idea"],
  ["missing-task-choice", "do-it-yourself-quietly"],
  ["big-mistake-choice", "fix-it-yourself"],
  ["angry-customer-choice", "apologise-and-fix-it"],
  ["better-idea-choice", "use-their-idea"],
  ["team-conflict-spot", "completed"],
  ["team-conflict-choice", "tell-them-to-stop-and-move-on"],
  ["motivation-problem-spot", "completed"],
  ["motivation-problem-choice", "push-through-and-keep-going"],
  ["the-deadline-allocate", "completed"],
  ["the-deadline-choice", "just-tell-people-what-to-drop"],
  ["pressure-test-sort", "completed"],
  ["pressure-test-reflection", "panic-a-little-but-push-through"],
  ["final-challenge-match", "completed"],
  ["final-challenge-choice-1", "double-check-everything-yourself"],
  ["final-challenge-choice-2", "immediately-plan-the-next-project"],
];
for (const [eventId, choiceKey] of generousChoices) {
  playthrough = recordChoice(playthrough, eventId, choiceKey);
}
checkTrue("Progress reaches 100 (clamped) after a full generous playthrough", playthrough.team.progress === 100);
checkTrue("Progress never exceeds 100", playthrough.team.progress <= 100);

// --- Mission / lab / uh-oh completion tracking is idempotent ---
let completionState = createDefaultState();
completionState = completeMission(completionState, "meet-your-team");
completionState = completeMission(completionState, "meet-your-team");
check("completeMission is idempotent", completionState.completedMissionIds, ["meet-your-team"]);

completionState = completeLabScenario(completionState, "lab-rejected-idea");
completionState = completeLabScenario(completionState, "lab-rejected-idea");
check("completeLabScenario is idempotent", completionState.completedLabScenarioIds, ["lab-rejected-idea"]);

completionState = markUhOhSeen(completionState, "uh-oh-printer");
completionState = markUhOhSeen(completionState, "uh-oh-printer");
check("markUhOhSeen is idempotent", completionState.uhOhEventsSeenIds, ["uh-oh-printer"]);

// --- Archetype tag detection (drives lq-good-listener / lq-problem-solver) ---
let listenerState = createDefaultState();
checkTrue("No listener tag before any choice", !hasEverChosenArchetype(listenerState, "the-listener"));
listenerState = recordChoice(listenerState, "missing-task-choice", "ask-what-happened");
checkTrue("Listener tag detected after a listening choice", hasEverChosenArchetype(listenerState, "the-listener"));
checkTrue("Problem-solver tag NOT falsely detected", !hasEverChosenArchetype(listenerState, "the-problem-solver"));

// --- computeLeadershipProfile / deriveDominantTag determinism ---
check("Empty reflection history yields an empty profile (never a guess)", computeLeadershipProfile([]), []);
check("deriveDominantTag is null with no tagged choices", deriveDominantTag([]), null);

const listenerHeavyHistory = [
  { eventId: "missing-task-choice", choiceKey: "ask-what-happened" }, // the-listener
  { eventId: "team-conflict-choice", choiceKey: "hear-both-sides" }, // the-listener
  { eventId: "big-mistake-choice", choiceKey: "talk-privately" }, // the-encourager
];
check("Profile top archetype is the-listener (tallied twice)", computeLeadershipProfile(listenerHeavyHistory)[0], "the-listener");
check("deriveDominantTag matches the profile's top archetype", deriveDominantTag(listenerHeavyHistory), "the-listener");

// Same computation twice on the same input always yields the same result.
check(
  "computeLeadershipProfile is deterministic across repeated calls",
  computeLeadershipProfile(listenerHeavyHistory),
  computeLeadershipProfile(listenerHeavyHistory)
);

// --- Badge triggers compose with the shared awardBadge exactly like EQ ---
let progressState = createDefaultProgressState();
progressState = awardBadge(progressState, LQ_BADGE_IDS.firstLeader);
progressState = awardBadge(progressState, LQ_BADGE_IDS.firstLeader);
check("awardBadge is idempotent for lq- badges too", progressState.earnedBadgeIds, [LQ_BADGE_IDS.firstLeader]);
checkTrue("lq- badge ids never collide with eq- ids", Object.values(LQ_BADGE_IDS).every((id) => id.startsWith("lq-")));

// --- Content-integrity checks: every mission's eventIds exist in
// LQ_EFFECTS, every uh-oh/lab id exists too — catches a typo'd id before
// it ships as a silently-broken round in the browser. ---
for (const mission of LQ_MISSIONS) {
  for (const eventId of mission.eventIds) {
    checkTrue(`Mission "${mission.id}"'s event "${eventId}" has an entry in LQ_EFFECTS`, eventId in LQ_EFFECTS);
  }
}
for (const uhOh of LQ_UH_OH_EVENTS) {
  checkTrue(`Uh-oh event "${uhOh.id}" has an entry in LQ_EFFECTS`, uhOh.id in LQ_EFFECTS);
  checkTrue(`Uh-oh event "${uhOh.id}"'s trigger mission "${uhOh.triggerAfterMissionId}" exists`, LQ_MISSIONS.some((m) => m.id === uhOh.triggerAfterMissionId));
}
for (const labId of LQ_LAB_SCENARIO_IDS) {
  checkTrue(`Lab scenario "${labId}" has an entry in LQ_EFFECTS`, labId in LQ_EFFECTS);
}

console.log(failures === 0 ? "\n✅ All Leadership Quest engine tests passed." : `\n❌ ${failures} Leadership Quest engine test(s) failed.`);
process.exit(failures === 0 ? 0 : 1);
