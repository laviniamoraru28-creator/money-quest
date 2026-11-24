import type { MissionDefinition } from "../engine";

/**
 * Pilot mission #7: Leadership Quest, Explorer band (ages 6-8). This
 * is a new, Agency-native mission - it does NOT touch or duplicate
 * the existing Leadership Quest system (src/lib/leadership-quest/
 * state.ts, its own recordChoice/completeMission/LQ_EFFECTS table).
 * That system stays exactly as it is; this is a separate, additional
 * decision scenario using the shared Agency engine, covering the
 * brief's "team formation... cooperation... fairness" requirements at
 * Explorer-band simplicity (2 choices per node).
 *
 * "Build a Fort Together": sharing building blocks, and whether to
 * include someone who feels left out. `teamSpirit` starts low enough
 * that keeping the best blocks for yourself alone breaches the floor.
 */
export const LEADERSHIP_EXPLORER_FORT: MissionDefinition = {
  id: "leadership-explorer-fort",
  quest: "leadership",
  band: "explorer",
  startNodeId: "sharing-blocks",
  startingResources: { teamSpirit: 3 },
  resourceFloors: { teamSpirit: 0 },
  recoveryNodeId: "recovery",
  nodes: {
    "sharing-blocks": {
      id: "sharing-blocks",
      choices: [
        {
          id: "share-the-blocks",
          consequence: { immediate: { teamSpirit: 3 }, nextNodeId: "someone-left-out", outcomeTag: "shared-blocks" },
        },
        // No `requires` guard - keeping the best blocks can genuinely
        // breach the floor.
        {
          id: "keep-best-blocks",
          consequence: { immediate: { teamSpirit: -5 }, nextNodeId: "someone-left-out", outcomeTag: "kept-best-blocks" },
        },
      ],
    },
    "someone-left-out": {
      id: "someone-left-out",
      choices: [
        {
          id: "invite-them-in",
          consequence: { immediate: { teamSpirit: 4 }, nextNodeId: "result", outcomeTag: "invited-them-in" },
        },
        {
          id: "keep-building-without-them",
          consequence: { immediate: { teamSpirit: 1 }, nextNodeId: "result", outcomeTag: "kept-building-without-them" },
        },
      ],
    },
    recovery: {
      id: "recovery",
      isRecoveryNode: true,
      choices: [
        {
          id: "ask-for-help",
          consequence: { immediate: { teamSpirit: 5 }, nextNodeId: "result", outcomeTag: "got-help-leadership-explorer" },
        },
        {
          id: "share-now-instead",
          consequence: { immediate: { teamSpirit: 3 }, nextNodeId: "result", outcomeTag: "shared-now-instead" },
        },
      ],
    },
    result: { id: "result", choices: [] },
  },
};
