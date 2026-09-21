import type {
  AllocationEntry,
  BuyResult,
  CompanyStructure,
  Holding,
  PortfolioState,
  PricePoint,
  SellResult,
  TimeMachineResult,
  TimePeriod,
  Transaction,
} from "./types";
import { STARTING_CASH_MINOR_UNITS } from "./structures";

/**
 * The Investing Lab's simulation engine. Every function here is pure —
 * same inputs always produce the same output, nothing reads the clock,
 * `Math.random()`, or any external data source. That's deliberate, not
 * incidental: this is a children's education feature, not a market
 * feed, so the simulation must be stable across refreshes, fully
 * unit-testable (see scripts/test-investing-lab-engine.ts), and never
 * dependent on anything resembling a real market.
 */

/** Five simulated years of daily prices per company. "Today" is always
 * the LAST index of this fixed-length array (TODAY_INDEX below) —
 * there is no dependency on the real calendar date anywhere in this
 * file, which is exactly what makes the whole simulation reproducible. */
export const TOTAL_SIMULATED_DAYS = 1825;
export const TODAY_INDEX = TOTAL_SIMULATED_DAYS - 1;

const EVENT_PRICE_IMPACT = 0.08; // a single fictional event nudges price by +/-8%, layered on top of that day's ordinary walk

/** A small, deterministic hash — same approach already used elsewhere
 * in this codebase for reproducible pseudo-randomness (see
 * MatchMechanic.tsx's shuffleDeterministic) — so a (seed, day) pair
 * always maps to the exact same number, with no shared state between
 * calls. */
function hashSeed(text: string): number {
  let hash = 0;
  for (let i = 0; i < text.length; i++) hash = (hash * 31 + text.charCodeAt(i)) >>> 0;
  return hash;
}

/** Maps a hash to a value in [-1, 1) via one step of a simple LCG —
 * good enough spread for a visually plausible fictional chart, with no
 * claim to being cryptographically or statistically rigorous (it
 * doesn't need to be; nothing real depends on this distribution). */
function deterministicNoise(seed: number): number {
  const next = (seed * 1103515245 + 12345) >>> 0;
  return (next / 4294967296) * 2 - 1;
}

function noiseForDay(seedKey: string, dayIndex: number): number {
  return deterministicNoise(hashSeed(`${seedKey}:${dayIndex}`));
}

/**
 * Generates a company's full, fixed 5-year daily price series. Each
 * day applies the company's own small average drift plus deterministic
 * noise scaled by its risk profile's volatility, and — on the specific
 * days a fictional event is scheduled (see structures.ts) — an
 * additional one-off nudge in the event's direction. The result is the
 * same every time this is called for a given company; nothing here
 * varies by wall-clock time.
 */
export function generatePriceSeries(company: CompanyStructure): PricePoint[] {
  const points: PricePoint[] = [{ dayIndex: 0, priceMinorUnits: company.basePriceMinorUnits }];
  const minPrice = Math.max(1, Math.round(company.basePriceMinorUnits * 0.15));
  let price = company.basePriceMinorUnits;

  for (let day = 1; day < TOTAL_SIMULATED_DAYS; day++) {
    const drift = company.dailyDriftBps / 10_000;
    const volatility = company.volatilityBps / 10_000;
    let changeFraction = drift + noiseForDay(company.id, day) * volatility;

    const event = company.events.find((e) => e.dayIndex === day);
    if (event) changeFraction += event.sentiment === "positive" ? EVENT_PRICE_IMPACT : -EVENT_PRICE_IMPACT;

    price = Math.max(minPrice, Math.round(price * (1 + changeFraction)));
    points.push({ dayIndex: day, priceMinorUnits: price });
  }

  return points;
}

export function getCurrentPrice(series: PricePoint[]): number {
  const last = series[series.length - 1];
  return last ? last.priceMinorUnits : 0;
}

const PERIOD_DAY_COUNTS: Partial<Record<TimePeriod, number>> = {
  "1W": 7,
  "1M": 30,
  "3M": 90,
  "1Y": 365,
  "5Y": TOTAL_SIMULATED_DAYS,
};

