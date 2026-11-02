import type { RLQVariant, RLQReflectionChoice } from "@/content/real-life-quests/structures";

/**
 * Pure state-transition logic for Real Life Quests' own small, local
 * progress record — a SEPARATE persisted entity from LocalProgressState
 * (see use-real-life-quests.ts for the storage key), the same
 * "self-contained sandbox" pattern src/lib/leadership-quest/state.ts and
 * src/lib/entrepreneur-quest/state.ts already established. The only
 * thing shared with LocalProgressState is the XP award itself, applied
 * directly via the shared `useLocalProgress().completeActivity()` from
 * the mission page — never duplicated here (brief section 8: "Do not
 * create a parallel rewards system").
 *
 * Deliberately tiny: there is no decision-effect table, no stats, no
 * badges — each mission is a standalone real-world activity, not a
 * branching simulation, so "progress" here is just which missions have
 * been started/completed, which version a child picked, and an optional
 * reflection.
 */

export type RLQMissionStatus = "not-started" | "started" | "completed";

/** A small, optional, per-mission visual-interaction record — used by the
 * visual-first pilot (save-for-something-you-love / my-first-mini-business
 * / share-my-idea) to remember a tapped picture-choice (a goal, an item
 * to offer, an idea) and a tapped-step counter (the jar-filling tracker).
 * Deliberately generic so the SAME two fields serve all three pilot
 * missions' different widgets rather than one field per mission. This is
 * a purely local, practice/demonstration aid — it is NOT the mission's
 * authoritative "done" state (that remains `status`/`completeMission`,
 * unchanged) and awards no XP of its own. */
export interface RLQVisualProgress {
  selectedChoiceId: string | null;
  filledSteps: number;
}

function createDefaultVisualProgress(): RLQVisualProgress {
  return { selectedChoiceId: null, filledSteps: 0 };
}

export interface RLQMissionProgress {
  status: RLQMissionStatus;
  /** The version the child is trying/tried — defaults to "standard" the
   * moment a mission is started; switching later is always allowed, it
   * never resets status or the reflection already given. */
  variant: RLQVariant;
  reflectionChoice: RLQReflectionChoice | null;
  /** Always optional — see RLQ_REFLECTION_CHOICES' own comment. Trimmed
   * before saving so a stray space doesn't count as "said something." */
  reflectionText: string;
  visualProgress: RLQVisualProgress;
}

export interface RealLifeQuestsState {
  missions: Record<string, RLQMissionProgress>;
}

function createDefaultMissionProgress(): RLQMissionProgress {
  return { status: "not-started", variant: "standard", reflectionChoice: null, reflectionText: "", visualProgress: createDefaultVisualProgress() };
}

export function createDefaultState(): RealLifeQuestsState {
  return { missions: {} };
}

/** Merges in `visualProgress`'s default shape when reading progress saved
 * before this field existed (an older localStorage record) — the same
 * additive-schema tolerance every other field here already relies on,
 * so a returning child's existing started/completed/variant/reflection
 * data is never lost by this pilot's new field. */
export function getMissionProgress(state: RealLifeQuestsState, missionId: string): RLQMissionProgress {
  const stored = state.missions[missionId];
  if (!stored) return createDefaultMissionProgress();
  return { ...stored, visualProgress: { ...createDefaultVisualProgress(), ...stored.visualProgress } };
}

/** Starting an already-started or already-completed mission is a no-op —
 * a child revisiting a mission card should never be bumped backward from
 * "completed" to "started". */
export function startMission(state: RealLifeQuestsState, missionId: string): RealLifeQuestsState {
  const current = getMissionProgress(state, missionId);
  if (current.status !== "not-started") return state;
  return { missions: { ...state.missions, [missionId]: { ...current, status: "started" } } };
}

export function setMissionVariant(state: RealLifeQuestsState, missionId: string, variant: RLQVariant): RealLifeQuestsState {
  const current = getMissionProgress(state, missionId);
  return { missions: { ...state.missions, [missionId]: { ...current, variant } } };
}

export interface CompleteMissionResult {
  state: RealLifeQuestsState;
  /** True only the FIRST time this mission is marked complete — the
   * mission page uses this to decide whether to award XP, the same
   * first-completion-only guard every other activity in this app uses. */
  wasFirstCompletion: boolean;
}

/** Marking a mission complete is always optional and always available,
 * whether or not it was ever explicitly "started" first (brief section
 * 8: "Mission completion must be optional") — a child who jumps straight
 * to "I did it!" should not be blocked by a missing intermediate step. */
export function completeMission(state: RealLifeQuestsState, missionId: string): CompleteMissionResult {
  const current = getMissionProgress(state, missionId);
  const wasFirstCompletion = current.status !== "completed";
  return {
    state: { missions: { ...state.missions, [missionId]: { ...current, status: "completed" } } },
    wasFirstCompletion,
  };
}

export function setReflection(
  state: RealLifeQuestsState,
  missionId: string,
  reflectionChoice: RLQReflectionChoice | null,
  reflectionText: string
): RealLifeQuestsState {
  const current = getMissionProgress(state, missionId);
  return {
    missions: { ...state.missions, [missionId]: { ...current, reflectionChoice, reflectionText: reflectionText.trim() } },
  };
}

export function countMissionsByStatus(state: RealLifeQuestsState, allMissionIds: string[], status: RLQMissionStatus): number {
  return allMissionIds.filter((id) => getMissionProgress(state, id).status === status).length;
}

/** Records which picture-choice a child tapped (a goal, an item to
 * offer, an idea) — toggling the same choice again clears it, exactly
 * like the reflection-choice toggle, so a tap is never a one-way,
 * unreversible commitment. */
export function setVisualChoice(state: RealLifeQuestsState, missionId: string, choiceId: string): RealLifeQuestsState {
  const current = getMissionProgress(state, missionId);
  const nextChoiceId = current.visualProgress.selectedChoiceId === choiceId ? null : choiceId;
  return {
    missions: {
      ...state.missions,
      [missionId]: { ...current, visualProgress: { ...current.visualProgress, selectedChoiceId: nextChoiceId } },
    },
  };
}

/** The jar/step-tracker's tap-to-fill count, clamped to [0, 5] — a
 * practice visual only, never the mission's real completion state. */
export function setFilledSteps(state: RealLifeQuestsState, missionId: string, filledSteps: number): RealLifeQuestsState {
  const current = getMissionProgress(state, missionId);
  const clamped = Math.max(0, Math.min(5, filledSteps));
  return {
    missions: {
      ...state.missions,
      [missionId]: { ...current, visualProgress: { ...current.visualProgress, filledSteps: clamped } },
    },
  };
}
