/** Run with: npx tsx scripts/validate-lesson-content.ts
 *
 * Checks the actual authored lesson content against the brief's
 * explicit content rules — not just that fields are present, but real
 * content-quality checks found necessary while auditing the 3 lessons
 * that existed before this work: those had literally templated,
 * copy-pasted quiz explanations. This script's templated-text check
 * exists specifically so that exact failure mode can never ship again
 * unnoticed.
 *
 * Reads from messages/en.json's `curriculum` namespace (the single
 * source of truth as of the full-translation pass — see
 * docs/full-translation-status.md) combined with the structural
 * registry, reconstructing the same shape the old ALL_LESSONS export
 * provided so the checks below didn't need rewriting.
 */
import fs from "node:fs";
import path from "node:path";
import { LESSON_STRUCTURES } from "../src/content/curriculum/structures";
import type { AgeBand } from "../src/types/database.types";

const en = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "messages", "en.json"), "utf-8"));

const ALL_LESSONS = LESSON_STRUCTURES.map((s) => ({
  ...s,
  ...en.curriculum[s.id],
  quiz: { ...en.curriculum[s.id].quiz, correctAnswer: en.curriculum[s.id].quiz.correctAnswer },
}));

let failures = 0;
function check(label: string, condition: boolean) {
  if (!condition) {
    console.log(`❌ ${label}`);
    failures++;
  }
}
function pass(label: string) {
  console.log(`✅ ${label}`);
}

const REQUIRED_TOPICS = [
  "money_basics",
  "needs_wants",
  "saving",
  "currencies",
  "scams",
  "long_term_thinking",
  "giving",
  "digital_money",
  "investing_basics",
  "junior_isa",
];
const AGE_BANDS: AgeBand[] = ["explorer", "builder", "strategist"];

// --- Coverage: every topic has all 3 age bands ---
let coverageOk = true;
for (const topic of REQUIRED_TOPICS) {
  for (const band of AGE_BANDS) {
    const found = ALL_LESSONS.some((l) => l.topicId === topic && l.ageBand === band);
    if (!found) {
      console.log(`   ❌ missing: ${topic} / ${band}`);
      coverageOk = false;
    }
  }
}
check(`All ${REQUIRED_TOPICS.length} topics have all 3 age bands (${REQUIRED_TOPICS.length * 3} lessons expected)`, coverageOk);
check(`Exactly ${REQUIRED_TOPICS.length * 3} lessons exist in total`, ALL_LESSONS.length === REQUIRED_TOPICS.length * 3);
if (coverageOk) pass(`Full ${REQUIRED_TOPICS.length}-topic x 3-age-band coverage confirmed`);

// --- No duplicate ids ---
const ids = ALL_LESSONS.map((l) => l.id);
check("No duplicate lesson ids", new Set(ids).size === ids.length);

// --- Every one of the brief's 11 required parts is present and non-empty ---
let allFieldsPresent = true;
for (const lesson of ALL_LESSONS) {
  const requiredStrings: [string, string][] = [
    ["title", lesson.title],
    ["shortIntroduction", lesson.shortIntroduction],
    ["learningObjective", lesson.learningObjective],
    ["story", lesson.story],
    ["interactiveActivity", lesson.interactiveActivity],
    ["gameIdea", lesson.gameIdea],
    ["challenge", lesson.challenge],
    ["feedback.success", lesson.feedback.success],
    ["feedback.retry", lesson.feedback.retry],
    ["rewardMessage", lesson.rewardMessage],
    ["parentNote", lesson.parentNote],
  ];
  for (const [field, value] of requiredStrings) {
    if (!value || value.trim().length < 10) {
      console.log(`   ❌ ${lesson.id}: ${field} is missing or too short`);
      allFieldsPresent = false;
    }
  }
  if (!lesson.quiz.question || lesson.quiz.options.length < 3 || !lesson.quiz.correctAnswer || !lesson.quiz.explanation) {
    console.log(`   ❌ ${lesson.id}: quiz is incomplete`);
    allFieldsPresent = false;
  }
  if (!lesson.quiz.options.includes(lesson.quiz.correctAnswer)) {
    console.log(`   ❌ ${lesson.id}: quiz correctAnswer is not one of its own options`);
    allFieldsPresent = false;
  }
}
check("Every lesson has all 11 required parts, non-trivially filled in", allFieldsPresent);

// --- The exact templated-text bug that motivated this validator, checked directly ---
const TEMPLATED_PHRASE = /based on the concept covered in this activity/i;
let noTemplatedText = true;
for (const lesson of ALL_LESSONS) {
  if (TEMPLATED_PHRASE.test(lesson.quiz.explanation)) {
    console.log(`   ❌ ${lesson.id}: quiz explanation still uses the old templated phrasing`);
    noTemplatedText = false;
  }
}
check("No quiz explanation uses the old auto-generated template phrase", noTemplatedText);

