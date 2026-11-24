import type { MissionDefinition } from "../engine";

/**
 * Pilot mission #10: Entrepreneur Quest, Explorer band (ages 6-8).
 * This is a new, Agency-native mission - it does NOT touch or
 * duplicate the existing Entrepreneur Quest system
 * (src/lib/entrepreneur-quest/state.ts), which already has its own
 * mature decision-effects table, runSimulator(), and rescue flow for
 * the main Entrepreneur Quest experience. This is a separate, simpler
 * decision scenario at Explorer-band simplicity (2 choices per node),
 * covering the brief's "pricing... responsible spending" angle on
 * entrepreneurship without attempting to re-run the full business
 * simulator at this age band.
 *
 * "Lemonade Stand Day": pricing the lemonade, then an unexpected rain
 * shower. Transparent, not arbitrary - pricing too high loses the
 * cost of ingredients already bought because fewer people buy.
 */
export const ENTREPRENEUR_EXPLORER_LEMONADE: MissionDefinition = {
  id: "entrepreneur-explorer-lemonade",
  quest: "entrepreneur",
  band: "explorer",
  startNodeId: "pricing",
  startingResources: { coins: 2 },
  resourceFloors: { coins: 0 },
  recoveryNodeId: "recovery",
  nodes: {
    pricing: {
      id: "pricing",
      choices: [
        {
          id: "price-it-fair",
          consequence: { immediate: { coins: 5 }, nextNodeId: "weather", outcomeTag: "priced-it-fair" },
        },
        // No `requires` guard - pricing too high can genuinely breach
        // the floor (fewer customers buy, so the ingredients already
        // bought are a real loss).
        {
          id: "price-it-high",
          consequence: { immediate: { coins: -3 }, nextNodeId: "weather", outcomeTag: "priced-it-high" },
        },
      ],
    },
    weather: {
      id: "weather",
      choices: [
        {
          id: "move-under-a-tent",
          consequence: { immediate: { coins: 4 }, nextNodeId: "result", outcomeTag: "moved-under-tent" },
        },
        {
          id: "pack-up-for-the-day",
          consequence: { immediate: { coins: 1 }, nextNodeId: "result", outcomeTag: "packed-up-for-the-day" },
        },
      ],
    },
    recovery: {
      id: "recovery",
      isRecoveryNode: true,
      choices: [
        {
          id: "ask-for-help",
          consequence: { immediate: { coins: 5 }, nextNodeId: "result", outcomeTag: "got-help-entrepreneur-explorer" },
        },
        {
          id: "try-a-new-price-tomorrow",
          consequence: { immediate: { coins: 2 }, nextNodeId: "result", outcomeTag: "tried-new-price-tomorrow" },
        },
      ],
    },
    result: { id: "result", choices: [] },
  },
};
