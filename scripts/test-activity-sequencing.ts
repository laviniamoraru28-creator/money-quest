/** Run with: npx tsx scripts/test-activity-sequencing.ts
 *
 * Verifies getNextActivityInWorld()/getActivityHref() produce a
 * correct, complete chain for every world/age-band combination:
 * starting from the catalog's first entry and following "next"
 * repeatedly visits every entry in that catalog exactly once, in the
 * same order the catalog itself returns, and ends at null exactly on
 * the last entry — never earlier (a false "world complete" before
 * everything is done) and never later (a "Next Activity" button with
 * nowhere real to go). Also checks every generated href resolves to a
 * real, distinct URL.
 */
import { WORLDS } from "../src/content/worlds";
import { getWorldCatalog, getNextActivityInWorld, getPreviousActivityInWorld, getActivityPosition, getActivityHref } from "../src/content/catalog";
import type { AgeBand } from "../src/types/database.types";

const fakeT = (key: string) => key;
const BANDS: AgeBand[] = ["explorer", "builder", "strategist"];

let failures = 0;
function check(label: string, condition: boolean) {
  console.log(`${condition ? "✅" : "❌"} ${label}`);
  if (!condition) failures++;
}

let totalChainsVerified = 0;

for (const world of WORLDS) {
  for (const band of BANDS) {
    const catalog = getWorldCatalog(world.id, band, fakeT);
    if (catalog.length === 0) continue;

    const visitedIds: string[] = [catalog[0]!.id];
    let currentId = catalog[0]!.id;
    for (let i = 0; i < catalog.length + 1; i++) {
      const next = getNextActivityInWorld(world.id, band, currentId, fakeT);
      if (!next) break;
      visitedIds.push(next.id);
      currentId = next.id;
    }

    const expectedIds = catalog.map((e) => e.id);
    const chainMatches = JSON.stringify(visitedIds) === JSON.stringify(expectedIds);
    check(`${world.id}/${band}: next-activity chain visits all ${catalog.length} entries in the correct order`, chainMatches);
    if (!chainMatches) {
      console.log("   expected:", expectedIds);
      console.log("   got:     ", visitedIds);
    }

    const lastEntry = catalog[catalog.length - 1]!;
    const nextAfterLast = getNextActivityInWorld(world.id, band, lastEntry.id, fakeT);
    check(`${world.id}/${band}: last entry (${lastEntry.id}) correctly has no next activity`, nextAfterLast === null);

    let hrefsOk = true;
    for (let i = 0; i < catalog.length - 1; i++) {
      const entry = catalog[i]!;
      const next = getNextActivityInWorld(world.id, band, entry.id, fakeT);
      if (!next) { hrefsOk = false; continue; }
      const href = getActivityHref(world.id, next);
      const expectedPrefix = next.activityType === "lesson" ? `/play/world/${world.id}/lesson/` : `/play/world/${world.id}/game/`;
      if (!href.startsWith(expectedPrefix) || !href.endsWith(next.id)) hrefsOk = false;
      if (href === getActivityHref(world.id, entry)) hrefsOk = false;
    }
    check(`${world.id}/${band}: every non-final entry's next-activity href is well-formed and distinct`, hrefsOk);

    // Walking backward from the last entry with getPreviousActivityInWorld
    // must retrace the exact same chain in reverse — the real guarantee
    // behind the "Back" button always landing on the right activity.
    const visitedBackward: string[] = [lastEntry.id];
    let currentBackId = lastEntry.id;
    for (let i = 0; i < catalog.length + 1; i++) {
      const prev = getPreviousActivityInWorld(world.id, band, currentBackId, fakeT);
      if (!prev) break;
      visitedBackward.push(prev.id);
      currentBackId = prev.id;
    }
    const expectedBackward = [...expectedIds].reverse();
    const backwardMatches = JSON.stringify(visitedBackward) === JSON.stringify(expectedBackward);
    check(`${world.id}/${band}: "Back" chain from the last entry retraces all ${catalog.length} entries in reverse order`, backwardMatches);
    if (!backwardMatches) {
      console.log("   expected:", expectedBackward);
      console.log("   got:     ", visitedBackward);
    }

    const firstEntry = catalog[0]!;
    const prevBeforeFirst = getPreviousActivityInWorld(world.id, band, firstEntry.id, fakeT);
    check(`${world.id}/${band}: first entry (${firstEntry.id}) correctly has no previous activity`, prevBeforeFirst === null);

    // The position indicator must match each entry's real, 1-indexed
    // place in the catalog, and the total must match the catalog length
    // — the guarantee behind "Level 2 · Activity 3 of 6" always being
    // accurate, not just plausible-looking.
    let positionsOk = true;
    catalog.forEach((entry, index) => {
      const pos = getActivityPosition(world.id, band, entry.id, fakeT);
      if (!pos || pos.position !== index + 1 || pos.total !== catalog.length) positionsOk = false;
    });
    check(`${world.id}/${band}: activity position is correct for all ${catalog.length} entries`, positionsOk);

    totalChainsVerified++;
  }
}

const bogus = getNextActivityInWorld("coin-cove", "explorer", "this-id-does-not-exist", fakeT);
check("An unknown current-activity id correctly returns no next activity", bogus === null);

const bogusPrev = getPreviousActivityInWorld("coin-cove", "explorer", "this-id-does-not-exist", fakeT);
check("An unknown current-activity id correctly returns no previous activity", bogusPrev === null);

const bogusPosition = getActivityPosition("coin-cove", "explorer", "this-id-does-not-exist", fakeT);
check("An unknown current-activity id correctly returns no position", bogusPosition === null);

console.log(`\nVerified ${totalChainsVerified} world/age-band chains.`);
console.log(failures === 0 ? "✅ Activity sequencing logic is correct." : `❌ ${failures} problem(s) found.`);
process.exit(failures === 0 ? 0 : 1);
