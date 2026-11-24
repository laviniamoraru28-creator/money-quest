import type { MissionDefinition } from "../engine";

/**
 * Pilot mission #3: Money Quest, Strategist band (ages 12-14).
 * Strategist requirements from the brief (Phase 5): more complex
 * financial decisions, long-term consequences, ethical dilemmas,
 * evaluation of trade-offs - met with a second tracked resource that
 * isn't spendable money (`communityImpact`), a delayed multi-step
 * payoff that makes "invest now, see the result later" a real
 * trade-off rather than an immediate one, and a deliberately
 * non-judgmental generosity-vs-savings choice (contributing to a
 * fundraiser is never framed as better OR worse than keeping the
 * coins - brief: "evaluate decisions and strategies, not personal
 * identity").
 *
 * Exactly one combination of choices (decline investing, contribute
 * to the fundraiser, then pay for the unexpected repair) breaches the
 * floor - reachable, not accidental, and not a penalty for any single
 * choice in isolation (each of those three choices is harmless on its
 * own; it's the combination that creates real scarcity, same as a
 * real budget).
 */
export const MONEY_STRATEGIST_TERM_ONE: MissionDefinition = {
  id: "money-strategist-term-one",
  quest: "money",
  band: "strategist",
  startNodeId: "decision1",
  startingResources: { coins: 35, communityImpact: 0 },
  resourceFloors: { coins: 0 },
  recoveryNodeId: "recovery",
  nodes: {
    decision1: {
      id: "decision1",
      choices: [
        {
          id: "invest-half",
          consequence: {
            immediate: { coins: -20 },
            delayed: [{ delaySteps: 2, effect: { coins: 35 } }],
            nextNodeId: "decision2",
            outcomeTag: "invested",
          },
        },
        {
          id: "keep-liquid",
          consequence: { immediate: {}, nextNodeId: "decision2", outcomeTag: "kept-liquid" },
        },
      ],
    },
    decision2: {
      id: "decision2",
      choices: [
        {
          id: "contribute-to-fundraiser",
          consequence: {
            immediate: { coins: -15, communityImpact: 10 },
            nextNodeId: "decision3",
            outcomeTag: "contributed",
          },
        },
        {
          id: "keep-for-yourself",
          consequence: { immediate: {}, nextNodeId: "decision3", outcomeTag: "kept-for-self" },
        },
      ],
    },
    decision3: {
      id: "decision3",
      choices: [
        // No `requires` guard - the unexpected repair is real whether
        // or not it's affordable; a resulting breach redirects to
        // recovery rather than being silently blocked.
        {
          id: "pay-for-repair",
          consequence: { immediate: { coins: -30 }, nextNodeId: "result", outcomeTag: "paid-repair" },
        },
        {
          id: "delay-repair",
          consequence: { immediate: {}, nextNodeId: "result", outcomeTag: "delayed-repair" },
        },
      ],
    },
    recovery: {
      id: "recovery",
      isRecoveryNode: true,
      choices: [
        {
          id: "ask-for-help",
          consequence: { immediate: { coins: 20 }, nextNodeId: "result", outcomeTag: "got-help-strategist" },
        },
        {
          id: "reassess-budget",
          consequence: { immediate: {}, nextNodeId: "result", outcomeTag: "reassessed" },
        },
      ],
    },
    result: { id: "result", choices: [] },
  },
};
