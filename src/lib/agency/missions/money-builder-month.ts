import type { MissionDefinition } from "../engine";

/**
 * Pilot mission #2: Money Quest, Builder band (ages 9-11). Builder
 * requirements from the brief (Phase 5): multi-step decisions, a
 * personal budget, a saving goal, an unexpected event, and a real
 * opportunity to compare strategies - met structurally, not just with
 * a bigger coin number: four decision points (vs. Explorer's two), a
 * second tracked resource (progress toward a named goal, not just a
 * spendable balance), and a genuinely different mission SHAPE
 * depending on the strategy chosen (the overspending path is
 * redirected to recovery before ever reaching week 4's choice; the
 * careful path reaches a fourth, final decision the other path never
 * sees) - a child can only discover that difference by trying both.
 */
export const MONEY_BUILDER_MONTH_ONE: MissionDefinition = {
  id: "money-builder-month-one",
  quest: "money",
  band: "builder",
  startNodeId: "week1",
  startingResources: { coins: 40, savedForBike: 0 },
  resourceFloors: { coins: 0 },
  recoveryNodeId: "recovery",
  nodes: {
    week1: {
      id: "week1",
      choices: [
        {
          id: "save-15",
          consequence: { immediate: { coins: -15, savedForBike: 15 }, nextNodeId: "week2", outcomeTag: "saved-week1" },
        },
        {
          id: "spend-on-games",
          // No `requires` guard, and schedules a delayed surprise bill -
          // models "spending it all now has a real cost later", landing
          // two decisions on (due at week3), not framed as a punishment
          // for spending, just a genuine later consequence to weigh.
          consequence: {
            immediate: { coins: -15 },
            delayed: [{ delaySteps: 2, effect: { coins: -25 } }],
            nextNodeId: "week2",
            outcomeTag: "spent-week1",
          },
        },
      ],
    },
    week2: {
      id: "week2",
      choices: [
        { id: "share-treat", consequence: { immediate: { coins: -5 }, nextNodeId: "week3", outcomeTag: "shared-treat" } },
        {
          id: "decline-politely",
          consequence: { immediate: {}, nextNodeId: "week3", outcomeTag: "declined-politely" },
        },
      ],
    },
    week3: {
      id: "week3",
      choices: [
        { id: "do-chores", consequence: { immediate: { coins: 10 }, nextNodeId: "week4", outcomeTag: "did-chores" } },
        { id: "skip-chores", consequence: { immediate: {}, nextNodeId: "week4", outcomeTag: "skipped-chores" } },
      ],
    },
    week4: {
      id: "week4",
      choices: [
        {
          id: "add-10-more",
          requires: { coins: 10 },
          consequence: { immediate: { coins: -10, savedForBike: 10 }, nextNodeId: "result", outcomeTag: "added-more" },
        },
        {
          id: "wait-and-save-later",
          consequence: { immediate: {}, nextNodeId: "result", outcomeTag: "waited" },
        },
      ],
    },
    recovery: {
      id: "recovery",
      isRecoveryNode: true,
      choices: [
        {
          id: "ask-for-help",
          consequence: { immediate: { coins: 15 }, nextNodeId: "result", outcomeTag: "got-help-builder" },
        },
        {
          id: "adjust-goal",
          consequence: { immediate: {}, nextNodeId: "result", outcomeTag: "adjusted-goal" },
        },
      ],
    },
    result: { id: "result", choices: [] },
  },
};
