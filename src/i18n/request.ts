import { getRequestConfig } from "next-intl/server";
import { notFound } from "next/navigation";
import { LOCALES, DEFAULT_LOCALE, isSupportedLocale } from "./config";

/**
 * Fallback chain (brief requirement 16):
 *   1. Try the requested locale's message file.
 *   2. For any KEY missing within that file, next-intl's own
 *      `getMessageFallback`/onError below substitutes the English value
 *      for that one key — never the raw key, and never blocks the rest
 *      of the page from rendering in the requested language.
 *   3. Missing keys are logged (dev only) via the onError hook.
 * This is a per-KEY fallback, not a per-PAGE fallback — a Romanian page
 * with one untranslated string still shows 99% Romanian, not 100%
 * English, which is what makes an incomplete language usable rather
 * than unusable.
 */
export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  // TEMPORARY DIAGNOSTIC LOGGING — unconditional (NOT gated behind the
  // NODE_ENV check below, unlike onError's dev-only warning), since
  // this needs to be visible on the live production deployment to
  // diagnose the /ro-renders-English issue. Remove once resolved.
  console.log("[LOCALE-DIAG] request.ts: raw requestLocale from next-intl:", requested);
  const locale = requested && isSupportedLocale(requested) ? requested : DEFAULT_LOCALE;
  console.log("[LOCALE-DIAG] request.ts: final resolved locale:", locale);

  if (!LOCALES.includes(locale as (typeof LOCALES)[number])) {
    notFound();
  }

  const messages = (await import(`../../messages/${locale}.json`)).default;
  const englishMessages =
    locale === DEFAULT_LOCALE ? messages : (await import(`../../messages/en.json`)).default;

  return {
    locale,
    messages,
    onError(error) {
      if (process.env.NODE_ENV !== "production") {
        // eslint-disable-next-line no-console
        console.warn(`[i18n] ${error.message}`);
      }
      // In production we swallow the warning (still fall back below) —
      // a missing translation should never crash or blank a page for a
      // real family using the product.
    },
    getMessageFallback({ namespace, key, error }) {
      void error;
      const path = namespace ? `${namespace}.${key}` : key;
      const fallbackValue = getNestedValue(englishMessages, path);
      if (fallbackValue !== undefined) return fallbackValue;
      // Absolute last resort — should be unreachable if en.json is kept
      // complete (validated by scripts/validate-translations.ts), but
      // this still reads better to a family than a bracketed key name.
      return "…";
    },
  };
});

function getNestedValue(obj: unknown, path: string): string | undefined {
  const parts = path.split(".");
  let current: unknown = obj;
  for (const part of parts) {
    if (typeof current !== "object" || current === null) return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return typeof current === "string" ? current : undefined;
}
