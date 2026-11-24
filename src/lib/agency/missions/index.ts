import type { MissionDefinition } from "../engine";
import { MONEY_EXPLORER_WEEK_ONE } from "./money-explorer-week";
import { MONEY_BUILDER_MONTH_ONE } from "./money-builder-month";
import { MONEY_STRATEGIST_TERM_ONE } from "./money-strategist-term";

/**
 * Every mission in the Agency vertical slice, keyed by id. Money
 * Quest's three bands are complete (3 of the brief's 12 pilot
 * combinations) - Entrepreneur, Leadership and AI Quest x all three
 * bands are the next increments on this branch, landing here the same
 * way as this codebase's other content registries (one definition
 * module per mission, listed here).
 */
export const AGENCY_MISSIONS: Readonly<Record<string, MissionDefinition>> = {
  [MONEY_EXPLORER_WEEK_ONE.id]: MONEY_EXPLORER_WEEK_ONE,
  [MONEY_BUILDER_MONTH_ONE.id]: MONEY_BUILDER_MONTH_ONE,
  [MONEY_STRATEGIST_TERM_ONE.id]: MONEY_STRATEGIST_TERM_ONE,
};

export function getMission(missionId: string): MissionDefinition | undefined {
  return AGENCY_MISSIONS[missionId];
}

export { MONEY_EXPLORER_WEEK_ONE, MONEY_BUILDER_MONTH_ONE, MONEY_STRATEGIST_TERM_ONE };
