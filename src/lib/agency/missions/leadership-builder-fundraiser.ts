import type { MissionDefinition } from "../engine";

/**
 * Pilot mission #8: Leadership Quest, Builder band (ages 9-11). New,
 * Agency-native content - the existing Leadership Quest system stays
 * untouched. Brief requirements: task allocation, conflict
 * resolution, simple team management, unexpected events.
 *
 * "Planning the Class Fundraiser": four decisions, a second tracked
 * resource (`projectProgress`, separate from `teamMorale`) - Builder's
 * established "second resource = real complexity" pattern. The one
 * combination that breaches the floor (assigning tasks yourself, then
 * letting a disagreement go unresolved) does so early, at decision 2,
 * skipping the final two decisions entirely.
 */
export const LEADERSHIP_BUILDER_FUNDRAISER: MissionDefinition = {
  id: "leadership-builder-fundraiser",
  quest: "leadership",
  band: "builder",
  startNodeId: "assign-tasks",
  startingResources: { teamMorale: 5, projectProgress: 0 },
  resourceFloors: { teamMorale: 0, projectProgress: 0 },
  recoveryNodeId: "recovery",
  nodes: {
    "assign-tasks": {
      id: "assign-tasks",
      choices: [
        {
          id: "let-everyone-pick",
          consequence: { immediate: { teamMorale: 8 }, nextNodeId: "disagreement", outcomeTag: "let-everyone-pick" },
        },
        {
          id: "assign-tasks-yourself",
          consequence: { immediate: { projectProgress: 10 }, nextNodeId: "disagreement", outcomeTag: "assigned-tasks-yourself" },
        },
      ],
    },
    disagreement: {
      id: "disagreement",
      choices: [
        // No `requires` guard - letting a disagreement go unresolved
        // can genuinely breach the floor.
        {
          id: "let-them-work-it-out",
          consequence: { immediate: { teamMorale: -6 }, nextNodeId: "falling-behind", outcomeTag: "let-them-work-it-out" },
        },
        {
          id: "help-them-find-a-compromise",
          consequence: { immediate: { teamMorale: 5 }, nextNodeId: "falling-behind", outcomeTag: "helped-find-compromise" },
        },
      ],
    },
    "falling-behind": {
      id: "falling-behind",
      choices: [
        {
          id: "push-the-team-harder",
          consequence: { immediate: { projectProgress: 8 }, nextNodeId: "credit", outcomeTag: "pushed-team-harder" },
        },
        {
          id: "ask-who-needs-help",
          consequence: { immediate: { teamMorale: 6 }, nextNodeId: "credit", outcomeTag: "asked-who-needs-help" },
        },
      ],
    },
    credit: {
      id: "credit",
      choices: [
        {
          id: "take-credit-yourself",
          consequence: { immediate: { teamMorale: -3 }, nextNodeId: "result", outcomeTag: "took-credit-yourself" },
        },
        {
          id: "share-credit-with-team",
          consequence: { immediate: { teamMorale: 7 }, nextNodeId: "result", outcomeTag: "shared-credit-with-team" },
        },
      ],
    },
    recovery: {
      id: "recovery",
      isRecoveryNode: true,
      choices: [
        {
          id: "ask-for-help",
          consequence: { immediate: { teamMorale: 8 }, nextNodeId: "result", outcomeTag: "got-help-leadership-builder" },
        },
        {
          id: "apologize-and-reset",
          consequence: { immediate: { teamMorale: 4 }, nextNodeId: "result", outcomeTag: "apologized-and-reset" },
        },
      ],
    },
    result: { id: "result", choices: [] },
  },
};
