import type { SimEvent, SimRunningState, SimScenario, SimWeek, WeekAllocation } from "./types";

/** The spendable total for a week — base income plus any windfall bonus.
 * Exported so the UI can validate an allocation sums to exactly this
 * before calling applyWeek, without duplicating the windfall logic. */
export function getSpendableIncome(week: SimWeek): number {
  const bonus = week.event?.type === "windfall" ? week.event.bonusMinorUnits ?? 0 : 0;
  return week.incomeMinorUnits + bonus;
}

export interface ApplyWeekResult {
  newState: SimRunningState;
  eventConsequence?: string;
  eventChoiceLabel?: string;
}

/**
 * The one function that advances the simulation by a week. Pure: given
 * the same state, week, allocation, and choice, it always produces the
 * same result — no randomness, no hidden state, nothing reached into
 * from outside its arguments. This is what makes the engine reusable
 * (the same function runs every scenario, at every age band) and
 * testable independently of any UI (see scripts/test-simulator-engine.ts).
 */
export function applyWeek(
  state: SimRunningState,
  scenario: SimScenario,
  week: SimWeek,
  allocation: WeekAllocation,
  eventChoiceKey?: string
): ApplyWeekResult {
  const spendableIncome = getSpendableIncome(week);
  const allocatedTotal =
    allocation.needs + allocation.wants + allocation.savings + allocation.giving + allocation.unexpected;

  if (allocatedTotal !== spendableIncome) {
    // A defensive invariant, not a UI-reachable state — the allocation
    // UI only ever calls this once every coin is placed. Throwing here
    // (rather than silently truncating) makes a violation loud during
    // development instead of quietly producing a wrong running balance.
    throw new Error(
      `applyWeek: allocation totals ${allocatedTotal} but spendable income is ${spendableIncome}`
    );
  }

  let balance = state.balanceMinorUnits;
  balance += allocation.savings;
  balance += allocation.unexpected;

  let unexpectedSpentThisWeek = 0;
  let hadUnexpectedShortfall = false;
  let eventConsequence: string | undefined;
  let eventChoiceLabel: string | undefined;

  const event: SimEvent | undefined = week.event;

  if (event?.type === "expense") {
    const cost = event.costMinorUnits ?? 0;
    const coveredByBuffer = Math.min(cost, allocation.unexpected);
    const shortfall = cost - coveredByBuffer;
    balance -= coveredByBuffer;
    if (shortfall > 0) {
      balance = Math.max(0, balance - shortfall);
      eventConsequence = event.expenseConsequenceShortfall ?? event.description;
      hadUnexpectedShortfall = true;
    } else {
      eventConsequence = event.expenseConsequenceCovered ?? event.description;
    }
    unexpectedSpentThisWeek = cost;
  }

  let wantsSpentThisWeek = allocation.wants;
  let givingSpentThisWeek = allocation.giving;

  if (event?.type === "opportunity" && eventChoiceKey) {
    const choice = event.choices?.find((c) => c.key === eventChoiceKey);
    if (choice) {
      balance = Math.max(0, balance - choice.costMinorUnits);
      if (choice.category === "wants") wantsSpentThisWeek += choice.costMinorUnits;
      if (choice.category === "giving") givingSpentThisWeek += choice.costMinorUnits;
      eventConsequence = choice.consequence;
      eventChoiceLabel = choice.label;
    }
  }

  const newTotalSavings = state.totalSavingsMinorUnits + allocation.savings;

  if (event?.type === "milestone") {
    const goalMet = newTotalSavings >= scenario.savingsGoal.targetMinorUnits;
    // No English fallback here on purpose: every scenario's milestone
    // event supplies both messages in every locale (see
    // scripts/validate-translations.ts), so a missing one should
    // surface as an absent sentence in WeekSummaryCard, never as a
    // stray English string dropped into an otherwise fully translated
    // report.
    eventConsequence = goalMet ? event.celebrationMessage : event.notYetMessage;
  }

  if (event?.type === "windfall") {
    eventConsequence = event.description;
  }

  const newState: SimRunningState = {
    balanceMinorUnits: balance,
    totalIncomeMinorUnits: state.totalIncomeMinorUnits + spendableIncome,
    totalNeedsMinorUnits: state.totalNeedsMinorUnits + allocation.needs,
    totalWantsMinorUnits: state.totalWantsMinorUnits + wantsSpentThisWeek,
    totalSavingsMinorUnits: newTotalSavings,
    totalGivingMinorUnits: state.totalGivingMinorUnits + givingSpentThisWeek,
    totalUnexpectedSpentMinorUnits: state.totalUnexpectedSpentMinorUnits + unexpectedSpentThisWeek,
    goalProgressMinorUnits: Math.min(newTotalSavings, scenario.savingsGoal.targetMinorUnits),
    weekIndex: state.weekIndex + 1,
    log: [
      ...state.log,
      {
        weekLabel: week.weekLabel,
        incomeMinorUnits: spendableIncome,
        allocation,
        eventTitle: event?.title,
        eventConsequence,
        eventChoiceLabel,
        hadUnexpectedShortfall,
        hadExpenseEvent: event?.type === "expense",
      },
    ],
  };

  return { newState, eventConsequence, eventChoiceLabel };
}