// --- Every quiz explanation is genuinely distinct (a cheaper proxy for "not templated": no two lessons share an identical explanation) ---
const explanations = ALL_LESSONS.map((l) => l.quiz.explanation);
check("No two lessons share an identical quiz explanation", new Set(explanations).size === explanations.length);

// --- Never shame a child for a decision — check retry feedback specifically ---
const SHAMING_PATTERNS = [/wrong answer/i, /that's incorrect/i, /you failed/i, /bad choice/i, /you should have/i, /\bsilly\b/i, /you didn't (get|understand|know|listen|try)/i];
let noShaming = true;
for (const lesson of ALL_LESSONS) {
  for (const pattern of SHAMING_PATTERNS) {
    if (pattern.test(lesson.feedback.retry) || pattern.test(lesson.feedback.success)) {
      console.log(`   ❌ ${lesson.id}: feedback text matches a shaming pattern (${pattern})`);
      noShaming = false;
    }
  }
}
check("No feedback text uses a shaming pattern", noShaming);

// --- No UK-only institution names outside a UK-specific context ---
// junior_isa is the one topic that IS explicitly, deliberately UK-specific
// (see Stage 3A's Junior ISA content and its countryVariesNote field) —
// every other topic must still stay currency/country-neutral.
const UK_ONLY_TERMS = [/\bISA\b/, /premium bonds/i, /\bHMRC\b/, /national insurance/i, /\bNS&I\b/];
let noUkOnlyTerms = true;
for (const lesson of ALL_LESSONS) {
  if (lesson.topicId === "junior_isa") continue;
  const allText = [lesson.explanation, lesson.story, lesson.keyConcept, lesson.parentNote].join(" ");
  for (const pattern of UK_ONLY_TERMS) {
    if (pattern.test(allText)) {
      console.log(`   ❌ ${lesson.id}: references a UK-only term (${pattern}) without being a UK-specific lesson`);
      noUkOnlyTerms = false;
    }
  }
}
check("No lesson outside junior_isa references a UK-only financial institution or scheme", noUkOnlyTerms);

// --- Currency neutrality: no hardcoded currency symbols in narrative text ---
// Same junior_isa exemption: its whole point is a UK-specific, £-denominated
// annual allowance figure, explicitly labelled as the current tax year's
// figure rather than a universal one (see Stage 3A's Part D content).
const CURRENCY_SYMBOLS = /[£$€¥]/;
let noHardcodedSymbols = true;
for (const lesson of ALL_LESSONS) {
  if (lesson.topicId === "junior_isa") continue;
  const narrativeText = [lesson.story, lesson.explanation, lesson.shortIntroduction].join(" ");
  if (CURRENCY_SYMBOLS.test(narrativeText)) {
    console.log(`   ❌ ${lesson.id}: narrative text contains a hardcoded currency symbol`);
    noHardcodedSymbols = false;
  }
}
check("No lesson outside junior_isa hardcodes a specific currency symbol (uses 'coins' instead)", noHardcodedSymbols);

// --- Reading-level sanity: explorer sentences should be noticeably shorter than strategist ---
function avgSentenceWordCount(text: string): number {
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  const totalWords = sentences.reduce((sum, s) => sum + s.trim().split(/\s+/).length, 0);
  return sentences.length > 0 ? totalWords / sentences.length : 0;
}

let readingLevelOk = true;
for (const topic of REQUIRED_TOPICS) {
  const explorer = ALL_LESSONS.find((l) => l.topicId === topic && l.ageBand === "explorer");
  const strategist = ALL_LESSONS.find((l) => l.topicId === topic && l.ageBand === "strategist");
  if (explorer && strategist) {
    const explorerAvg = avgSentenceWordCount(explorer.explanation + " " + explorer.story);
    const strategistAvg = avgSentenceWordCount(strategist.explanation + " " + strategist.story);
    if (explorerAvg >= strategistAvg) {
      console.log(`   ❌ ${topic}: explorer avg sentence length (${explorerAvg.toFixed(1)}) is not shorter than strategist's (${strategistAvg.toFixed(1)})`);
      readingLevelOk = false;
    }
  }
}
check("Explorer-band sentences are measurably shorter than strategist-band sentences, topic by topic", readingLevelOk);

// --- No personal financial advice phrasing ---
const ADVICE_PATTERNS = [/you should invest/i, /you should buy/i, /we recommend (buying|investing)/i, /the best (bank|investment|stock)/i];
let noAdvice = true;
for (const lesson of ALL_LESSONS) {
  const allText = Object.values(lesson).join(" ");
  for (const pattern of ADVICE_PATTERNS) {
    if (pattern.test(allText)) {
      console.log(`   ❌ ${lesson.id}: contains phrasing resembling personal financial advice (${pattern})`);
      noAdvice = false;
    }
  }
}
check("No lesson contains phrasing resembling personal financial advice", noAdvice);

console.log(failures === 0 ? "\n✅ All lesson content checks passed." : `\n❌ ${failures} check(s) failed.`);
process.exit(failures === 0 ? 0 : 1);
