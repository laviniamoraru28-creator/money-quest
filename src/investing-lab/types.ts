/**
 * The Investing Lab's locale-independent data model. Same split as
 * every other content area in this app (curriculum lessons, games,
 * the Money Life Simulator): structural facts live here and in
 * structures.ts, all translatable prose lives under `investingLab` in
 * messages/*.json — see localized-types.ts for the merge.
 *
 * This is a closed-form, deterministic SIMULATION of fictional
 * companies for teaching investing concepts. There is no real market
 * data, no real company, and no real money anywhere in this module.
 */

export type RiskProfile = "lower" | "medium" | "higher";

/** A scheduled, fictional news event that nudges a company's simulated
 * price on a specific day of its fixed 5-year price history. `sentiment`
 * only sets the DIRECTION of the nudge (see engine.ts) — the actual
 * daily price walk is still driven by the same deterministic
 * day-by-day process every other day uses, so an event reads as "one
 * more input to a noisy process," never as a scripted, unrealistic
 * jump that only ever goes the "right" way. */
export interface CompanyEvent {
  id: string;
  /** Day index into the company's fixed price series (0-1824, see
   * engine.ts's TOTAL_SIMULATED_DAYS) this event lands on. */
  dayIndex: number;
  sentiment: "positive" | "negative";
  /** Key suffix under investingLab.events.<id> for the headline text —
   * kept separate from the structural id since the display text is
   * translated, not structural. */
}

/** The structural (non-translatable) half of a fictional company —
 * combine with LocalizedCompanyText (see localized-types.ts) for the
 * full display shape. Prices are always plain integers treated as
 * "minor units" of whatever currency the child's wallet already uses
 * (see src/lib/currency/format.ts) — there is no real-world price
 * equivalence to preserve, so the same integers work sensibly
 * formatted as pounds, lei, or yen alike. */
export interface CompanyStructure {
  id: string;
  symbol: string;
  sector: string;
  riskProfile: RiskProfile;
  basePriceMinorUnits: number;
  /** Small, deterministic per-company tuning for the price walk — see
   * engine.ts's generatePriceSeries. Not user-facing. */
  dailyDriftBps: number; // basis points (1/100 of a percent) of average daily drift
  volatilityBps: number; // basis points controlling daily noise magnitude
  events: CompanyEvent[];
}

export interface PricePoint {
  dayIndex: number;
  priceMinorUnits: number;
}

export type TimePeriod = "1D" | "1W" | "1M" | "3M" | "1Y" | "5Y";

export interface Holding {
  companyId: string;
  shares: number;
  /** Total amount actually paid for the shares currently held, in
   * minor units — average purchase price is totalCostMinorUnits /
   * shares, computed on demand rather than stored, so it's never out
   * of sync with the two numbers it's derived from. */
  totalCostMinorUnits: number;
}

export type TransactionType = "buy" | "sell";

export interface Transaction {
  id: string;
  companyId: string;
  type: TransactionType;
  shares: number;
  pricePerShareMinorUnits: number;
  totalMinorUnits: number;
  timestamp: number; // Date.now() at the moment of the action - bookkeeping, not part of the price simulation
}

export interface PortfolioState {
  cashMinorUnits: number;
  holdings: Record<string, Holding>;
  transactions: Transaction[];
  watchlist: string[];
}

export interface BuyResult {
  state: PortfolioState;
  error?: "insufficientCash" | "invalidShares";
}

export interface SellResult {
  state: PortfolioState;
  error?: "insufficientShares" | "invalidShares";
}

export interface AllocationEntry {
  companyId: string;
  sector: string;
  valueMinorUnits: number;
  percentOfPortfolio: number;
}

export interface TimeMachineResult {
  pastDayIndex: number;
  pastPriceMinorUnits: number;
  currentPriceMinorUnits: number;
  shares: number;
  pastValueMinorUnits: number;
  currentValueMinorUnits: number;
  percentChange: number;
}
