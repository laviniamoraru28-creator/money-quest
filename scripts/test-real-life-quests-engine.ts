/** Run with: npx tsx scripts/test-real-life-quests-engine.ts
 * Exercises Real Life Quests' pure state-transition functions: the
 * start/complete/variant/reflection transitions, the first-completion
 * guard (so re-completing a mission never re-awards XP), and that
 * every one of the 12 missions declared in structures.ts has the exact
 * set of required content fields the brief's section 5 demands — the
 * one place a missing field would otherwise only surface as a blank
 * patch of UI a translator or reviewer might not notice. */
import {
  createDefaultState,
  getMissionProgress,
  startMission,
  setMissionVariant,
  completeMission,
  setReflection,
  countMissionsByStatus,
} from "../src/lib/real-life-quests/state";
import { RLQ_MISSIONS, RLQ_CATEGORIES, getRLQMissionsByCategory, getRLQMissionById } from "../src/content/real-life-quests/structures";
import enMessages from "../messages/en.json";

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
check("Default state has no missions recorded", createDefaultState().missions, {});
check("An unrecorded mission reads as not-started/standard", getMissionProgress(createDefaultState(), "save-for-something-you-love"), {
  status: "not-started",
  variant: "standard",
  reflectionChoice: null,
  reflectionText: "",
});

// --- startMission ---
let state = createDefaultState();
state = startMission(state, "resource-rescue");
check("startMission moves not-started to started", getMissionProgress(state, "resource-rescue").status, "started");
state = startMission(state, "resource-rescue");
check("startMission on an already-started mission is a no-op", getMissionProgress(state, "resource-rescue").status, "started");

// --- completeMission is always available, even without starting first ---
state = createDefaultState();
let result = completeMission(state, "make-something");
check("completeMission works with no prior startMission call", result.wasFirstCompletion, true);
state = result.state;
check("completeMission sets status to completed", getMissionProgress(state, "make-something").status, "completed");

// --- first-completion guard ---
result = completeMission(state, "make-something");
check("completing an already-completed mission is NOT a first completion", result.wasFirstCompletion, false);

// --- setMissionVariant never resets status or reflection ---
state = createDefaultState();
state = startMission(state, "the-price-detective");
state = setReflection(state, "the-price-detective", "great", "It went well!");
state = setMissionVariant(state, "the-price-detective", "simpler");
check(
  "Changing variant preserves status and reflection",
  getMissionProgress(state, "the-price-detective"),
  { status: "started", variant: "simpler", reflectionChoice: "great", reflectionText: "It went well!" }
);

// --- setReflection trims free text and allows clearing the choice ---
state = createDefaultState();
state = setReflection(state, "share-my-idea", "idea", "  has trailing space  ");
check("Reflection text is trimmed", getMissionProgress(state, "share-my-idea").reflectionText, "has trailing space");
state = setReflection(state, "share-my-idea", null, "has trailing space");
check("Reflection choice can be cleared back to null", getMissionProgress(state, "share-my-idea").reflectionChoice, null);

// --- countMissionsByStatus ---
state = createDefaultState();
const allIds = RLQ_MISSIONS.map((m) => m.id);
state = completeMission(state, RLQ_MISSIONS[0]!.id).state;
state = completeMission(state, RLQ_MISSIONS[1]!.id).state;
state = startMission(state, RLQ_MISSIONS[2]!.id);
check("countMissionsByStatus counts completed missions", countMissionsByStatus(state, allIds, "completed"), 2);
check("countMissionsByStatus counts started missions", countMissionsByStatus(state, allIds, "started"), 1);
check(
  "countMissionsByStatus counts not-started missions",
  countMissionsByStatus(state, allIds, "not-started"),
  allIds.length - 3
);

// --- Structural data integrity ---
check("Exactly 12 missions declared", RLQ_MISSIONS.length, 12);
for (const category of RLQ_CATEGORIES) {
  check(`Category "${category}" has exactly 4 missions`, getRLQMissionsByCategory(category).length, 4);
}
checkTrue("Every mission id is unique", new Set(allIds).size === allIds.length);
checkTrue(
  "getRLQMissionById resolves every declared mission",
  allIds.every((id) => getRLQMissionById(id) !== undefined)
);
checkTrue(
  "Every XP reward is a small, positive, flat number (never tied to an outcome)",
  RLQ_MISSIONS.every((m) => m.xpReward > 0 && m.xpReward <= 20)
);

