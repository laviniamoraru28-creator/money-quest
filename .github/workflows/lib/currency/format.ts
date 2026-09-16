import { CURRENCY_BY_CODE, type CurrencyOption } from "@/data/currencies";

/**
 * The ONLY function in this codebase allowed to turn a raw amount into a
 * currency-formatted display string. Every Wallet balance, Shop price,
 * Savings Goal figure, and game/quiz amount must go through this — never
 * string-concatenate a symbol onto a number anywhere else.
 *
 * `uiLocale` and `currencyCode` are two fully independent parameters —
 * this is the direct implementation of the brief's "language and
 * currency must be completely independent" requirement. A Romanian
 * child with a GBP wallet calls formatCurrency(amount, "GBP", "ro") and
 * gets Romanian number-formatting conventions applied to a GBP amount
 * (e.g. "1.234,50 GBP"), not GBP's own "native" en-GB conventions
 * ("£1,234.50") — both are valid outputs for the exact same underlying
 * amount and currency, depending purely on which language is selected.
 *
 * This delegates directly to Intl.NumberFormat's built-in `currency`
 * style rather than hand-rolling symbol placement/spacing (an earlier
 * version of this function did that, before locale was a real axis) —
 * the native implementation already encodes, via ICU/CLDR data, exactly
 * which locales show a symbol vs. an ISO code, where it goes, and how
 * to space it, for every locale/currency combination. Hand-rolling that
 * matrix ourselves would be re-deriving data that already exists and is
 * more likely to be correct upstream.
 *
 * Amounts are always passed in as MINOR UNITS (integer pence/cents/yen —
 * see money-quest-currency-architecture.md Section 4.1) to avoid
 * floating-point rounding bugs, and converted to major units only here,
 * right before display. minorUnitDigits still comes from our own
 * centralized currency config (src/data/currencies.ts), not from
 * Intl's separate internal currency database, so there is exactly one
 * source of truth for "how many decimal places does this currency have"
 * across the whole app, per the currency architecture's Principle 1.
 */
export function formatCurrency(amountMinorUnits: number, currencyCode: string, uiLocale: string): string {
  const currency = CURRENCY_BY_CODE[currencyCode];
  if (!currency) {
    throw new Error(`Unknown currency code: ${currencyCode}. Check src/data/currencies.ts.`);
  }

  const majorAmount =
    currency.minorUnitDigits > 0
      ? amountMinorUnits / 10 ** currency.minorUnitDigits
      : amountMinorUnits;

  // See CurrencyOption.useLiteralSymbol's doc comment: for a currency
  // whose Intl.NumberFormat "currency" style never renders the
  // child-friendly form (verified for RON — it always shows the literal
  // "RON" code, never "lei", in every locale tested), format just the
  // number through Intl (still fully locale-aware — decimal/thousands
  // separators still follow uiLocale) and attach our own symbol text.
  if (currency.useLiteralSymbol) {
    const numberPart = new Intl.NumberFormat(uiLocale, {
      minimumFractionDigits: currency.minorUnitDigits,
      maximumFractionDigits: currency.minorUnitDigits,
    }).format(majorAmount);
    return currency.symbolPosition === "before" ? `${currency.symbol} ${numberPart}` : `${numberPart} ${currency.symbol}`;
  }

  return new Intl.NumberFormat(uiLocale, {
    style: "currency",
    currency: currencyCode,
    minimumFractionDigits: currency.minorUnitDigits,
    maximumFractionDigits: currency.minorUnitDigits,
  }).format(majorAmount);
}

/** Converts a major-unit amount (e.g. "4.50" typed by a parent) into the
 * integer minor-unit form the database stores, respecting each currency's
 * own decimal precision (0 for JPY, 2 for the rest). Locale-independent
 * by design — this is a data-entry parsing concern, not a display
 * concern, so it deliberately does NOT take a uiLocale parameter. */
export function toMinorUnits(majorAmount: number, currencyCode: string): number {
  const currency = CURRENCY_BY_CODE[currencyCode];
  if (!currency) {
    throw new Error(`Unknown currency code: ${currencyCode}`);
  }
  return Math.round(majorAmount * 10 ** currency.minorUnitDigits);
}

export function getCurrencyOption(currencyCode: string): CurrencyOption {
  const currency = CURRENCY_BY_CODE[currencyCode];
  if (!currency) {
    throw new Error(`Unknown currency code: ${currencyCode}`);
  }
  return currency;
}
