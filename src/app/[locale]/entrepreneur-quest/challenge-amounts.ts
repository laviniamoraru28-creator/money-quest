import {
  EQ_FIVE_CHALLENGE_AMOUNT_MINOR_UNITS,
  EQ_MARKETING_CHALLENGE_AMOUNT_MINOR_UNITS,
  EQ_DEFAULT_COST_PER_UNIT_MINOR_UNITS,
} from "@/content/entrepreneur-quest/structures";

/**
 * Which challenges need a formatted `{amount}` interpolated into their
 * title/situation text, and what that amount is — shared between the
 * challenges list page and the individual challenge page so both
 * render identical wording. Challenges not listed here have no
 * `{amount}` placeholder in their content at all.
 */
export const CHALLENGE_AMOUNT_MINOR_UNITS: Partial<Record<string, number>> = {
  "five-pound-challenge": EQ_FIVE_CHALLENGE_AMOUNT_MINOR_UNITS,
  "pricing-challenge": EQ_DEFAULT_COST_PER_UNIT_MINOR_UNITS,
  "marketing-challenge": EQ_MARKETING_CHALLENGE_AMOUNT_MINOR_UNITS,
};
