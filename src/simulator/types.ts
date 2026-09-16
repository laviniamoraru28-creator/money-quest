import type { AgeBand } from "@/types/database.types";

export type AllocationCategory = "needs" | "wants" | "savings" | "giving" | "unexpected";

export const ALLOCATION_CATEGORIES: { key: AllocationCategory; labelKey: string }[] = [
  { key: "needs", labelKey: "categories.needs" },
  { key: "wants", labelKey: "categories.wants" },
  { key: "savings", labelKey: "categories.savings" },
  { key: "giving", labelKey: "categories.giving" },
  { key: "unexpected", labelKey: "categories.unexpected" },
];

/**
 * A week's income is a plain number, never a pre-formatted string like
 * "£10" — the scenario content (below) is entirely currency-agnostic.
 * Every place the UI needs to SHOW an amount does so through the same
 * `formatCurrency()` the rest of the app uses, driven by the child's own
 * `currency_code`. This is what makes "You receive £10 this week" and
 * "You receive $20 this week" the same scenario rendered for two
 * different children, not two different pieces of content.
 */
export interface SimWeek {
  id: string;
  weekLabel: string; // "Week 1" — a structural label, not currency-bearing
  incomeMinorUnits: number;
  event?: SimEvent;
}

export type SimEventType = "expense" | "opportunity" | "milestone" | "windfall";

export interface SimEventChoice {
  key: string;
  label: string;
  /** Which allocation category this choice draws its cost from — e.g.
   * buying an on-sale game draws from "wants," a birthday gift draws
   * from "giving." A cost of 0 represents a genuine "skip it" option. */
  category: AllocationCategory;
  costMinorUnits: number;
  /** Shown immediately after the child picks this option — always
   * explains what happens, never evaluates the child themselves. */
  consequence: string;
}

export interface SimEvent {
  id: string;
  type: SimEventType;
  title: string;
  description: string;
  /** 'expense' events: an unavoidable cost, drawn first from that week's
   * "unexpected" allocation, then (if that runs short) from the running
   * balance — the actual lesson behind the "unexpected expenses"
   * category existing at all. */
  costMinorUnits?: number;
  expenseConsequenceCovered?: string; // shown if the "unexpected" buffer fully covered it
  expenseConsequenceShortfall?: string; // shown if it had to dip into savings/balance instead
  /** 'opportunity' events: a genuine choice between 2-3 options. */
  choices?: SimEventChoice[];
  /** 'windfall' events: added directly to that week's spendable income. */
  bonusMinorUnits?: number;
  /** 'milestone' events (e.g. reaching the savings goal): pure
   * celebration, no decision required. The engine independently verifies
   * the goal is actually met before showing this — see engine.ts — so a
   * scenario can never falsely celebrate a goal the child's own choices
   * didn't actually reach. */
  celebrationMessage?: string;
  /** Shown instead of celebrationMessage if the engine's own check finds
   * the goal genuinely isn't met yet — kept honest and encouraging, per
   * the "never shame" requirement, rather than a false celebration. */
  notYetMessage?: string;
}

export interface SimScenario {
  key: string;
  title: string;
  ageBand: AgeBand;
  difficulty: "standard" | "challenge";
  startingBalanceMinorUnits: number;
  savingsGoal: { name: string; targetMinorUnits: number };
  weeks: SimWeek[];
  xpReward: number;
  coinRewardMinorUnits: number;
  estimatedMinutes: number;
}

/** One child's allocation choice for a single week — must sum to that
 * week's total spendable income (base income + any windfall bonus). */
export type WeekAllocation = Record<AllocationCategory, number>;

export interface WeekLogEntry {
  weekLabel: string;
  incomeMinorUnits: number;
  allocation: WeekAllocation;
  eventTitle?: string;
  eventConsequence?: string;
  eventChoiceLabel?: string;
  /** True only when an expense event's cost exceeded that week's
   * "unexpected" buffer and had to be covered from the running balance —
   * tracked as an explicit flag (not inferred by matching consequence
   * text) so the final report's insights are robust to any future
   * wording change in a scenario's consequence strings. */
  hadUnexpectedShortfall?: boolean;
  /** True whenever this week actually had an expense event at all —
   * distinct from hadUnexpectedShortfall being false, which could mean
   * either "the buffer covered it" OR "nothing happened to test it."
   * The report generator needs to tell those two apart to avoid praising
   * a buffer that was never actually tested. */
  hadExpenseEvent?: boolean;
}

export interface SimRunningState {
  balanceMinorUnits: number;
  totalIncomeMinorUnits: number;
  totalNeedsMinorUnits: number;
  totalWantsMinorUnits: number;
  totalSavingsMinorUnits: number;
  totalGivingMinorUnits: number;
  totalUnexpectedSpentMinorUnits: number;
  goalProgressMinorUnits: number;
  weekIndex: number;
  log: WeekLogEntry[];
}

export function createInitialState(scenario: SimScenario): SimRunningState {
  return {
    balanceMinorUnits: scenario.startingBalanceMinorUnits,
    totalIncomeMinorUnits: 0,
    totalNeedsMinorUnits: 0,
    totalWantsMinorUnits: 0,
    totalSavingsMinorUnits: 0,
    totalGivingMinorUnits: 0,
    totalUnexpectedSpentMinorUnits: 0,
    goalProgressMinorUnits: 0,
    weekIndex: 0,
    log: [],
  };
}
