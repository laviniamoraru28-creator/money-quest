import type { SimScenario, SimWeek, SimEvent } from "./types";
import type { ScenarioStructure, LocalizedScenarioText } from "./localized-types";

/**
 * Combines a scenario's structural data (key, MinorUnits amounts,
 * event/choice ids and categories — locale-independent) with its
 * translatable text, fetched via `t.raw("simulatorScenarios.<key>")` —
 * same pattern as lessons and games. Weeks are matched by position
 * (same index in structure.weeks and text.weeks, preserved by
 * migrate-simulator-to-i18n.ts when it split the original scenario),
 * with an explicit check that both sides agree on whether a week has
 * an event at all, rather than silently pairing week N's structure
 * with the wrong week's text if the two ever drift apart.
 */
export function buildScenarioFromStructure(structure: ScenarioStructure, text: LocalizedScenarioText): SimScenario {
  const weeks: SimWeek[] = structure.weeks.map((weekStructure, i) => {
    const weekText = text.weeks[i];
    if (!weekText) {
      throw new Error(`Scenario "${structure.key}": missing translated week at index ${i}`);
    }
    if (Boolean(weekStructure.event) !== Boolean(weekText.event)) {
      throw new Error(`Scenario "${structure.key}": week ${i} event presence mismatch between structure and localized text`);
    }

    let event: SimEvent | undefined;
    if (weekStructure.event && weekText.event) {
      const es = weekStructure.event;
      const et = weekText.event;
      event = {
        id: es.id,
        type: es.type,
        title: et.title,
        description: et.description,
        ...(es.costMinorUnits !== undefined ? { costMinorUnits: es.costMinorUnits } : {}),
        ...(et.expenseConsequenceCovered !== undefined ? { expenseConsequenceCovered: et.expenseConsequenceCovered } : {}),
        ...(et.expenseConsequenceShortfall !== undefined ? { expenseConsequenceShortfall: et.expenseConsequenceShortfall } : {}),
        ...(es.choices && et.choices
          ? {
              choices: es.choices.map((cs, ci) => {
                const ct = et.choices?.[ci];
                if (!ct) throw new Error(`Scenario "${structure.key}": missing translated choice at week ${i}, choice ${ci}`);
                return { key: cs.key, category: cs.category, costMinorUnits: cs.costMinorUnits, label: ct.label, consequence: ct.consequence };
              }),
            }
          : {}),
        ...(es.bonusMinorUnits !== undefined ? { bonusMinorUnits: es.bonusMinorUnits } : {}),
        ...(et.celebrationMessage !== undefined ? { celebrationMessage: et.celebrationMessage } : {}),
        ...(et.notYetMessage !== undefined ? { notYetMessage: et.notYetMessage } : {}),
      };
    }

    return {
      id: weekStructure.id,
      weekLabel: weekText.weekLabel,
      incomeMinorUnits: weekStructure.incomeMinorUnits,
      ...(event ? { event } : {}),
    };
  });

  return {
    key: structure.key,
    title: text.title,
    ageBand: structure.ageBand,
    difficulty: structure.difficulty,
    startingBalanceMinorUnits: structure.startingBalanceMinorUnits,
    savingsGoal: { name: text.savingsGoalName, targetMinorUnits: structure.savingsGoalTargetMinorUnits },
    weeks,
    xpReward: structure.xpReward,
    coinRewardMinorUnits: structure.coinRewardMinorUnits,
    estimatedMinutes: structure.estimatedMinutes,
  };
}
