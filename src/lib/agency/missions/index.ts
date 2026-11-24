import type { MissionDefinition } from "../engine";
import { MONEY_EXPLORER_WEEK_ONE } from "./money-explorer-week";

/**
 * Every mission in the Agency vertical slice, keyed by id. Only one
 * pilot mission exists so far (Money Quest / Explorer) - the other 11
 * combinations in the brief's 4-quest x 3-band vertical slice land
 * here the same way as this codebase's other content registries
 * (one definition module per mission, listed here).
 */
export const AGENCY_MISSIONS: Readonly<Record<string, MissionDefinition>> = {
  [MONEY_EXPLORER_WEEK_ONE.id]: MONEY_EXPLORER_WEEK_ONE,
};

export function getMission(missionId: string): MissionDefinition | undefined {
  return AGENCY_MISSIONS[missionId];
}

export { MONEY_EXPLORER_WEEK_ONE };
