import type { SimRunningState, SimScenario } from "./types";

/** The shape of next-intl's translation function this file needs —
 * kept minimal and structural rather than importing next-intl's own
 * type, since this file has no other dependency on next-intl and
 * shouldn't need one just for a type annotation. */
type Translator = (key: string, values?: Record<string, string | number>) => string;

/**
 * Every insight here is written to describe a CHOICE and its effect,
 * never the child — this is the same "Let's think about another
 * option" / "Here's what would happen" register used throughout the
 * game engine's feedback-guard.ts, applied to a longer-form report
 * instead of a single round's feedback. No insight is templated praise
 * disconnected from what actually happened; each one reads real numbers
 * from the final state.
 *
 * Takes `t` as a parameter rather than calling useTranslations() itself
 * — this is a plain function, not a React component, so it can't use a
 * hook directly. The caller (FinalReportCard, a component) supplies its
 * own `t` from useTranslations().
 */
export function generateReportInsights(state: SimRunningState, scenario: SimScenario, t: Translator): string[] {
  const insights: string[] = [];

  // Goal progress
  const goalMet = state.goalProgressMinorUnits >= scenario.savingsGoal.targetMinorUnits;
  if (goalMet) {
    insights.push(t("simulator.insightGoalMet", { goalName: scenario.savingsGoal.name }));
  } else if (state.goalProgressMinorUnits > 0) {
    const percent = Math.round((state.goalProgressMinorUnits / scenario.savingsGoal.targetMinorUnits) * 100);
    insights.push(t("simulator.insightGoalProgress", { goalName: scenario.savingsGoal.name, percent }));
  } else {
    insights.push(t("simulator.insightGoalNotStarted", { goalName: scenario.savingsGoal.name }));
  }

  // Needs coverage — a simple, honest signal: needs should generally be a
  // meaningful share of income, not an afterthought.
  const needsShare = state.totalIncomeMinorUnits > 0 ? state.totalNeedsMinorUnits / state.totalIncomeMinorUnits : 0;
  if (needsShare < 0.2 && state.totalIncomeMinorUnits > 0) {
    insights.push(t("simulator.insightNeedsLowShare"));
  } else {
    insights.push(t("simulator.insightNeedsGoodHabit"));
  }

  // Buffer/shortfall pattern — only commented on if an expense event
  // actually happened at all; otherwise there's nothing genuine to say
  // about how the buffer performed, since it was never tested.
  const expenseWeeks = state.log.filter((w) => w.hadExpenseEvent);
  const shortfallWeeks = expenseWeeks.filter((w) => w.hadUnexpectedShortfall).length;
  if (shortfallWeeks > 0) {
    insights.push(t(shortfallWeeks > 1 ? "simulator.insightShortfallMultiple" : "simulator.insightShortfallSingle", { count: shortfallWeeks }));
  } else if (expenseWeeks.length > 0) {
    insights.push(t("simulator.insightBufferHeldUp"));
  }

  // Giving
  if (state.totalGivingMinorUnits > 0) {
    insights.push(t("simulator.insightGivingNoticed"));
  }

  return insights;
}
