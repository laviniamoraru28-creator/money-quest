import type { MissionDefinition } from "../engine";

/**
 * Pilot mission #11: Entrepreneur Quest, Builder band (ages 9-11).
 * New, Agency-native content - does not touch or duplicate the main
 * Entrepreneur Quest system. Covers pricing, product/service quality,
 * marketing, and handling an unexpected event, per the brief.
 *
 * "Running a Dog-Walking Business": four decisions, a second tracked
 * resource (`reputation`, independent of `coins`) - the established
 * Builder "second resource = real complexity" pattern. Overpricing
 * alone breaches the floor immediately, skipping the other three
 * decisions entirely.
 */
export const ENTREPRENEUR_BUILDER_DOGWALKING: MissionDefinition = {
  id: "entrepreneur-builder-dogwalking",
  quest: "entrepreneur",
  band: "builder",
  startNodeId: "set-price",
  startingResources: { coins: 3, reputation: 5 },
  resourceFloors: { coins: 0, reputation: 0 },
  recoveryNodeId: "recovery",
  nodes: {
    "set-price": {
      id: "set-price",
      choices: [
        {
          id: "charge-a-fair-price",
          consequence: { immediate: { coins: 10 }, nextNodeId: "quality", outcomeTag: "charged-fair-price" },
        },
        // No `requires` guard - overcharging can genuinely breach the
        // floor (customers go elsewhere, leaving costs unpaid).
        {
          id: "charge-too-much",
          consequence: { immediate: { coins: -5 }, nextNodeId: "quality", outcomeTag: "charged-too-much" },
        },
      ],
    },
    quality: {
      id: "quality",
      choices: [
        {
          id: "always-show-up-on-time",
          consequence: { immediate: { reputation: 8 }, nextNodeId: "marketing", outcomeTag: "always-on-time" },
        },
        {
          id: "sometimes-run-late",
          consequence: { immediate: { reputation: -6 }, nextNodeId: "marketing", outcomeTag: "sometimes-late" },
        },
      ],
    },
    marketing: {
      id: "marketing",
      choices: [
        {
          id: "make-flyers",
          consequence: { immediate: { coins: -4 }, nextNodeId: "unexpected", outcomeTag: "made-flyers" },
        },
        {
          id: "rely-on-word-of-mouth",
          consequence: { immediate: { reputation: 2 }, nextNodeId: "unexpected", outcomeTag: "relied-on-word-of-mouth" },
        },
      ],
    },
    unexpected: {
      id: "unexpected",
      choices: [
        {
          id: "chase-and-return-it-safely",
          consequence: { immediate: { reputation: 10 }, nextNodeId: "result", outcomeTag: "chased-and-returned-safely" },
        },
        {
          id: "tell-the-owner-right-away",
          consequence: { immediate: { reputation: 6 }, nextNodeId: "result", outcomeTag: "told-owner-right-away" },
        },
      ],
    },
    recovery: {
      id: "recovery",
      isRecoveryNode: true,
      choices: [
        {
          id: "ask-for-help",
          consequence: { immediate: { coins: 8 }, nextNodeId: "result", outcomeTag: "got-help-entrepreneur-builder" },
        },
        {
          id: "adjust-your-price",
          consequence: { immediate: { coins: 3 }, nextNodeId: "result", outcomeTag: "adjusted-price" },
        },
      ],
    },
    result: { id: "result", choices: [] },
  },
};
