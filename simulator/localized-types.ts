import type { AgeBand } from "@/types/database.types";
import type { SimEventType, AllocationCategory } from "./types";

/** Translatable text for one week (title/description/etc.), mirroring
 * SimWeek/SimEvent's shape but omitting structural fields (ids, type,
 * every MinorUnits amount, choice keys/categories) — see
 * localized-types pattern established for curriculum and games. */
export interface LocalizedSimEventChoiceText {
  label: string;
  consequence: string;
}

export interface LocalizedSimEventText {
  title: string;
  description: string;
  expenseConsequenceCovered?: string;
  expenseConsequenceShortfall?: string;
  choices?: LocalizedSimEventChoiceText[];
  celebrationMessage?: string;
  notYetMessage?: string;
}

export interface LocalizedSimWeekText {
  weekLabel: string;
  event?: LocalizedSimEventText;
}

export interface LocalizedScenarioText {
  title: string;
  savingsGoalName: string;
  weeks: LocalizedSimWeekText[];
}

/** The structural (non-translatable) shape kept in the static TS
 * registry — combine with LocalizedScenarioText to reconstruct a full
 * SimScenario for a given locale. */
export interface SimWeekStructure {
  id: string;
  incomeMinorUnits: number;
  event?: {
    id: string;
    type: SimEventType;
    costMinorUnits?: number;
    choices?: { key: string; category: AllocationCategory; costMinorUnits: number }[];
    bonusMinorUnits?: number;
  };
}

export interface ScenarioStructure {
  key: string;
  ageBand: AgeBand;
  difficulty: "standard" | "challenge";
  startingBalanceMinorUnits: number;
  savingsGoalTargetMinorUnits: number;
  xpReward: number;
  coinRewardMinorUnits: number;
  estimatedMinutes: number;
  weeks: SimWeekStructure[];
}
