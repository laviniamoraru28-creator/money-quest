import type { MissionDefinition } from "../engine";

/**
 * Pilot mission #6: AI Quest, Strategist band (ages 12-14). Brief
 * requirement specific to this band: "how to use AI responsibly in
 * entrepreneurship and leadership." Strategist-level complexity comes
 * from choices with COMPOUND effects across both tracked resources at
 * once (`planQuality` and `trustworthiness`) - a step up from
 * Builder's one-resource-per-choice pattern, not just bigger numbers.
 *
 * The two recovery choices deliberately repair DIFFERENT resources -
 * "ask for help" restores plan quality, "rebuild honestly" restores
 * trustworthiness instead - modelling that there isn't one single
 * correct repair, only different valid trade-offs (brief: "evaluation
 * of trade-offs").
 */
export const AI_STRATEGIST_BUSINESS_PLAN: MissionDefinition = {
  id: "ai-strategist-business-plan",
  quest: "ai",
  band: "strategist",
  startNodeId: "market-research",
  startingResources: { planQuality: 15, trustworthiness: 12 },
  resourceFloors: { planQuality: 0, trustworthiness: 0 },
  recoveryNodeId: "recovery",
  nodes: {
    "market-research": {
      id: "market-research",
      choices: [
        {
          id: "use-stats-directly",
          consequence: { immediate: { planQuality: -12 }, nextNodeId: "ai-written-pitch", outcomeTag: "used-unverified-stats" },
        },
        {
          id: "verify-with-real-sources",
          consequence: {
            immediate: { planQuality: 10, trustworthiness: 3 },
            nextNodeId: "ai-written-pitch",
            outcomeTag: "verified-stats",
          },
        },
      ],
    },
    "ai-written-pitch": {
      id: "ai-written-pitch",
      choices: [
        // No `requires` guard - a weak plan plus an unedited pitch can
        // genuinely breach the floor together, even though neither
        // alone necessarily would.
        {
          id: "submit-ai-pitch-unedited",
          consequence: {
            immediate: { planQuality: -5, trustworthiness: -5 },
            nextNodeId: "ai-generated-image",
            outcomeTag: "submitted-unedited-pitch",
          },
        },
        {
          id: "revise-and-personalize",
          consequence: { immediate: { planQuality: 8 }, nextNodeId: "ai-generated-image", outcomeTag: "personalized-pitch" },
        },
      ],
    },
    "ai-generated-image": {
      id: "ai-generated-image",
      choices: [
        {
          id: "use-it-and-claim-original",
          consequence: { immediate: { trustworthiness: -10 }, nextNodeId: "result", outcomeTag: "misrepresented-ai-image" },
        },
        {
          id: "disclose-ai-assistance",
          consequence: { immediate: { trustworthiness: 6 }, nextNodeId: "result", outcomeTag: "disclosed-ai-use" },
        },
      ],
    },
    recovery: {
      id: "recovery",
      isRecoveryNode: true,
      choices: [
        {
          id: "ask-for-help",
          consequence: { immediate: { planQuality: 10 }, nextNodeId: "result", outcomeTag: "got-help-ai-strategist" },
        },
        {
          id: "rebuild-honestly",
          consequence: { immediate: { trustworthiness: 5 }, nextNodeId: "result", outcomeTag: "rebuilt-honestly" },
        },
      ],
    },
    result: { id: "result", choices: [] },
  },
};
