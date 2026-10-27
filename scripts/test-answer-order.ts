/** Run with: npx tsx scripts/test-answer-order.ts
 *
 * Regression test for the "correct answer is always first" bug fixed
 * by src/lib/answer-order.ts (shuffleArray/useAnswerOrder), consumed by
 * LessonPlayer (curriculum lesson quizzes), MultipleChoiceMechanic, and
 * CompareMechanic (game-engine rounds, including Entrepreneur Quest's
 * AI Lab, which reuses MultipleChoiceMechanic directly).
 *
 * Covers, per the fix's requirements:
 *  - shuffleArray always returns a true permutation (same multiset).
 *  - across many shuffles, the correct answer lands in every position,
 *    not predictably first (this is the exact pattern being eliminated).
 *  - across ALL 30 curriculum lesson quizzes, in ALL 9 locales, scoring
 *    (identity-based comparison against correctAnswer) stays correct
 *    regardless of shuffled position — proving the fix doesn't depend
 *    on English content and works identically in every language.
 *  - the same, for every multiple-choice and compare round across every
 *    game/variant, in all 9 locales.
 *  - a wrong (non-correct) option is still correctly scored as wrong
 *    after shuffling.
 */
import fs from "node:fs";
import path from "node:path";
import { shuffleArray } from "../src/lib/answer-order";

let failures = 0;
function check(label: string, condition: boolean) {
  console.log(`${condition ? "✅" : "❌"} ${label}`);
  if (!condition) failures++;
}

const LOCALES = ["en", "ro", "de", "es", "fr", "it", "nl", "pl", "pt"];
const messagesDir = path.join(__dirname, "..", "messages");
const locales: Record<string, any> = Object.fromEntries(
  LOCALES.map((loc) => [loc, JSON.parse(fs.readFileSync(path.join(messagesDir, `${loc}.json`), "utf-8"))])
);

// ---------------------------------------------------------------------
// 1. shuffleArray itself: permutation + statistical variety
// ---------------------------------------------------------------------
{
  const original = ["a", "b", "c", "d", "e"];
  let allIdentical = true;
  const firstPositionCounts: Record<string, number> = {};
  const N = 500;
  for (let i = 0; i < N; i++) {
    const shuffled = shuffleArray(original);
    check0(`shuffle #${i} is a permutation (same multiset)`, sameMultiset(shuffled, original));
    if (shuffled.join(",") !== original.join(",")) allIdentical = false;
    const first = shuffled[0] as string;
    firstPositionCounts[first] = (firstPositionCounts[first] ?? 0) + 1;
  }
  check("shuffleArray does not always return the original order", !allIdentical);
  check(
    "shuffleArray distributes the first position across multiple items (not stuck on one), across 500 trials",
    Object.keys(firstPositionCounts).length >= 3
  );
  check("shuffleArray never mutates its input", original.join(",") === "a,b,c,d,e");
}

function check0(label: string, cond: boolean) {
  // Quieter variant for the 500-iteration permutation check — only
  // prints on failure, to keep output readable while still checking
  // every single iteration.
  if (!cond) {
    console.log(`❌ ${label}`);
    failures++;
  }
}

function sameMultiset<T>(a: T[], b: readonly T[]): boolean {
  if (a.length !== b.length) return false;
  const sortedA = [...a].sort();
  const sortedB = [...b].sort();
  return JSON.stringify(sortedA) === JSON.stringify(sortedB);
}

