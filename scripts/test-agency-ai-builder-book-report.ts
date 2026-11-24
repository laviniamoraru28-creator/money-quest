/** Run with: npx tsx scripts/test-agency-ai-builder-book-report.ts
 * Walks the AI Quest / Builder pilot mission: the careful path
 * reaching all four decisions, the breach that skips the privacy
 * question entirely, and that `privacyScore` is tracked independently
 * of `projectQuality`. */
import { decide, startMission, validateMission } from "../src/lib/agency/engine";
import { AI_BUILDER_BOOK_REPORT } from "../src/lib/agency/missions/ai-builder-book-report";
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

const def = AI_BUILDER_BOOK_REPORT;

check("the mission is structurally well-formed", validateMission(def), []);
check("getMission finds it by id", getMission(def.id)?.id, def.id);
check("it tracks a second resource beyond project quality", "privacyScore" in def.startingResources, true);
for (const [nodeId, node] of Object.entries(def.nodes)) {
  checkTrue(`node "${nodeId}" offers at most 3 choices (has ${node.choices.length})`, node.choices.length <= 3);
}

// --- Careful path: improve the draft, verify the fact, keep info private, review with an adult ---
let careful = startMission(def);
careful = decide(def, careful, "add-your-own-ideas", 1); // 12 -> 20
careful = decide(def, careful, "look-it-up", 2); // 20 -> 25
check("the careful path reaches the privacy question - the risky path below never does", careful.currentNodeId, "personal-info");
careful = decide(def, careful, "keep-it-private", 3); // privacy 10 -> 15
careful = decide(def, careful, "review-with-an-adult", 4); // quality 25 -> 32
check("the careful path tracks both resources independently", careful.resources, { projectQuality: 32, privacyScore: 15 });
check("it completes normally", careful.status, "completed");

// --- Risky path: use the draft as-is, then trust the deliberately wrong fact - breaches before privacy is ever asked ---
let risky = startMission(def);
risky = decide(def, risky, "use-as-is", 1); // 12 -> 7
risky = decide(def, risky, "trust-it", 2); // 7 -> -3
check("using the draft unedited and trusting the wrong fact together breach the floor", risky.resources, {
  projectQuality: -3,
  privacyScore: 10,
});
check("the breach redirects to recovery - the privacy and final-review questions are never reached", risky.currentNodeId, "recovery");
checkTrue("privacyScore is untouched by a projectQuality breach - the two resources are genuinely independent", risky.resources.privacyScore === 10);

const recovered = decide(def, risky, "ask-for-help", 3);
check("asking for help restores project quality without touching privacy", recovered.resources, {
  projectQuality: 7,
  privacyScore: 10,
});
check("the mission reaches a real completion after recovering", recovered.status, "completed");

console.log(
  failures === 0 ? "\n✅ All AI Quest Builder pilot mission tests passed." : `\n❌ ${failures} AI Quest Builder pilot mission test(s) failed.`
);
process.exit(failures === 0 ? 0 : 1);
