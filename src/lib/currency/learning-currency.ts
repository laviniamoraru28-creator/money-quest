import { getCurrencyOption } from "@/lib/currency/format";
import type { Locale } from "@/i18n/config";

/**
 * The one source of truth for which currency a fictional Explorer/learning
 * activity uses for each website locale (brief Section 3's required
 * mapping). This is a DIFFERENT axis from a child's actual wallet currency
 * (see formatCurrency()'s own doc comment in ./format.ts): this map is the
 * simple "home country" assumption used only for lesson/game amounts, and
 * is the single place that assumption is declared — no component should
 * redeclare it. Do not assume language always determines country; this is
 * an explicit, reviewable mapping precisely so additional regional
 * settings (e.g. a future en-US / en-CA split) can be added here later
 * without touching every lesson component that reads it.
 */
export const LOCALE_LEARNING_CURRENCY: Record<Locale, string> = {
  en: "GBP",
  ro: "RON",
  es: "EUR",
  fr: "EUR",
  de: "EUR",
  it: "EUR",
  pt: "EUR",
  nl: "EUR",
  pl: "PLN",
};

/**
 * Whole-unit display for pre-reader lesson amounts (e.g. "£3", "3 lei") —
 * these activities work in simple denominations a 6-8-year-old counts
 * directly (1, 2, 5, 10...), not fractional minor units, so this
 * deliberately does not route through formatCurrency()'s decimal/minor-unit
 * logic. It still reuses the single centralized symbol/position table in
 * src/data/currencies.ts rather than hand-rolling a per-component map.
 */
export function learningAmount(value: number, locale: Locale): string {
  const currency = getCurrencyOption(LOCALE_LEARNING_CURRENCY[locale]);
  const symbol = locale === "ro" && value === 1 ? "leu" : currency.symbol;
  return currency.symbolPosition === "before" ? `${symbol}${value}` : `${value} ${symbol}`;
}
