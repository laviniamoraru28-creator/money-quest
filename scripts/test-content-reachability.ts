/** Run with: npx tsx scripts/test-content-reachability.ts
 *
 * Found missing during the final pre-launch audit: nothing verified
 * that every world/level combination actually has content reachable
 * from the UI — `getWorldCatalog()` could silently return an empty
 * array for a real combination a child could navigate to and nothing
 * would catch it until a person found the dead end by hand.
 */
import { WORLDS } from "../src/content/worlds";
import { getWorldCatalog } from "../src/content/catalog";
import { GAME_STRUCTURES } from "../src/game-engine/structures";
import { LESSON_STRUCTURES } from "../src/content/curriculum/structures";
import type { AgeBand } from "../src/types/database.types";

// getWorldCatalog needs a translator to resolve lesson titles (see its
// own comment) — this script only checks structural reachability
// (counts, world-id validity), not title text, so an identity
// function is a correct, honest stand-in here, not a workaround.
const fakeT = (key: string) => key;

let failures = 0;
function check(label: string, condition: boolean) {
  console.log(`${condition ? "✅" : "❌"} ${label}`);
  if (!condition) failures++;
}

const BANDS: AgeBand[] = ["explorer", "builder", "strategist"];

const emptyCombos: string[] = [];
let totalLessonsReachable = 0;

for (const world of WORLDS) {
  for (const band of BANDS) {
    const catalog = getWorldCatalog(world.id, band, fakeT);
    totalLessonsReachable += catalog.filter((c) => c.activityType === "lesson").length;
    if (catalog.length === 0) emptyCombos.push(`${world.id}/${band}`);
  }
}

check(`Every one of the ${WORLDS.length * BANDS.length} world/level combinations has at least one reachable activity`, emptyCombos.length === 0);
if (emptyCombos.length > 0) console.log("   Empty combos:", emptyCombos.join(", "));

check(`Every one of the ${LESSON_STRUCTURES.length} authored lessons is reachable through some world/level catalog`, totalLessonsReachable === LESSON_STRUCTURES.length);

const worldIds = new Set(WORLDS.map((w) => w.id));
let allGameWorldsValid = true;
for (const game of GAME_STRUCTURES) {
  if (!worldIds.has(game.worldId)) {
    console.log(`   ❌ game "${game.key}" references non-existent world "${game.worldId}"`);
    allGameWorldsValid = false;
  }
}
check("Every game config references a real world id", allGameWorldsValid);

let allLessonWorldsValid = true;
for (const lesson of LESSON_STRUCTURES) {
  if (!worldIds.has(lesson.worldId)) {
    console.log(`   ❌ lesson "${lesson.id}" references non-existent world "${lesson.worldId}"`);
    allLessonWorldsValid = false;
  }
}
check("Every lesson references a real world id", allLessonWorldsValid);

console.log(failures === 0 ? "\n✅ All content reachability checks passed." : `\n❌ ${failures} check(s) failed.`);
process.exit(failures === 0 ? 0 : 1);
