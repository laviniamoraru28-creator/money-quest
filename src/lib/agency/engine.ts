/**
 * Shared Agency decision/consequence engine.
 *
 * This is a thin, reusable KERNEL for "choose -> see what happens ->
 * recover and try again" missions across Money, Leadership and AI
 * Quest content that doesn't already have an equivalent engine of its
 * own. It deliberately does NOT replace:
 * - Entrepreneur Quest's own engine (src/lib/entrepreneur-quest/state.ts),
 *   which already has a mature decision-effects table, a transparent
 *   runSimulator(), and a non-punitive rescue/recovery flow.
 * - Investing Lab (src/investing-lab/*), which already implements
 *   "invest in simulated businesses" with buy/sell + insufficient-funds
 *   guards.
 * - LocalProgressState's own savings-goal mechanic (createGoal /
 *   contributeToGoal / withdrawFromGoal in src/lib/local-progress/state.ts).
 * A new mission can be built on one of those instead of this engine
 * when its mechanic already fits what they do.
 *
 * Design rules (non-negotiable, from the Agency brief):
 * - Pure and deterministic. No randomness, no external API, no I/O.
 *   Every function here takes its inputs and returns a new value; it
 *   never mutates its arguments and never touches localStorage/the
 *   network (persistence lives in use-agency-mission.ts, same split as
 *   every other quest's state.ts/use-X.ts pair in this codebase).
 * - No judgment of the child. Outcomes are tagged for feedback lookup
 *   (`outcomeTag`) but the engine itself never produces or stores a
 *   label like "irresponsible" or "unsuccessful" - that would belong
 *   to copy, which lives in messages/*.json, never here.
 * - Asking for recovery is always allowed and never costs a resource
 *   or is recorded any differently from an ordinary choice.
 * - A resource floor breach (not enough coins, etc.) redirects to the
 *   mission's own recovery node instead of silently failing or ending
 *   the mission - "meaningful failure", not a dead end.
 */
import type { AgeBand } from "@/types/database.types";

export type Quest = "money" | "entrepreneur" | "leadership" | "ai";

/** Named numeric pools a mission tracks - coins, reputation, team morale,
 * trust, etc. Which keys exist is entirely up to each MissionDefinition;
 * the engine itself has no fixed notion of "coins". */
export type ResourcePool = Readonly<Record<string, number>>;

export interface DelayedEffect {
  /** How many further decisions must be taken before this applies -
   * models "unexpected expense next week" rather than everything
   * landing immediately. 0 would be redundant with `immediate`. */
  readonly delaySteps: number;
  readonly effect: Readonly<Record<string, number>>;
}

export interface Consequence {
  /** Resource deltas applied the moment this choice is taken. */
  readonly immediate?: Readonly<Record<string, number>>;
  /** Resource deltas that land one or more decisions later. */
  readonly delayed?: ReadonlyArray<DelayedEffect>;
  /** Node this choice leads to. A node with zero choices is a terminal
   * node - reaching one ends the mission (see `decide` below). */
  readonly nextNodeId: string;
  /** Machine-readable outcome tag for feedback copy lookup - e.g.
   * "saved-enough" / "overspent-but-recovered". Never a judgment of
   * the child, only of the strategy. Optional for choices that don't
   * need distinct feedback. */
  readonly outcomeTag?: string;
}

export interface Choice {
  readonly id: string;
  readonly consequence: Consequence;
  /** Resources required just to select this choice, e.g. {coins: 5}.
   * The engine itself enforces this (an unaffordable choice is a
   * no-op, never silently "charges" a negative balance); UI should
   * also use `availableChoices` to grey it out ahead of time rather
   * than let a child tap it and see nothing happen. */
  readonly requires?: Readonly<Record<string, number>>;
}

export interface DecisionNode {
  readonly id: string;
  readonly choices: ReadonlyArray<Choice>;
  /** True for a mission's recovery node(s) - purely descriptive, lets
   * UI/analytics recognise "this is the ask-for-help/reorganise step"
   * without string-matching an id. */
  readonly isRecoveryNode?: boolean;
}

