/** Run with: npx tsx scripts/test-no-english-fallback.ts
 *
 * Complements validate-translations.ts, which checks that every key
 * EXISTS in each locale file — this checks something validate-
 * translations.ts structurally cannot: whether a key's VALUE was
 * actually translated, or is just the English text copied verbatim
 * (which would pass a key-existence check while still showing English
 * to every user of that language). Built for the explicit requirement
 * to "detect unintended English fallback in each supported language."
 *
 * A handful of values are legitimately identical across languages —
 * "Money Quest" (a brand name), a currency amount placeholder, or a
 * short interjection that happens to be a loanword — so exact identity
 * alone isn't proof of an untranslated string. Flagged only when the
 * EN and target strings are identical AND long enough that an
 * accidental identical translation is implausible.
 */
import fs from "node:fs";
import path from "node:path";
import { LOCALES, DEFAULT_LOCALE } from "../src/i18n/config";

const MIN_LENGTH_TO_FLAG = 15;
const ALLOWED_IDENTICAL = new Set([
  "common.moneyQuest", // a brand name, correctly untranslated everywhere
  "landing.copyright", // "© {year} Money Quest" — a symbol, a placeholder, and a brand name; nothing to translate
  // The Investing Lab's fictional company names (src/investing-lab/structures.ts)
  // are brand names by design — kept identical across every locale the same
  // way real company names (and Money Quest's own) are, per the doc comment
  // on LocalizedCompanyText in src/investing-lab/localized-types.ts. Only
  // each company's description is genuinely translated.
  "investingLab.companies.sunbeam-energy.name",
  "investingLab.companies.pixel-quest-games.name",
  "investingLab.companies.green-bite-foods.name",
  "investingLab.companies.skyline-transit.name",
  "investingLab.companies.nimbus-tech.name",
  "investingLab.companies.wildwood-nature-co.name",
  // "Diversification" is spelled and used identically in French — a genuine
  // shared-Latin-root cognate (confirmed, not a lazy English fallback),
  // the same category the doc comment above already carves out for
  // loanwords/interjections.
  "investingLab.diversificationTitle",
  "curriculum.strategist-investing_basics-l1.vocabulary.1.term",
]);

// Structural/technical fields within games.* that must NEVER be
// translated regardless of length — round ids, mechanic types, and
// answer-key references are internal identifiers the game engine
// matches on, not user-facing prose. Same set used by
// validate_one_game.py's per-game structural check; duplicated here
// (rather than imported) since this script also covers non-game
// namespaces where these key names could coincidentally appear as
// real translatable content and shouldn't be blanket-exempted there.
const GAME_STRUCTURAL_KEYS = new Set([
  "id", "key", "mechanic", "correctBucketKey", "correctOptionKey", "categoryKey",
]);

function isGameStructuralPath(key: string): boolean {
  if (!key.startsWith("games.")) return false;
  const lastSegment = key.split(".").pop() ?? "";
  return GAME_STRUCTURAL_KEYS.has(lastSegment);
}

/**
 * Entrepreneur Quest's decisionEvents/challenges choice objects each
 * carry a "key" field (e.g. "explain-simply") that the app matches on
 * to look up a decision's effect (see EQ_DECISION_EFFECTS in
 * src/content/entrepreneur-quest/structures.ts) - an internal id, not
 * user-facing prose, so it's correctly identical to English in every
 * locale, the same principle as GAME_STRUCTURAL_KEYS above.
 */
function isEntrepreneurQuestStructuralPath(key: string): boolean {
  if (!key.startsWith("entrepreneurQuest.decisionEvents.") && !key.startsWith("entrepreneurQuest.challenges.")) return false;
  return key.split(".").pop() === "key";
}

/**
 * A domain name/URL used as in-content example text (e.g. a scam
 * example's fake link) is correctly identical in every language — a
 * URL isn't prose to translate. Matched narrowly (a bare
 * word.tld-shaped string, optionally with a path) so this can't
 * accidentally wave through a genuinely untranslated sentence that
 * merely contains a period.
 */
function looksLikeDomain(value: string): boolean {
  return /^[a-z0-9-]+(\.[a-z0-9-]+)+(\/\S*)?$/i.test(value.trim());
}

function flattenEntries(obj: unknown, prefix = ""): [string, string][] {
  if (typeof obj === "string") return [[prefix, obj]];
  if (typeof obj !== "object" || obj === null) return [];
  return Object.entries(obj).flatMap(([key, value]) => flattenEntries(value, prefix ? `${prefix}.${key}` : key));
}

function loadLocale(locale: string): Record<string, unknown> {
  const filePath = path.join(__dirname, "..", "messages", `${locale}.json`);
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

const englishEntries = new Map(flattenEntries(loadLocale(DEFAULT_LOCALE)));

let failures = 0;
function check(label: string, condition: boolean) {
  console.log(`${condition ? "✅" : "❌"} ${label}`);
  if (!condition) failures++;
}

for (const locale of LOCALES) {
  if (locale === DEFAULT_LOCALE) continue;

  const entries = flattenEntries(loadLocale(locale));
  const suspicious: string[] = [];

  for (const [key, value] of entries) {
    if (ALLOWED_IDENTICAL.has(key)) continue;
    if (isGameStructuralPath(key)) continue;
    if (isEntrepreneurQuestStructuralPath(key)) continue;
    if (looksLikeDomain(value)) continue;
    const englishValue = englishEntries.get(key);
    if (englishValue !== undefined && englishValue === value && value.length >= MIN_LENGTH_TO_FLAG) {
      suspicious.push(key);
    }
  }

  check(`${locale}: no untranslated (English-identical) values of meaningful length`, suspicious.length === 0);
  if (suspicious.length > 0) {
    suspicious.slice(0, 10).forEach((k) => console.log(`   ⚠️  ${locale}.${k} is identical to the English source`));
    if (suspicious.length > 10) console.log(`   … and ${suspicious.length - 10} more`);
  }
}

console.log(failures === 0 ? "\n✅ No unintended English fallback detected in any supported language." : `\n❌ ${failures} locale(s) have untranslated content.`);
process.exit(failures === 0 ? 0 : 1);
