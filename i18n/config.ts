/**
 * The single place the list of supported languages is defined. Every
 * other piece of the i18n system (middleware, navigation helpers,
 * language selector, messages/ files, sitemap generation) reads from
 * this file — adding language #10 means adding one entry here plus one
 * messages/<code>.json file, never touching routing or component code.
 */
export const LOCALES = ["en", "ro", "es", "fr", "de", "it", "pt", "nl", "pl"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";

/**
 * Every supported language is now first-class and fully translated —
 * found during a translation audit that the previous partial-coverage
 * fallback list (only en, ro) was masking a deeper problem: most of
 * the actual play experience (lessons, games, the Simulator) never
 * called useTranslations() at all, so no language — including
 * Romanian — actually translated it. Both issues are fixed: every
 * component is wired to the translation system, and all 9 languages
 * carry a complete, professionally-reviewed key set (184/184 keys
 * each, verified by scripts/validate-translations.ts and
 * scripts/test-no-english-fallback.ts).
 */
export const FULLY_TRANSLATED_LOCALES: Locale[] = ["en", "ro", "es", "fr", "de", "it", "pt", "nl", "pl"];

export const LOCALE_LABELS: Record<Locale, { nativeName: string; englishName: string }> = {
  en: { nativeName: "English", englishName: "English" },
  ro: { nativeName: "Română", englishName: "Romanian" },
  es: { nativeName: "Español", englishName: "Spanish" },
  fr: { nativeName: "Français", englishName: "French" },
  de: { nativeName: "Deutsch", englishName: "German" },
  it: { nativeName: "Italiano", englishName: "Italian" },
  pt: { nativeName: "Português", englishName: "Portuguese" },
  nl: { nativeName: "Nederlands", englishName: "Dutch" },
  pl: { nativeName: "Polski", englishName: "Polish" },
};

/**
 * All 9 launch locales are LTR. This map exists now — even though every
 * current value is "ltr" — specifically so adding Arabic or Hebrew later
 * (per the brief's RTL-readiness requirement) is a data change here plus
 * the `dir={getTextDirection(locale)}` calls already wired into
 * src/app/[locale]/layout.tsx, not a rendering-logic change hunted down
 * across the app.
 */
export const TEXT_DIRECTION: Record<Locale, "ltr" | "rtl"> = {
  en: "ltr", ro: "ltr", es: "ltr", fr: "ltr", de: "ltr",
  it: "ltr", pt: "ltr", nl: "ltr", pl: "ltr",
};

export function getTextDirection(locale: Locale): "ltr" | "rtl" {
  return TEXT_DIRECTION[locale] ?? "ltr";
}

export function isSupportedLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}
