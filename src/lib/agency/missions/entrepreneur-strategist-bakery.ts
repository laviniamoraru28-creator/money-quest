import type { MissionDefinition } from "../engine";

/**
 * Pilot mission #12 of 12: Entrepreneur Quest, Strategist band
 * (ages 12-14). New, Agency-native content - does not touch or
 * duplicate the main Entrepreneur Quest system. Covers product
 * quality, pricing strategy, business sustainability and growth, per
 * the brief, with transparent (not arbitrary) cause and effect.
 *
 * "Scaling a Small Bakery": compound dual-resource effects
 * (`profit` + `customerSatisfaction`, moving in opposite directions
 * from the same choice) at every decision - the same Strategist
 * complexity bump as every other Strategist mission in this vertical
 * slice. The one combination that breaches the floor (cheaper
 * ingredients, then raising prices to cover rising costs) happens at
 * decision 2, skipping the expansion decision entirely.
 */
export const ENTREPRENEUR_STRATEGIST_BAKERY: MissionDefinition = {
  id: "entrepreneur-strategist-bakery",
  quest: "entrepreneur",
  band: "strategist",
  startNodeId: "ingredients",
  startingResources: { profit: 12, customerSatisfaction: 10 },
  resourceFloors: { profit: 0, customerSatisfaction: 0 },
  recoveryNodeId: "recovery",
  nodes: {
    ingredients: {
      id: "ingredients",
      choices: [
        {
          id: "buy-cheaper-ingredients",
          consequence: {
            immediate: { profit: 10, customerSatisfaction: -6 },
            nextNodeId: "pricing-strategy",
            outcomeTag: "bought-cheaper-ingredients",
          },
        },
        {
          id: "buy-quality-ingredients",
          consequence: {
            immediate: { profit: -5, customerSatisfaction: 8 },
            nextNodeId: "pricing-strategy",
            outcomeTag: "bought-quality-ingredients",
          },
        },
      ],
    },
    "pricing-strategy": {
      id: "pricing-strategy",
      choices: [
        // No `requires` guard - raising prices on top of an earlier
        // satisfaction hit can genuinely breach the floor.
        {
          id: "raise-prices-to-cover-costs",
          consequence: {
            immediate: { profit: 8, customerSatisfaction: -5 },
            nextNodeId: "expansion",
            outcomeTag: "raised-prices",
          },
        },
        {
          id: "keep-prices-steady-absorb-cost",
          consequence: {
            immediate: { profit: -6, customerSatisfaction: 5 },
            nextNodeId: "expansion",
            outcomeTag: "kept-prices-steady",
          },
        },
      ],
    },
    expansion: {
      id: "expansion",
      choices: [
        {
          id: "open-a-second-location-fast",
          consequence: {
            immediate: { profit: -10, customerSatisfaction: -4 },
            nextNodeId: "result",
            outcomeTag: "expanded-fast",
          },
        },
        {
          id: "grow-slowly-and-steadily",
          consequence: {
            immediate: { profit: 4, customerSatisfaction: 6 },
            nextNodeId: "result",
            outcomeTag: "grew-slowly",
          },
        },
      ],
    },
    recovery: {
      id: "recovery",
      isRecoveryNode: true,
      choices: [
        {
          id: "ask-for-help",
          consequence: { immediate: { profit: 10 }, nextNodeId: "result", outcomeTag: "got-help-entrepreneur-strategist" },
        },
        {
          id: "win-back-customers-with-quality",
          consequence: {
            immediate: { customerSatisfaction: 8 },
            nextNodeId: "result",
            outcomeTag: "won-back-customers-with-quality",
          },
        },
      ],
    },
    result: { id: "result", choices: [] },
  },
};
