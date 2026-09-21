import type { CompanyStructure } from "./types";

/**
 * A small set of entirely fictional companies used only to teach
 * investing concepts through a deterministic simulation. No real
 * company, ticker, or market is referenced anywhere in this file.
 * Prices are plain integers treated as "minor units" of whichever
 * currency the child's wallet already uses (see types.ts's own
 * comment on CompanyStructure) — there is no real-world price to
 * match, so the same numbers work whether displayed as pounds, lei,
 * or yen.
 *
 * Risk profiles map to volatility in engine.ts: "lower" (steadier,
 * more defensive-feeling sectors), "medium", and "higher" (more
 * hit-driven, swingier sectors) - deliberately spread across sectors
 * so the Diversification panel has something real to show, not three
 * companies that all move together.
 */
export const FICTIONAL_COMPANIES: CompanyStructure[] = [
  {
    id: "sunbeam-energy",
    symbol: "SUNB",
    sector: "renewableEnergy",
    riskProfile: "medium",
    basePriceMinorUnits: 4000,
    dailyDriftBps: 3,
    volatilityBps: 110,
    events: [
      { id: "sunbeam-breakthrough", dayIndex: 300, sentiment: "positive" },
      { id: "sunbeam-supply-problem", dayIndex: 1100, sentiment: "negative" },
    ],
  },
  {
    id: "pixel-quest-games",
    symbol: "PXLQ",
    sector: "games",
    riskProfile: "higher",
    basePriceMinorUnits: 1500,
    dailyDriftBps: 2,
    volatilityBps: 170,
    events: [
      { id: "pixelquest-hit-launch", dayIndex: 500, sentiment: "positive" },
      { id: "pixelquest-disappointing-reviews", dayIndex: 1300, sentiment: "negative" },
    ],
  },
  {
    id: "green-bite-foods",
    symbol: "GBIT",
    sector: "healthyFood",
    riskProfile: "lower",
    basePriceMinorUnits: 6000,
    dailyDriftBps: 4,
    volatilityBps: 70,
    events: [
      { id: "greenbite-positive-response", dayIndex: 650, sentiment: "positive" },
      { id: "greenbite-supply-problem", dayIndex: 1500, sentiment: "negative" },
    ],
  },
  {
    id: "skyline-transit",
    symbol: "SKYT",
    sector: "transport",
    riskProfile: "medium",
    basePriceMinorUnits: 3000,
    dailyDriftBps: 2,
    volatilityBps: 100,
    events: [
      { id: "skyline-fewer-passengers", dayIndex: 400, sentiment: "negative" },
      { id: "skyline-strong-pass-sales", dayIndex: 1200, sentiment: "positive" },
    ],
  },
  {
    id: "nimbus-tech",
    symbol: "NMBS",
    sector: "technology",
    riskProfile: "higher",
    basePriceMinorUnits: 2000,
    dailyDriftBps: 5,
    volatilityBps: 160,
    events: [
      { id: "nimbus-new-gadget", dayIndex: 800, sentiment: "positive" },
      { id: "nimbus-technical-problem", dayIndex: 1600, sentiment: "negative" },
    ],
  },
  {
    id: "wildwood-nature-co",
    symbol: "WILD",
    sector: "natureAndEnvironment",
    riskProfile: "lower",
    basePriceMinorUnits: 5000,
    dailyDriftBps: 3,
    volatilityBps: 75,
    events: [
      { id: "wildwood-discovery", dayIndex: 900, sentiment: "positive" },
      { id: "wildwood-slow-season", dayIndex: 1700, sentiment: "negative" },
    ],
  },
];

export function getCompanyById(companyId: string): CompanyStructure | undefined {
  return FICTIONAL_COMPANIES.find((c) => c.id === companyId);
}

/** The starting virtual cash every fresh Investing Lab portfolio gets —
 * a clear, round number, always shown through formatCurrency() so it
 * reads correctly in whatever currency the child's wallet uses. */
export const STARTING_CASH_MINOR_UNITS = 100_000;