export interface MissionDefinition {
  readonly id: string;
  readonly quest: Quest;
  readonly band: AgeBand;
  readonly startNodeId: string;
  readonly nodes: Readonly<Record<string, DecisionNode>>;
  readonly startingResources: ResourcePool;
  /** A resource dropping below its floor (default 0 for any resource
   * not listed) redirects to `recoveryNodeId` instead of applying the
   * choice that would have breached it. */
  readonly resourceFloors?: Readonly<Record<string, number>>;
  /** Required whenever any node's choices can consume a floored
   * resource - enforced by `validateMission`, not by the type system,
   * since not every mission has a recovery path (a pure "explore and
   * compare" mission with no scarcity might not need one). */
  readonly recoveryNodeId?: string;
}

export interface HistoryEntry {
  readonly nodeId: string;
  /** "__recovery__" for a requestRecovery() call, otherwise a real Choice id. */
  readonly choiceId: string;
  readonly resourcesAfter: ResourcePool;
  readonly timestamp: number;
}

interface PendingEffect {
  readonly dueAtStep: number;
  readonly effect: Readonly<Record<string, number>>;
}

export interface MissionState {
  readonly missionId: string;
  readonly currentNodeId: string;
  readonly resources: ResourcePool;
  readonly history: ReadonlyArray<HistoryEntry>;
  readonly pendingEffects: ReadonlyArray<PendingEffect>;
  readonly status: "in-progress" | "completed" | "recovering";
  readonly stepCount: number;
}

function isTerminal(def: MissionDefinition, nodeId: string): boolean {
  return (def.nodes[nodeId]?.choices.length ?? 0) === 0;
}

/** Starts (or restarts, for replay/"try again") a mission from its
 * defined starting resources - always available, never blocked by a
 * previous unsuccessful run. */
export function startMission(def: MissionDefinition): MissionState {
  return {
    missionId: def.id,
    currentNodeId: def.startNodeId,
    resources: { ...def.startingResources },
    history: [],
    pendingEffects: [],
    status: isTerminal(def, def.startNodeId) ? "completed" : "in-progress",
    stepCount: 0,
  };
}

/** Every choice at the current node, annotated with whether the child
 * can actually afford it right now - UI should disable (never hide,
 * so the alternative is still visible to compare) an unaffordable one. */
export function availableChoices(
  def: MissionDefinition,
  state: MissionState
): ReadonlyArray<Choice & { readonly affordable: boolean }> {
  const node = def.nodes[state.currentNodeId];
  if (!node) return [];
  return node.choices.map((choice) => ({
    ...choice,
    affordable: Object.entries(choice.requires ?? {}).every(
      ([key, min]) => (state.resources[key] ?? 0) >= min
    ),
  }));
}

function addEffect(resources: ResourcePool, effect: Readonly<Record<string, number>>): ResourcePool {
  const next: Record<string, number> = { ...resources };
  for (const [key, delta] of Object.entries(effect)) {
    next[key] = (next[key] ?? 0) + delta;
  }
  return next;
}

function breachesFloor(def: MissionDefinition, resources: ResourcePool): boolean {
  if (!def.resourceFloors) return false;
  return Object.entries(def.resourceFloors).some(([key, floor]) => (resources[key] ?? 0) < floor);
}

/**
 * Applies one choice. Returns the SAME state object (no-op) if the
 * choice doesn't exist at the current node or isn't affordable - the
 * engine never partially applies a choice, and never throws for a bad
 * id (a stale UI render calling decide() with an id from a previous
 * node is a no-op, not a crash).
 *
 * `now` is injectable for deterministic tests; real callers can omit it.
 */
