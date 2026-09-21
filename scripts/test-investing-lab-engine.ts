/** Run with: npx tsx scripts/test-investing-lab-engine.ts
 *
 * Exercises the Investing Lab's pure simulation engine: buying,
 * selling, holdings/gain-loss math, portfolio value, deterministic
 * price generation (repeatable across calls - no randomness, no
 * clock), diversification allocation, and defensive localStorage
 * parsing. Nothing here touches the DOM or localStorage directly -
 * see src/investing-lab/use-investing-lab.ts for the one place that
 * does, which this script deliberately does not need to import.
 */
import {
  buyShares,
  createInitialPortfolio,
  generatePriceSeries,
  getAllocationBreakdown,
  getCurrentPrice,
  getHoldingGainLoss,
  getPortfolioValue,
  getSeriesForPeriod,
  sanitizePortfolioState,
  sellShares,
  computeTimeMachineResult,
  TODAY_INDEX,
} from "../src/investing-lab/engine";
import { FICTIONAL_COMPANIES, STARTING_CASH_MINOR_UNITS, getCompanyById } from "../src/investing-lab/structures";

let failures = 0;
function check(label: string, actual: unknown, expected: unknown) {
  const pass = JSON.stringify(actual) === JSON.stringify(expected);
  console.log(`${pass ? "✅" : "❌"} ${label}: got ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)}`);
  if (!pass) failures++;
}
function checkTrue(label: string, condition: boolean) {
  console.log(`${condition ? "✅" : "❌"} ${label}`);
  if (!condition) failures++;
}

// --- Initial portfolio state ---
const initial = createInitialPortfolio();
check("Initial cash equals the starting cash constant", initial.cashMinorUnits, STARTING_CASH_MINOR_UNITS);
check("Initial holdings is empty", initial.holdings, {});
check("Initial transactions is empty", initial.transactions, []);
check("Initial watchlist is empty", initial.watchlist, []);

// --- Buying shares ---
const sunbeam = getCompanyById("sunbeam-energy")!;
const buy1 = buyShares(initial, sunbeam.id, 5, 4000, 1_000);
checkTrue("Buying affordable shares succeeds (no error)", buy1.error === undefined);
check("Cash decreases by exactly the cost", buy1.state.cashMinorUnits, STARTING_CASH_MINOR_UNITS - 5 * 4000);
check("Holding is created with the right share count", buy1.state.holdings[sunbeam.id]?.shares, 5);
check("Holding's totalCostMinorUnits matches the purchase", buy1.state.holdings[sunbeam.id]?.totalCostMinorUnits, 5 * 4000);
check("One buy transaction is recorded", buy1.state.transactions.length, 1);

// Buying more of the same company averages into the existing holding
const buy2 = buyShares(buy1.state, sunbeam.id, 5, 5000, 2_000);
check("A second buy adds to the existing share count", buy2.state.holdings[sunbeam.id]?.shares, 10);
check("A second buy adds to totalCostMinorUnits (weighted average basis)", buy2.state.holdings[sunbeam.id]?.totalCostMinorUnits, 5 * 4000 + 5 * 5000);

// --- Insufficient cash ---
const tooExpensive = buyShares(initial, sunbeam.id, 1_000_000, 4000, 3_000);
check("Buying more than affordable is rejected", tooExpensive.error, "insufficientCash");
check("A rejected buy leaves state unchanged", tooExpensive.state, initial);

check("Buying zero shares is rejected", buyShares(initial, sunbeam.id, 0, 4000, 3_000).error, "invalidShares");
check("Buying a fractional share count is rejected", buyShares(initial, sunbeam.id, 1.5, 4000, 3_000).error, "invalidShares");

// --- Selling shares ---
const sell1 = sellShares(buy2.state, sunbeam.id, 4, 4500, 4_000);
checkTrue("Selling held shares succeeds (no error)", sell1.error === undefined);
check("Cash increases by the sale proceeds", sell1.state.cashMinorUnits, buy2.state.cashMinorUnits + 4 * 4500);
check("Remaining share count is reduced correctly", sell1.state.holdings[sunbeam.id]?.shares, 6);

const sellAll = sellShares(buy2.state, sunbeam.id, 10, 4500, 5_000);
checkTrue("Selling every share removes the holding entirely", sellAll.state.holdings[sunbeam.id] === undefined);

// --- Insufficient holdings ---
check("Selling shares never bought is rejected", sellShares(initial, sunbeam.id, 1, 4000, 6_000).error, "insufficientShares");
check("Selling more shares than held is rejected", sellShares(buy1.state, sunbeam.id, 999, 4000, 6_000).error, "insufficientShares");
check("A rejected sell leaves state unchanged", sellShares(buy1.state, sunbeam.id, 999, 4000, 6_000).state, buy1.state);

// --- Portfolio value ---
const priceLookup = (companyId: string) => (companyId === sunbeam.id ? 4500 : 0);
check("Portfolio value is cash plus holdings at current price", getPortfolioValue(buy1.state, priceLookup), buy1.state.cashMinorUnits + 5 * 4500);
check("An all-cash portfolio's value equals its cash", getPortfolioValue(initial, priceLookup), initial.cashMinorUnits);

// --- Gain/loss calculation ---
const gain = getHoldingGainLoss({ companyId: sunbeam.id, shares: 5, totalCostMinorUnits: 5 * 4000 }, 4800);
check("Gain/loss absolute value is current value minus cost", gain.absoluteMinorUnits, 5 * 4800 - 5 * 4000);
check("Gain/loss percent is correct", gain.percent, ((5 * 4800 - 5 * 4000) / (5 * 4000)) * 100);

