import type { MissionDefinition } from "../engine";
import { MONEY_EXPLORER_WEEK_ONE } from "./money-explorer-week";
import { MONEY_BUILDER_MONTH_ONE } from "./money-builder-month";
import { MONEY_STRATEGIST_TERM_ONE } from "./money-strategist-term";
import { AI_EXPLORER_HELPER_ROBOT } from "./ai-explorer-helper-robot";
import { AI_BUILDER_BOOK_REPORT } from "./ai-builder-book-report";
import { AI_STRATEGIST_BUSINESS_PLAN } from "./ai-strategist-business-plan";
import { LEADERSHIP_EXPLORER_FORT } from "./leadership-explorer-fort";
import { LEADERSHIP_BUILDER_FUNDRAISER } from "./leadership-builder-fundraiser";
import { LEADERSHIP_STRATEGIST_GARDEN } from "./leadership-strategist-garden";

/**
 * Every mission in the Agency vertical slice, keyed by id. Money, AI
 * and Leadership Quest's three bands are complete (9 of the brief's
 * 12 pilot combinations) - Entrepreneur Quest x all three bands is the
 * last increment on this branch, landing here the same way as this
 * codebase's other content registries (one definition module per
 * mission, listed here).
 */
export const AGENCY_MISSIONS: Readonly<Record<string, MissionDefinition>> = {
  [MONEY_EXPLORER_WEEK_ONE.id]: MONEY_EXPLORER_WEEK_ONE,
  [MONEY_BUILDER_MONTH_ONE.id]: MONEY_BUILDER_MONTH_ONE,
  [MONEY_STRATEGIST_TERM_ONE.id]: MONEY_STRATEGIST_TERM_ONE,
  [AI_EXPLORER_HELPER_ROBOT.id]: AI_EXPLORER_HELPER_ROBOT,
  [AI_BUILDER_BOOK_REPORT.id]: AI_BUILDER_BOOK_REPORT,
  [AI_STRATEGIST_BUSINESS_PLAN.id]: AI_STRATEGIST_BUSINESS_PLAN,
  [LEADERSHIP_EXPLORER_FORT.id]: LEADERSHIP_EXPLORER_FORT,
  [LEADERSHIP_BUILDER_FUNDRAISER.id]: LEADERSHIP_BUILDER_FUNDRAISER,
  [LEADERSHIP_STRATEGIST_GARDEN.id]: LEADERSHIP_STRATEGIST_GARDEN,
};

export function getMission(missionId: string): MissionDefinition | undefined {
  return AGENCY_MISSIONS[missionId];
}

export {
  MONEY_EXPLORER_WEEK_ONE,
  MONEY_BUILDER_MONTH_ONE,
  MONEY_STRATEGIST_TERM_ONE,
  AI_EXPLORER_HELPER_ROBOT,
  AI_BUILDER_BOOK_REPORT,
  AI_STRATEGIST_BUSINESS_PLAN,
  LEADERSHIP_EXPLORER_FORT,
  LEADERSHIP_BUILDER_FUNDRAISER,
  LEADERSHIP_STRATEGIST_GARDEN,
};
