/**
 * Client-safe currency reference data, mirrored from the seeded `currencies`
 * table (supabase/migrations/0003_seed_currencies.sql). This static copy lets
 * the Country/Currency selection onboarding steps render instantly without a
 * database round trip, since this data changes only when a new currency is
 * added (a rare, deliberate event) — but the source of truth is still the
 * database, which is what the rest of the app (Wallet, Shop, etc.) reads from.
 */

export interface CurrencyOption {
  code: string;
  name: string;
  symbol: string;
  symbolPosition: "before" | "after";
  /** This currency's own "native" locale (e.g. GBP's is en-GB) — kept as
   * reference data matching the documented CurrencyConfig schema in
   * money-quest-currency-architecture.md, but NOT used by
   * formatCurrency() for number formatting since multilingual support
   * was added: the UI's own selected locale drives formatting now (see
   * src/lib/currency/format.ts's doc comment), independent of this
   * field. Retained for any future non-formatting use (e.g. a default
   * region hint), not currently read by any formatting code path. */
  locale: string;
  minorUnitDigits: number;
  /** True for currencies where Intl.NumberFormat's own `style: "currency"`
   * output isn't the child-friendly form we want — verified empirically
   * (not assumed) that Intl always renders RON as the literal three-letter
   * code "RON" in every UI locale tested (ro, en, fr, de), never the
   * natural "lei" a Romanian child actually reads and writes. When this
   * flag is set, formatCurrency() builds the display string itself from
   * `symbol` and `symbolPosition` instead of delegating to Intl's
   * currency style — see format.ts. Every other currency here has a
   * real Intl/CLDR symbol mapping and doesn't need this. */
  useLiteralSymbol?: boolean;
}

export const CURRENCIES: CurrencyOption[] = [
  { code: "GBP", name: "British Pound Sterling", symbol: "£", symbolPosition: "before", locale: "en-GB", minorUnitDigits: 2 },
  { code: "USD", name: "US Dollar", symbol: "$", symbolPosition: "before", locale: "en-US", minorUnitDigits: 2 },
  { code: "EUR", name: "Euro", symbol: "€", symbolPosition: "before", locale: "de-DE", minorUnitDigits: 2 },
  { code: "CAD", name: "Canadian Dollar", symbol: "$", symbolPosition: "before", locale: "en-CA", minorUnitDigits: 2 },
  { code: "AUD", name: "Australian Dollar", symbol: "$", symbolPosition: "before", locale: "en-AU", minorUnitDigits: 2 },
  { code: "CHF", name: "Swiss Franc", symbol: "CHF", symbolPosition: "before", locale: "de-CH", minorUnitDigits: 2 },
  { code: "JPY", name: "Japanese Yen", symbol: "¥", symbolPosition: "before", locale: "ja-JP", minorUnitDigits: 0 },
  {
    code: "RON",
    name: "Romanian Leu",
    symbol: "lei",
    symbolPosition: "after",
    locale: "ro-RO",
    minorUnitDigits: 2,
    useLiteralSymbol: true,
  },
];

export const CURRENCY_BY_CODE: Record<string, CurrencyOption> = Object.fromEntries(
  CURRENCIES.map((c) => [c.code, c])
);