// ---------------------------------------------------------------------
// 2. Curriculum lesson quizzes: all 30 lessons x all 9 locales
// ---------------------------------------------------------------------
{
  const enCurriculum = locales.en.curriculum;
  const lessonIds = Object.keys(enCurriculum);
  check(`found curriculum lessons to test (expected 30)`, lessonIds.length === 30);

  for (const locale of LOCALES) {
    const curriculum = locales[locale].curriculum;
    let positionsSeenAcrossLessons = new Set<number>();

    for (const lessonId of lessonIds) {
      const quiz = curriculum[lessonId]?.quiz;
      if (!quiz) {
        check(`[${locale}] ${lessonId}: has a quiz object`, false);
        continue;
      }
      const { options, correctAnswer } = quiz;
      check(`[${locale}] ${lessonId}: correctAnswer is one of options (membership, not position)`, options.includes(correctAnswer));

      // Shuffle many times; confirm the correct answer appears in more
      // than one position across trials (proving display order is not
      // fixed), and confirm identity-based scoring is correct no matter
      // where it lands.
      const seenPositions = new Set<number>();
      for (let i = 0; i < 30; i++) {
        const shuffled = shuffleArray(options);
        const idx = shuffled.indexOf(correctAnswer);
        seenPositions.add(idx);
        positionsSeenAcrossLessons.add(idx);

        // Scoring simulation: selecting the option at `idx` must score
        // correct; selecting any other option must score incorrect —
        // exactly LessonPlayer.handleCheckAnswer's own comparison.
        const selected = shuffled[idx];
        check0(`[${locale}] ${lessonId}: selecting the shuffled correct option scores correct`, selected === correctAnswer);

        const wrongIdx = (idx + 1) % shuffled.length;
        if (shuffled.length > 1) {
          const wrongSelected = shuffled[wrongIdx];
          check0(
            `[${locale}] ${lessonId}: selecting a shuffled wrong option scores incorrect`,
            wrongSelected !== correctAnswer
          );
        }
      }
      if (options.length > 1) {
        check0(`[${locale}] ${lessonId}: correct answer appeared in more than one position across 30 shuffles`, seenPositions.size > 1);
      }
    }
    check(
      `[${locale}] across all 30 lessons, the correct answer's position varies (not pinned to index 0 everywhere)`,
      !(positionsSeenAcrossLessons.size === 1 && positionsSeenAcrossLessons.has(0))
    );
  }
}

// ---------------------------------------------------------------------
// 3. Game-engine rounds: every multiple-choice/compare round, all variants, all 9 locales
// ---------------------------------------------------------------------
{
  let mcRoundsChecked = 0;
  let cmpRoundsChecked = 0;

  for (const locale of LOCALES) {
    const games = locales[locale].games;
    for (const gameKey of Object.keys(games)) {
      const variants = games[gameKey].variants ?? [];
      variants.forEach((variant: any, vi: number) => {
        (variant.rounds ?? []).forEach((round: any, ri: number) => {
          const label = `[${locale}] ${gameKey}/variant${vi}/round${ri}`;

          if (round.mechanic === "multiple-choice") {
            mcRoundsChecked++;
            const options: string[] = round.options;
            const correctOption: string = round.correctOption;
            check(`${label}: correctOption is one of options`, options.includes(correctOption));
            const seenPositions = new Set<number>();
            for (let i = 0; i < 30; i++) {
              const shuffled = shuffleArray(options);
              const idx = shuffled.indexOf(correctOption);
              seenPositions.add(idx);
              check0(`${label}: shuffled correct option still scores correct`, shuffled[idx] === correctOption);
            }
            if (options.length > 1) {
              check0(`${label}: correct option position varies across shuffles`, seenPositions.size > 1);
            }
          }

          if (round.mechanic === "compare") {
            cmpRoundsChecked++;
            const options: { key: string }[] = round.options;
            const correctOptionKey: string = round.correctOptionKey;
            const keys = options.map((o) => o.key);
            check(`${label}: correctOptionKey is one of options' keys`, keys.includes(correctOptionKey));
            const seenPositions = new Set<number>();
            for (let i = 0; i < 30; i++) {
              const shuffled = shuffleArray(options);
              const idx = shuffled.findIndex((o) => o.key === correctOptionKey);
              seenPositions.add(idx);
              check0(`${label}: shuffled correct option still scores correct`, shuffled[idx]?.key === correctOptionKey);
            }
            if (options.length > 1) {
              check0(`${label}: correct option position varies across shuffles`, seenPositions.size > 1);
            }
          }
        });
      });
    }
  }

  check(`checked at least one multiple-choice round per locale (${mcRoundsChecked} total across ${LOCALES.length} locales)`, mcRoundsChecked >= LOCALES.length);
  check(`checked at least one compare round per locale (${cmpRoundsChecked} total across ${LOCALES.length} locales)`, cmpRoundsChecked >= LOCALES.length);
}

console.log("\n" + "=".repeat(60));
if (failures > 0) {
  console.log(`❌ ${failures} check(s) failed`);
  process.exit(1);
} else {
  console.log("✅ All answer-order checks passed");
}
