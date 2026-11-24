import type { MissionDefinition } from "../engine";

/**
 * Pilot mission #1 of the Agency vertical slice: Money Quest, Explorer
 * band (ages 6-8). This is the brief's own worked example - a week of
 * pocket money, an unexpected expense, and a non-punished recovery
 * path if it runs short - kept to the Explorer limit of two choices
 * per decision point.
 *
 * This file is pure structure (ids, amounts, node graph) - no display
 * text. Every `outcomeTag` and node id has a matching entry under the
 * `agency.money.explorer.weekOne` namespace in messages/*.json; the
 * UI layer looks copy up by tag, this module never embeds English
 * strings (brief: "separate simulation logic from presentation and
 * translations").
 */
export const MONEY_EXPLORER_WEEK_ONE: MissionDefinition = {
  id: "money-explorer-week-one",
  quest: "money",
  band: "explorer",
  startNodeId: "monday",
  startingResources: { coins: 25 },
  resourceFloors: { coins: 0 },
  recoveryNodeId: "recovery",
  nodes: {
    monday: {
      id: "monday",
      choices: [
        {
          id: "save",
          consequence: { immediate: {}, nextNodeId: "wednesday", outcomeTag: "saved-monday" },
        },
        {
          id: "treat",
          requires: { coins: 20 },
          consequence: { immediate: { coins: -20 }, nextNodeId: "wednesday", outcomeTag: "spent-on-treat" },
        },
      ],
    },
    wednesday: {
      id: "wednesday",
      choices: [
        {
          id: "pay-trip",
          // Deliberately no `requires` here: a real unexpected expense
          // isn't something a child can decline for being unaffordable
          // ahead of time - if it drops coins below the floor, the
          // engine itself redirects to the recovery node rather than
          // silently applying a negative balance.
          consequence: { immediate: { coins: -10 }, nextNodeId: "friday", outcomeTag: "paid-trip" },
        },
        {
          id: "skip-trip",
          consequence: { immediate: {}, nextNodeId: "friday", outcomeTag: "skipped-trip" },
        },
      ],
    },
    recovery: {
      id: "recovery",
      isRecoveryNode: true,
      choices: [
        {
          id: "ask-for-help",
          consequence: { immediate: { coins: 10 }, nextNodeId: "friday", outcomeTag: "got-help" },
        },
        {
          id: "reorganise-budget",
          consequence: { immediate: {}, nextNodeId: "friday", outcomeTag: "reorganised" },
        },
      ],
    },
    friday: {
      // Terminal: zero choices. Reflection/summary copy is looked up
      // from the mission's full history by the UI layer, not stored
      // here.
      id: "friday",
      choices: [],
    },
  },
};
