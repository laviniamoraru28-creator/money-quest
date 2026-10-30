/**
 * The single place the list of supported languages is defined. Every
 * other piece of the i18n system (middleware, navigation helpers,
 * language selector, messages/ files, sitemap generation) reads from
 * this file — adding language #10 means adding one entry here plus one
 * messages/<code>.json file, never touching routing or component code.
 */
export const LOCALES = ["en", "ro", "es", "fr", "de", "it", "pt", "nl", "pl"] as const;
export type Locale = (typeof LOCALES)[number];

/** Regional conventions shared by optional narration, dates and number formatting. */
export const REGIONAL_LOCALES: Record<Locale,string> = {
  en:"en-GB",ro:"ro-RO",es:"es-ES",fr:"fr-FR",de:"de-DE",
  it:"it-IT",pt:"pt-PT",nl:"nl-NL",pl:"pl-PL"
};

export const DEFAULT_LOCALE = "en" as const;

/**
 * Legacy name: these locales require complete messages/*.json key coverage.
 * This is not a declaration that all website content is translated or that
 * prose has received linguistic, native-speaker or professional review.
 * New authored content, hardcoded UI, SEO and PDFs are tracked separately.
 * ACTIVE_LOCALES below remains the public activation gate.
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

/** The next public release must offer all nine languages, per the owner's decision.
 * Keep the current installation gate until check:multilingual confirms readiness.
 * A selector alone must not activate routes whose authored content would throw.
 */
export const PLANNED_LAUNCH_LOCALES = LOCALES;
/** Current released installation. New multilingual packaging is blocked until ready. */
export const ACTIVE_LOCALES = ["en"] as const;