const MAX_CHART_POINTS = 60;
const INTRADAY_STEPS = 8;

/**
 * Slices (and, for longer periods, downsamples to at most
 * MAX_CHART_POINTS) the full series for one selectable chart period.
 * "1D" is the one period with no real daily granularity to show, so it
 * synthesizes a small, deterministic set of sub-day points walking
 * from yesterday's close to today's close — clearly a simulated
 * illustration, never presented as real intraday data.
 */
export function getSeriesForPeriod(company: CompanyStructure, series: PricePoint[], period: TimePeriod): PricePoint[] {
  if (period === "1D") {
    const todayPrice = getCurrentPrice(series);
    const yesterdayPrice = series[series.length - 2]?.priceMinorUnits ?? todayPrice;
    const swing = Math.max(1, Math.abs(todayPrice - yesterdayPrice));
    const points: PricePoint[] = [];
    for (let step = 0; step <= INTRADAY_STEPS; step++) {
      const t = step / INTRADAY_STEPS;
      if (step === INTRADAY_STEPS) {
        points.push({ dayIndex: TODAY_INDEX, priceMinorUnits: todayPrice });
        continue;
      }
      const base = yesterdayPrice + (todayPrice - yesterdayPrice) * t;
      const wiggle = noiseForDay(`${company.id}:intraday`, step) * swing * 0.15;
      points.push({ dayIndex: TODAY_INDEX - 1 + t, priceMinorUnits: Math.max(1, Math.round(base + wiggle)) });
    }
    return points;
  }

  const days = PERIOD_DAY_COUNTS[period] ?? TOTAL_SIMULATED_DAYS;
  const slice = series.slice(Math.max(0, series.length - days));
  const step = Math.max(1, Math.ceil(slice.length / MAX_CHART_POINTS));

  const sampled: PricePoint[] = [];
  for (let i = 0; i < slice.length; i += step) {
    const point = slice[i];
    if (point) sampled.push(point);
  }
  const last = slice[slice.length - 1];
  if (last && sampled[sampled.length - 1]?.dayIndex !== last.dayIndex) sampled.push(last);
  return sampled;
}

/**
 * "Time Machine": shows what a fixed virtual amount invested
 * `daysAgo` days before today would be worth now, using the same
 * fixed price series everything else reads from. Whole shares only
 * (matching buyShares/sellShares), rounding down — a Time Machine
 * result is illustrative, not a promise of what any real amount would
 * have bought.
 */
export function computeTimeMachineResult(series: PricePoint[], investedAmountMinorUnits: number, daysAgo: number): TimeMachineResult {
  const pastDayIndex = Math.max(0, Math.min(TODAY_INDEX, TODAY_INDEX - daysAgo));
  const pastPriceMinorUnits = series[pastDayIndex]?.priceMinorUnits ?? getCurrentPrice(series);
  const currentPriceMinorUnits = getCurrentPrice(series);
  const shares = pastPriceMinorUnits > 0 ? Math.floor(investedAmountMinorUnits / pastPriceMinorUnits) : 0;
  const pastValueMinorUnits = shares * pastPriceMinorUnits;
  const currentValueMinorUnits = shares * currentPriceMinorUnits;
  const percentChange = pastValueMinorUnits > 0 ? ((currentValueMinorUnits - pastValueMinorUnits) / pastValueMinorUnits) * 100 : 0;

  return { pastDayIndex, pastPriceMinorUnits, currentPriceMinorUnits, shares, pastValueMinorUnits, currentValueMinorUnits, percentChange };
}

// --- Portfolio: buying, selling, holdings, allocation ---

export function createInitialPortfolio(startingCashMinorUnits: number = STARTING_CASH_MINOR_UNITS): PortfolioState {
  return { cashMinorUnits: startingCashMinorUnits, holdings: {}, transactions: [], watchlist: [] };
}

function nextTransactionId(state: PortfolioState, timestamp: number): string {
  return `tx-${timestamp}-${state.transactions.length}`;
}

