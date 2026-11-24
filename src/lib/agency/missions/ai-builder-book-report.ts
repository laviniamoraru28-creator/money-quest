import type { MissionDefinition } from "../engine";

/**
 * Pilot mission #5: AI Quest, Builder band (ages 9-11). Brief
 * requirements covered: verifying AI-generated information, improving
 * an AI-generated result, and protecting personal information - a
 * second tracked resource (`privacyScore`) that isn't about output
 * quality at all, same "second resource = real complexity" pattern as
 * money-builder-month-one.
 *
 * Four decision points. The one combination that breaches
 * `projectQuality`'s floor (using the AI's draft as-is, then trusting
 * its one deliberately wrong fact) skips the personal-information and
 * final-review decisions entirely - overspending trust early costs
 * the chance to even reach the privacy question, mirroring the
 * Builder Money mission's "shorter shape on the risky path."
 */
export const AI_BUILDER_BOOK_REPORT: MissionDefinition = {
  id: "ai-builder-book-report",
  quest: "ai",
  band: "builder",
  startNodeId: "draft",
  startingResources: { projectQuality: 12, privacyScore: 10 },
  resourceFloors: { projectQuality: 0, privacyScore: 0 },
  recoveryNodeId: "recovery",
  nodes: {
    draft: {
      id: "draft",
      choices: [
        {
          id: "use-as-is",
          consequence: { immediate: { projectQuality: -5 }, nextNodeId: "fact-check", outcomeTag: "used-draft-as-is" },
        },
        {
          id: "add-your-own-ideas",
          consequence: { immediate: { projectQuality: 8 }, nextNodeId: "fact-check", outcomeTag: "improved-draft" },
        },
      ],
    },
    "fact-check": {
      id: "fact-check",
      choices: [
        // The AI's fact here is deliberately wrong - no `requires`
        // guard, so trusting it can breach the floor.
        {
          id: "trust-it",
          consequence: { immediate: { projectQuality: -10 }, nextNodeId: "personal-info", outcomeTag: "trusted-wrong-fact" },
        },
        {
          id: "look-it-up",
          consequence: { immediate: { projectQuality: 5 }, nextNodeId: "personal-info", outcomeTag: "verified-fact" },
        },
      ],
    },
    "personal-info": {
      id: "personal-info",
      choices: [
        {
          id: "share-it",
          consequence: { immediate: { privacyScore: -8 }, nextNodeId: "final-review", outcomeTag: "shared-personal-info" },
        },
        {
          id: "keep-it-private",
          consequence: { immediate: { privacyScore: 5 }, nextNodeId: "final-review", outcomeTag: "kept-info-private" },
        },
      ],
    },
    "final-review": {
      id: "final-review",
      choices: [
        {
          id: "submit-without-reviewing",
          consequence: { immediate: { projectQuality: 3 }, nextNodeId: "result", outcomeTag: "submitted-quickly" },
        },
        {
          id: "review-with-an-adult",
          consequence: { immediate: { projectQuality: 7 }, nextNodeId: "result", outcomeTag: "reviewed-with-adult" },
        },
      ],
    },
    recovery: {
      id: "recovery",
      isRecoveryNode: true,
      choices: [
        {
          id: "ask-for-help",
          consequence: { immediate: { projectQuality: 10 }, nextNodeId: "result", outcomeTag: "got-help-ai-builder" },
        },
        {
          id: "start-this-section-over",
          consequence: { immediate: {}, nextNodeId: "result", outcomeTag: "restarted-section" },
        },
      ],
    },
    result: { id: "result", choices: [] },
  },
};