// --- Content completeness: every mission has every required field
// (brief section 5), checked directly against the shipped en.json
// rather than trusting that a content author filled everything in. ---
type RLQMissionMessages = {
  title: string;
  intro: string;
  objectives: string[];
  materials: string[];
  steps: string[];
  durationEstimate: string;
  independentVersion: string;
  simplerVersion: string;
  nonverbalAdaptation: string;
  reflectionPrompt: string;
  parentGuidance: string;
};
const rlqMessages = (enMessages as { realLifeQuests: { missions: Record<string, RLQMissionMessages> } }).realLifeQuests;
const REQUIRED_STRING_FIELDS: (keyof RLQMissionMessages)[] = [
  "title",
  "intro",
  "durationEstimate",
  "independentVersion",
  "simplerVersion",
  "nonverbalAdaptation",
  "reflectionPrompt",
  "parentGuidance",
];
const REQUIRED_ARRAY_FIELDS: (keyof RLQMissionMessages)[] = ["objectives", "materials", "steps"];

for (const mission of RLQ_MISSIONS) {
  const content = rlqMessages.missions[mission.id];
  checkTrue(`${mission.id}: has English content`, content !== undefined);
  if (!content) continue;
  for (const field of REQUIRED_STRING_FIELDS) {
    checkTrue(`${mission.id}.${field} is a non-empty string`, typeof content[field] === "string" && content[field].length > 0);
  }
  for (const field of REQUIRED_ARRAY_FIELDS) {
    const value = content[field];
    checkTrue(`${mission.id}.${field} is a non-empty array`, Array.isArray(value) && value.length > 0);
  }
}

// --- Safety-guidance remediation: verify the 6 missions touched by the
// "Approved Remediation Scope" pass actually carry their required safety
// keyword(s) in English, so a future content edit can't silently drop
// this guidance without a test failing. Each check targets the specific
// field the remediation brief named for that mission (A-F). ---
function includesAny(haystack: string, needles: string[]): boolean {
  const lower = haystack.toLowerCase();
  return needles.some((n) => lower.includes(n.toLowerCase()));
}

{
  const m = rlqMessages.missions["plan-a-shopping-trip"]!;
  checkTrue("A. plan-a-shopping-trip: steps mention never going alone with a trusted adult", includesAny(m.steps.join(" "), ["trusted adult", "never go shopping alone"]));
  checkTrue("A. plan-a-shopping-trip: parentGuidance states a child should never shop alone", includesAny(m.parentGuidance, ["never go shopping alone", "never shop", "trusted adult"]));
}
{
  const m = rlqMessages.missions["the-price-detective"]!;
  checkTrue("B. the-price-detective: materials offer an at-home alternative to a shop visit", includesAny(m.materials.join(" "), ["never required", "already at home"]));
  checkTrue("B. the-price-detective: parentGuidance requires a trusted adult for a real shop visit", includesAny(m.parentGuidance, ["trusted adult"]));
}
{
  const m = rlqMessages.missions["make-something"]!;
  checkTrue("C. make-something: steps require adult help for sharp tools", includesAny(m.steps.join(" "), ["scissors", "sharp"]));
  checkTrue("C. make-something: parentGuidance addresses safe tool use", includesAny(m.parentGuidance, ["sharp", "safely use"]));
}
{
  const m = rlqMessages.missions["my-first-mini-business"]!;
  checkTrue("D. my-first-mini-business: steps mention allergy checks for food", includesAny(m.steps.join(" "), ["allerg"]));
  checkTrue("D. my-first-mini-business: parentGuidance covers allergies, hygiene, and supervision", includesAny(m.parentGuidance, ["allerg"]) && includesAny(m.parentGuidance, ["hygiene"]) && includesAny(m.parentGuidance, ["supervised"]));
  checkTrue("D. my-first-mini-business: a pretend, food-free alternative remains available", includesAny(m.parentGuidance, ["pretend food", "no food involved"]));
}
{
  const m = rlqMessages.missions["make-something-together"]!;
  checkTrue("E. make-something-together: steps mention allergy/hot/sharp checks when cooking", includesAny(m.steps.join(" "), ["allerg"]) && includesAny(m.steps.join(" "), ["hot", "sharp"]));
  checkTrue("E. make-something-together: parentGuidance keeps a non-food alternative available", includesAny(m.parentGuidance, ["puzzle or craft", "no kitchen needed"]));
}
{
  const m = rlqMessages.missions["save-for-something-you-love"]!;
  checkTrue("F. save-for-something-you-love: materials avoid small-coin choking risk for a tracker", includesAny(m.materials.join(" "), ["stickers", "tally"]) && !includesAny(m.materials[1] ?? "", ["coins", "buttons"]));
  checkTrue("F. save-for-something-you-love: parentGuidance warns small coins/buttons are riskier than stickers for younger children", includesAny(m.parentGuidance, ["safer tracker", "small coins"]));
}

console.log(failures === 0 ? "\n✅ All real-life-quests engine checks passed." : `\n❌ ${failures} check(s) failed.`);
if (failures > 0) process.exit(1);