/** Buys whole shares of one company, deducting cost from cash and
 * either creating a new holding or adding to an existing one (the
 * average purchase price - totalCostMinorUnits / shares - is always
 * derived on demand, never stored directly, so it can't drift out of
 * sync with the two numbers it comes from). `timestamp` is supplied by
 * the caller (Date.now() in the UI, a fixed number in tests) so this
 * function stays fully deterministic. */
export function buyShares(state: PortfolioState, companyId: string, shares: number, pricePerShareMinorUnits: number, timestamp: number): BuyResult {
  if (!Number.isInteger(shares) || shares <= 0) return { state, error: "invalidShares" };

  const totalCostMinorUnits = shares * pricePerShareMinorUnits;
  if (totalCostMinorUnits > state.cashMinorUnits) return { state, error: "insufficientCash" };

  const existing = state.holdings[companyId];
  const holding: Holding = existing
    ? { companyId, shares: existing.shares + shares, totalCostMinorUnits: existing.totalCostMinorUnits + totalCostMinorUnits }
    : { companyId, shares, totalCostMinorUnits };

  const transaction: Transaction = {
    id: nextTransactionId(state, timestamp),
    companyId,
    type: "buy",
    shares,
    pricePerShareMinorUnits,
    totalMinorUnits: totalCostMinorUnits,
    timestamp,
  };

  return {
    state: {
      ...state,
      cashMinorUnits: state.cashMinorUnits - totalCostMinorUnits,
      holdings: { ...state.holdings, [companyId]: holding },
      transactions: [transaction, ...state.transactions],
    },
  };
}

/** Sells whole shares of a held company. Removes the holding entirely
 * once its share count reaches zero, and reduces totalCostMinorUnits
 * proportionally so the average cost basis of any remaining shares is
 * unchanged by the sale. */
export function sellShares(state: PortfolioState, companyId: string, shares: number, pricePerShareMinorUnits: number, timestamp: number): SellResult {
  if (!Number.isInteger(shares) || shares <= 0) return { state, error: "invalidShares" };

  const existing = state.holdings[companyId];
  if (!existing || existing.shares < shares) return { state, error: "insufficientShares" };

  const proceedsMinorUnits = shares * pricePerShareMinorUnits;
  const averageCostPerShare = existing.totalCostMinorUnits / existing.shares;
  const costRemoved = Math.round(averageCostPerShare * shares);
  const remainingShares = existing.shares - shares;

  const holdings = { ...state.holdings };
  if (remainingShares === 0) {
    delete holdings[companyId];
  } else {
    holdings[companyId] = { companyId, shares: remainingShares, totalCostMinorUnits: existing.totalCostMinorUnits - costRemoved };
  }

  const transaction: Transaction = {
    id: nextTransactionId(state, timestamp),
    companyId,
    type: "sell",
    shares,
    pricePerShareMinorUnits,
    totalMinorUnits: proceedsMinorUnits,
    timestamp,
  };

  return {
    state: { ...state, cashMinorUnits: state.cashMinorUnits + proceedsMinorUnits, holdings, transactions: [transaction, ...state.transactions] },
  };
}

export function getHoldingCurrentValue(holding: Holding, currentPriceMinorUnits: number): number {
  return holding.shares * currentPriceMinorUnits;
}

export function getHoldingGainLoss(holding: Holding, currentPriceMinorUnits: number): { absoluteMinorUnits: number; percent: number } {
  const currentValue = getHoldingCurrentValue(holding, currentPriceMinorUnits);
  const absoluteMinorUnits = currentValue - holding.totalCostMinorUnits;
  const percent = holding.totalCostMinorUnits > 0 ? (absoluteMinorUnits / holding.totalCostMinorUnits) * 100 : 0;
  return { absoluteMinorUnits, percent };
}

/** Total simulated portfolio value: cash still uninvested, plus every
 * holding valued at its current fictional price. `priceLookup` keeps
 * this function itself free of any dependency on how prices are
 * generated or cached. */
export function getPortfolioValue(state: PortfolioState, priceLookup: (companyId: string) => number): number {
  const holdingsValue = Object.values(state.holdings).reduce((sum, h) => sum + getHoldingCurrentValue(h, priceLookup(h.companyId)), 0);
  return state.cashMinorUnits + holdingsValue;
}

