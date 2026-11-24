import type { MissionDefinition } from "../engine";

/**
 * Pilot mission #4: AI Quest, Explorer band (ages 6-8). AI Quest is
 * the one quest with no existing simulator to reuse or duplicate - a
 * genuinely new Agency-native mission. Brief requirements for this
 * quest: "when AI is useful... which information to trust... how to
 * verify AI-generated information."
 *
 * "The Helper Robot" gives two answers over the mission - one
 * deliberately wrong, one correct - without ever telling the child
 * which is which in advance, so the only way to do well is to check
 * rather than trust blindly every time. Kept to Explorer's 2-choice
 * limit. `confidence` starts low enough that blindly trusting the
 * WRONG answer alone breaches the floor - reachable, not contrived.
 */
export const AI_EXPLORER_HELPER_ROBOT: MissionDefinition = {
  id: "ai-explorer-helper-robot",
  quest: "ai",
  band: "explorer",
  startNodeId: "question1",
  startingResources: { confidence: 3 },
  resourceFloors: { confidence: 0 },
  recoveryNodeId: "recovery",
  nodes: {
    question1: {
      id: "question1",
      choices: [
        // The robot's answer here is wrong - no `requires` guard, so
        // trusting it can genuinely breach the floor.
        {
          id: "trust-the-robot",
          consequence: { immediate: { confidence: -5 }, nextNodeId: "question2", outcomeTag: "trusted-wrong-answer" },
        },
        {
          id: "check-with-grownup",
          consequence: { immediate: { confidence: 2 }, nextNodeId: "question2", outcomeTag: "checked-first" },
        },
      ],
    },
    question2: {
      id: "question2",
      choices: [
        // The robot's answer here is correct - trusting it is also a
        // perfectly fine strategy, just not an unconditional one.
        {
          id: "trust-the-robot",
          consequence: { immediate: { confidence: 3 }, nextNodeId: "result", outcomeTag: "trusted-right-answer" },
        },
        {
          id: "check-with-grownup",
          consequence: { immediate: { confidence: 1 }, nextNodeId: "result", outcomeTag: "checked-again" },
        },
      ],
    },
    recovery: {
      id: "recovery",
      isRecoveryNode: true,
      choices: [
        {
          id: "ask-for-help",
          consequence: { immediate: { confidence: 5 }, nextNodeId: "result", outcomeTag: "got-help-ai-explorer" },
        },
        { id: "try-again", consequence: { immediate: {}, nextNodeId: "result", outcomeTag: "tried-again" } },
      ],
    },
    result: { id: "result", choices: [] },
  },
};
