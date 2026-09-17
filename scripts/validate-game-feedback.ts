/**
 * Run with: npx tsx scripts/validate-game-feedback.ts
 * Intended for CI and pre-merge checks on any PR that touches
 * src/game-engine/configs/ — fails the build if any game's feedback
 * copy matches a banned shaming pattern.
 */
import { ALL_GAMES } from "../src/game-engine/all-games";
import { validateGameFeedback } from "../src/game-engine/feedback-guard";

let hasErrors = false;

for (const game of ALL_GAMES) {
  const result = validateGameFeedback(game);
  if (result.errors.length > 0) {
    hasErrors = true;
    console.error(`\n❌ ${result.gameKey}:`);
    result.errors.forEach((e) => console.error(`   ERROR: ${e}`));
  }
  if (result.warnings.length > 0) {
    console.warn(`\n⚠️  ${result.gameKey}:`);
    result.warnings.forEach((w) => console.warn(`   WARNING: ${w}`));
  }
}

if (!hasErrors) {
  console.log(`\n✅ All ${ALL_GAMES.length} games passed feedback validation — no banned shaming patterns found.`);
}

process.exit(hasErrors ? 1 : 0);