const loss = getHoldingGainLoss({ companyId: sunbeam.id, shares: 5, totalCostMinorUnits: 5 * 4000 }, 3600);
checkTrue("A price drop below cost produces a negative gain/loss", loss.absoluteMinorUnits < 0);

// --- Deterministic price generation ---
const seriesA = generatePriceSeries(sunbeam);
const seriesB = generatePriceSeries(sunbeam);
check("Two calls to generatePriceSeries for the same company produce identical series", seriesA, seriesB);
check("The price series covers every simulated day", seriesA.length, TODAY_INDEX + 1);
check("Day 0's price is exactly the company's base price", seriesA[0]?.priceMinorUnits, sunbeam.basePriceMinorUnits);
checkTrue("Every generated price stays a positive integer", seriesA.every((p) => Number.isInteger(p.priceMinorUnits) && p.priceMinorUnits > 0));

let allCompaniesDeterministic = true;
for (const company of FICTIONAL_COMPANIES) {
  const s1 = generatePriceSeries(company);
  const s2 = generatePriceSeries(company);
  if (JSON.stringify(s1) !== JSON.stringify(s2)) allCompaniesDeterministic = false;
}
checkTrue("Every fictional company's price series is deterministic across calls", allCompaniesDeterministic);

let differentCompaniesDiffer = true;
const pixelSeries = generatePriceSeries(getCompanyById("pixel-quest-games")!);
if (JSON.stringify(pixelSeries) === JSON.stringify(seriesA)) differentCompaniesDiffer = false;
checkTrue("Different companies produce different price series", differentCompaniesDiffer);

check("getCurrentPrice returns the last point's price", getCurrentPrice(seriesA), seriesA[seriesA.length - 1]?.priceMinorUnits);

const oneWeek = getSeriesForPeriod(sunbeam, seriesA, "1W");
checkTrue("A 1W period returns at most 7 points", oneWeek.length <= 7);
const fiveYear = getSeriesForPeriod(sunbeam, seriesA, "5Y");
checkTrue("A 5Y period is downsampled to a manageable chart size", fiveYear.length <= 61);
const oneDay = getSeriesForPeriod(sunbeam, seriesA, "1D");
check("A 1D period's final point matches today's real price", oneDay[oneDay.length - 1]?.priceMinorUnits, getCurrentPrice(seriesA));

const timeMachineResult = computeTimeMachineResult(seriesA, 100_000, 365);
checkTrue("Time Machine result uses whole shares only", Number.isInteger(timeMachineResult.shares));
check("Time Machine's current value uses today's real price", timeMachineResult.currentPriceMinorUnits, getCurrentPrice(seriesA));

// --- Diversification / allocation calculations ---
const diversified = buyShares(initial, sunbeam.id, 5, 4000, 1).state;
const allocation = getAllocationBreakdown(diversified, () => 4000, FICTIONAL_COMPANIES);
const totalPercent = allocation.reduce((sum, a) => sum + a.percentOfPortfolio, 0);
checkTrue("Allocation percentages sum to (approximately) 100%", Math.abs(totalPercent - 100) < 0.01);
const cashEntry = allocation.find((a) => a.companyId === "cash");
checkTrue("Allocation includes a cash entry for uninvested money", cashEntry !== undefined);
const sunbeamEntry = allocation.find((a) => a.companyId === sunbeam.id);
check("Allocation tags each holding with its real sector", sunbeamEntry?.sector, sunbeam.sector);

const allCashAllocation = getAllocationBreakdown(initial, () => 0, FICTIONAL_COMPANIES);
check("An all-cash portfolio allocates 100% to cash", allCashAllocation.find((a) => a.companyId === "cash")?.percentOfPortfolio, 100);

// --- localStorage state validation ---
check("sanitizePortfolioState(undefined) falls back to a clean default state", sanitizePortfolioState(undefined), createInitialPortfolio());
check("sanitizePortfolioState(null) falls back to a clean default state", sanitizePortfolioState(null), createInitialPortfolio());
check("sanitizePortfolioState('not an object') falls back to a clean default state", sanitizePortfolioState("garbage"), createInitialPortfolio());
check("sanitizePortfolioState({}) falls back to a clean default state", sanitizePortfolioState({}), createInitialPortfolio());

const corrupt = {
  cashMinorUnits: "not a number",
  holdings: { [sunbeam.id]: { companyId: sunbeam.id, shares: -3, totalCostMinorUnits: 100 } },
  transactions: [{ id: "ok", companyId: sunbeam.id, type: "buy", shares: 1, pricePerShareMinorUnits: 100, totalMinorUnits: 100, timestamp: 1 }, "not a transaction"],
  watchlist: ["real-id", 42],
};
const sanitized = sanitizePortfolioState(corrupt);
check("A non-numeric cash value falls back to the default starting cash", sanitized.cashMinorUnits, STARTING_CASH_MINOR_UNITS);
check("An invalid holding (negative shares) is dropped entirely", sanitized.holdings, {});
check("A malformed transaction entry is filtered out, valid ones kept", sanitized.transactions.length, 1);
check("A non-string watchlist entry is filtered out", sanitized.watchlist, ["real-id"]);

const valid = {
  cashMinorUnits: 5000,
  holdings: { [sunbeam.id]: { companyId: sunbeam.id, shares: 3, totalCostMinorUnits: 12000 } },
  transactions: [],
  watchlist: [sunbeam.id],
};
check("A fully valid saved state round-trips unchanged", sanitizePortfolioState(valid), valid);

console.log(failures === 0 ? "\n✅ All Investing Lab engine checks passed." : `\n❌ ${failures} check(s) failed.`);
process.exit(failures === 0 ? 0 : 1);