export function decide(
  def: MissionDefinition,
  state: MissionState,
  choiceId: string,
  now: number = Date.now()
): MissionState {
  if (state.status === "completed") return state;
  const node = def.nodes[state.currentNodeId];
  const choice = node?.choices.find((c) => c.id === choiceId);
  if (!choice) return state;
  const affordable = Object.entries(choice.requires ?? {}).every(
    ([key, min]) => (state.resources[key] ?? 0) >= min
  );
  if (!affordable) return state;

  const nextStepCount = state.stepCount + 1;

  // Apply this choice's immediate effect, then settle any previously
  // scheduled delayed effects now due - in that order, so a delayed
  // effect scheduled to land "next step" always does, regardless of
  // what this step's own immediate effect was.
  let resources = addEffect(state.resources, choice.consequence.immediate ?? {});
  const stillPending: PendingEffect[] = [];
  for (const pending of state.pendingEffects) {
    if (pending.dueAtStep <= nextStepCount) {
      resources = addEffect(resources, pending.effect);
    } else {
      stillPending.push(pending);
    }
  }
  for (const delayed of choice.consequence.delayed ?? []) {
    stillPending.push({ dueAtStep: nextStepCount + delayed.delaySteps, effect: delayed.effect });
  }

  const history: HistoryEntry[] = [
    ...state.history,
    { nodeId: state.currentNodeId, choiceId, resourcesAfter: resources, timestamp: now },
  ];

  // The breach check only intercepts a choice made from an ORDINARY
  // node - once a child is already on the recovery node working
  // through it, its own choices (a top-up, or "reorganise and carry
  // on with what's left") must resolve exactly as authored, even if a
  // resource is still below floor. Without this guard, "reorganise"
  // (which doesn't change resources) would bounce straight back to
  // recovery forever: an actual dead end, the opposite of what a
  // recovery path is for.
  if (!node?.isRecoveryNode && breachesFloor(def, resources) && def.recoveryNodeId) {
    return {
      missionId: state.missionId,
      currentNodeId: def.recoveryNodeId,
      resources,
      history,
      pendingEffects: stillPending,
      status: "recovering",
      stepCount: nextStepCount,
    };
  }

  const nextNodeId = choice.consequence.nextNodeId;
  return {
    missionId: state.missionId,
    currentNodeId: nextNodeId,
    resources,
    history,
    pendingEffects: stillPending,
    status: isTerminal(def, nextNodeId) ? "completed" : "in-progress",
    stepCount: nextStepCount,
  };
}

/**
 * Explicit "I'd like help" / "let me reorganise" action. Always
 * available regardless of resources or current node, never costs
 * anything, and is never recorded or framed any differently from an
 * ordinary choice in the history - recovery brief requirement:
 * "Asking for help must never be punished."
 */
export function requestRecovery(
  def: MissionDefinition,
  state: MissionState,
  now: number = Date.now()
): MissionState {
  if (!def.recoveryNodeId || state.status === "completed") return state;
  return {
    ...state,
    currentNodeId: def.recoveryNodeId,
    status: "recovering",
    history: [
      ...state.history,
      { nodeId: state.currentNodeId, choiceId: "__recovery__", resourcesAfter: state.resources, timestamp: now },
    ],
  };
}

/** Pure "what would happen if" preview - since decide() never mutates
 * anything, this is just decide() without persisting the result.
 * Lets UI show a child "compare alternatives" before committing. */
export function previewChoice(
  def: MissionDefinition,
  state: MissionState,
  choiceId: string,
  now: number = Date.now()
): MissionState {
  return decide(def, state, choiceId, now);
}

/** Replay from scratch - a fresh startMission(), named separately so
 * call sites read as "the child chose to try again" rather than an
 * implementation detail. */
export function resetMission(def: MissionDefinition): MissionState {
  return startMission(def);
}

export interface MissionValidationError {
  readonly nodeId: string;
  readonly choiceId?: string;
  readonly message: string;
}

/**
 * Structural checks a mission author should run before shipping
 * content (e.g. from a test), not required at runtime: every
 * `nextNodeId` resolves to a real node, `recoveryNodeId` (if any)
 * resolves to a real, non-terminal-unless-intended node, and
 * `startNodeId` exists. Catches a typo'd node id at authoring time
 * instead of as a silent dead-end in play.
 */
export function validateMission(def: MissionDefinition): ReadonlyArray<MissionValidationError> {
  const errors: MissionValidationError[] = [];
  if (!def.nodes[def.startNodeId]) {
    errors.push({ nodeId: def.startNodeId, message: "startNodeId does not exist in nodes" });
  }
  if (def.recoveryNodeId && !def.nodes[def.recoveryNodeId]) {
    errors.push({ nodeId: def.recoveryNodeId, message: "recoveryNodeId does not exist in nodes" });
  }
  for (const node of Object.values(def.nodes)) {
    for (const choice of node.choices) {
      if (!def.nodes[choice.consequence.nextNodeId]) {
        errors.push({
          nodeId: node.id,
          choiceId: choice.id,
          message: `nextNodeId "${choice.consequence.nextNodeId}" does not exist in nodes`,
        });
      }
    }
  }
  return errors;
}