/**
 * A simple allocation breakdown for the Diversification panel — one
 * entry per held company plus a "cash" entry for whatever isn't
 * invested, each as a percentage of total portfolio value. This is
 * intentionally descriptive, not prescriptive: it exists to show a
 * child what "spread across several things" versus "everything in one
 * place" actually looks like, never to suggest an ideal split to aim
 * for.
 */
export function getAllocationBreakdown(state: PortfolioState, priceLookup: (companyId: string) => number, companies: CompanyStructure[]): AllocationEntry[] {
  const holdingEntries = Object.values(state.holdings).map((h) => {
    const company = companies.find((c) => c.id === h.companyId);
    return { companyId: h.companyId, sector: company?.sector ?? "unknown", valueMinorUnits: getHoldingCurrentValue(h, priceLookup(h.companyId)) };
  });

  const entries = [...holdingEntries, { companyId: "cash", sector: "cash", valueMinorUnits: state.cashMinorUnits }];
  const totalValue = entries.reduce((sum, e) => sum + e.valueMinorUnits, 0);

  return entries.map((e) => ({ ...e, percentOfPortfolio: totalValue > 0 ? (e.valueMinorUnits / totalValue) * 100 : 0 }));
}

export function toggleWatchlist(state: PortfolioState, companyId: string): PortfolioState {
  const isWatched = state.watchlist.includes(companyId);
  return { ...state, watchlist: isWatched ? state.watchlist.filter((id) => id !== companyId) : [...state.watchlist, companyId] };
}

// --- localStorage safety ---

function isValidHolding(value: unknown, expectedKey: string): value is Holding {
  if (typeof value !== "object" || value === null) return false;
  const h = value as Record<string, unknown>;
  return (
    typeof h.companyId === "string" &&
    h.companyId === expectedKey &&
    typeof h.shares === "number" &&
    Number.isFinite(h.shares) &&
    h.shares > 0 &&
    typeof h.totalCostMinorUnits === "number" &&
    Number.isFinite(h.totalCostMinorUnits) &&
    h.totalCostMinorUnits >= 0
  );
}

function isValidTransaction(value: unknown): value is Transaction {
  if (typeof value !== "object" || value === null) return false;
  const t = value as Record<string, unknown>;
  return (
    typeof t.id === "string" &&
    typeof t.companyId === "string" &&
    (t.type === "buy" || t.type === "sell") &&
    typeof t.shares === "number" &&
    typeof t.pricePerShareMinorUnits === "number" &&
    typeof t.totalMinorUnits === "number" &&
    typeof t.timestamp === "number"
  );
}

/**
 * Defensively rebuilds a PortfolioState from whatever JSON.parse
 * handed back from localStorage — which could be missing, from an
 * older/incompatible shape, or (private browsing quirks, manual
 * tampering, a corrupted write) simply not valid at all. Every field
 * is checked independently and falls back to a fresh default rather
 * than letting one bad field take down the whole state, so the app
 * always has a clean, usable portfolio to render.
 */
export function sanitizePortfolioState(raw: unknown): PortfolioState {
  const fallback = createInitialPortfolio();
  if (typeof raw !== "object" || raw === null) return fallback;
  const r = raw as Record<string, unknown>;

  const cashMinorUnits = typeof r.cashMinorUnits === "number" && Number.isFinite(r.cashMinorUnits) && r.cashMinorUnits >= 0 ? r.cashMinorUnits : fallback.cashMinorUnits;

  const holdings: Record<string, Holding> = {};
  if (typeof r.holdings === "object" && r.holdings !== null) {
    for (const [key, value] of Object.entries(r.holdings as Record<string, unknown>)) {
      if (isValidHolding(value, key)) holdings[key] = value;
    }
  }

  const transactions = Array.isArray(r.transactions) ? r.transactions.filter(isValidTransaction) : [];
  const watchlist = Array.isArray(r.watchlist) ? r.watchlist.filter((id): id is string => typeof id === "string") : [];

  return { cashMinorUnits, holdings, transactions, watchlist };
}
