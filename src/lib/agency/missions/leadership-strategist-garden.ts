import type { MissionDefinition } from "../engine";

/**
 * Pilot mission #9: Leadership Quest, Strategist band (ages 12-14).
 * New, Agency-native content - the existing Leadership Quest system
 * stays untouched. Brief requirements: ethical leadership, community
 * projects, fairness.
 *
 * "Leading a Community Garden Project": compound dual-resource
 * effects (`teamTrust` + `communityImpact`) at every decision, same
 * Strategist-level complexity bump as the Money and AI Strategist
 * missions. The one combination that breaches the floor (letting a
 * safety shortcut slide, then prioritising community benefit over the
 * team) happens at decision 2, skipping the final interview decision.
 */
export const LEADERSHIP_STRATEGIST_GARDEN: MissionDefinition = {
  id: "leadership-strategist-garden",
  quest: "leadership",
  band: "strategist",
  startNodeId: "volunteer-dispute",
  startingResources: { teamTrust: 10, communityImpact: 5 },
  resourceFloors: { teamTrust: 0, communityImpact: 0 },
  recoveryNodeId: "recovery",
  nodes: {
    "volunteer-dispute": {
      id: "volunteer-dispute",
      choices: [
        {
          id: "let-it-slide-to-save-time",
          consequence: {
            immediate: { teamTrust: -8, communityImpact: 3 },
            nextNodeId: "resource-allocation",
            outcomeTag: "let-it-slide-to-save-time",
          },
        },
        {
          id: "enforce-the-safety-rules",
          consequence: {
            immediate: { teamTrust: 6, communityImpact: -2 },
            nextNodeId: "resource-allocation",
            outcomeTag: "enforced-safety-rules",
          },
        },
      ],
    },
    "resource-allocation": {
      id: "resource-allocation",
      choices: [
        {
          id: "prioritize-team-tools",
          consequence: { immediate: { teamTrust: 5 }, nextNodeId: "credit-and-visibility", outcomeTag: "prioritized-team-tools" },
        },
        // No `requires` guard - prioritising the community over the
        // team can genuinely breach the floor after an earlier
        // trust-costing choice.
        {
          id: "prioritize-community-benefit",
          consequence: {
            immediate: { communityImpact: 8, teamTrust: -3 },
            nextNodeId: "credit-and-visibility",
            outcomeTag: "prioritized-community-benefit",
          },
        },
      ],
    },
    "credit-and-visibility": {
      id: "credit-and-visibility",
      choices: [
        {
          id: "take-the-spotlight-alone",
          consequence: { immediate: { teamTrust: -10 }, nextNodeId: "result", outcomeTag: "took-spotlight-alone" },
        },
        {
          id: "bring-the-whole-team-to-the-interview",
          consequence: {
            immediate: { teamTrust: 7, communityImpact: 4 },
            nextNodeId: "result",
            outcomeTag: "brought-whole-team",
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
          consequence: { immediate: { teamTrust: 8 }, nextNodeId: "result", outcomeTag: "got-help-leadership-strategist" },
        },
        {
          id: "rebuild-trust-through-action",
          consequence: {
            immediate: { teamTrust: 3, communityImpact: 3 },
            nextNodeId: "result",
            outcomeTag: "rebuilt-trust-through-action",
          },
        },
      ],
    },
    result: { id: "result", choices: [] },
  },
};
