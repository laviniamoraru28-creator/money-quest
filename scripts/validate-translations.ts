/**
 * Run with: npx tsx scripts/validate-translations.ts
 *
 * Checks every locale file's key coverage against messages/en.json (the
 * structural source of truth). Locales listed in FULLY_TRANSLATED_LOCALES
 * (currently en, ro) must have 100% coverage — a missing key there is a
 * build-failing error, since the brief requires Romanian to be a
 * complete, first-class language, not "whatever happens to be there."
 * Every other locale is allowed partial coverage (reported as info, not
 * an error) — those keys fall back to English at runtime per
 * src/i18n/request.ts, which is the intended, working behaviour for a
 * language still being professionally translated, not a bug to fix here.
 */
import fs from "node:fs";
import path from "node:path";
import { LOCALES, FULLY_TRANSLATED_LOCALES, DEFAULT_LOCALE } from "../src/i18n/config";

function flattenKeys(obj: unknown, prefix = ""): string[] {
  if (typeof obj !== "object" || obj === null) return [prefix];
  return Object.entries(obj).flatMap(([key, value]) =>
    flattenKeys(value, prefix ? `${prefix}.${key}` : key)
  );
}

function loadLocale(locale: string): Record<string, unknown> {
  const filePath = path.join(__dirname, "..", "messages", `${locale}.json`);
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

const englishKeys = new Set(flattenKeys(loadLocale(DEFAULT_LOCALE)));
console.log(`English (source of truth): ${englishKeys.size} keys\n`);

let hasErrors = false;

for (const locale of LOCALES) {
  if (locale === DEFAULT_LOCALE) continue;

  const localeKeys = new Set(flattenKeys(loadLocale(locale)));
  const missing = [...englishKeys].filter((k) => !localeKeys.has(k));
  const extra = [...localeKeys].filter((k) => !englishKeys.has(k));
  const coverage = (((englishKeys.size - missing.length) / englishKeys.size) * 100).toFixed(0);

  const isFullyTranslatedLocale = (FULLY_TRANSLATED_LOCALES as string[]).includes(locale);
  const label = isFullyTranslatedLocale ? "FIRST-CLASS (must be 100%)" : "partial (falls back to English)";

  console.log(`${locale} — ${label} — ${coverage}% coverage (${missing.length} missing of ${englishKeys.size})`);

  if (extra.length > 0) {
    console.log(`  ⚠️  ${extra.length} key(s) exist in ${locale}.json but not in en.json (likely a typo): ${extra.slice(0, 5).join(", ")}${extra.length > 5 ? "…" : ""}`);
  }

  if (isFullyTranslatedLocale && missing.length > 0) {
    hasErrors = true;
    console.log(`  ❌ ERROR: ${locale} is listed as fully-translated but is missing ${missing.length} key(s):`);
    missing.slice(0, 15).forEach((k) => console.log(`      - ${k}`));
    if (missing.length > 15) console.log(`      … and ${missing.length - 15} more`);
  } else if (missing.length > 0) {
    console.log(`  ℹ️  Missing keys will show in English until professionally translated.`);
  }
  console.log("");
}

console.log(hasErrors ? "❌ Translation validation FAILED." : "✅ Translation validation passed.");
process.exit(hasErrors ? 1 : 0);
