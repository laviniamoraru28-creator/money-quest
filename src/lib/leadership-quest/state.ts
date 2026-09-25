import {
  LQ_EFFECTS,
  LQ_ARCHETYPE_IDS,
  LQ_STARTING_TRUST,
  LQ_STARTING_MORALE,
  LQ_STARTING_PROGRESS,
  LQ_STARTING_ENERGY,
  LQ_MAX_TEAM_STAT,
  LQ_MIN_TEAM_STAT,
  LQ_MAX_PROGRESS,
  LQ_MIN_PROGRESS,
  type LQEffect,
  type LQArchetypeId,
} from "@/content/leadership-quest/structures";

/**
 * Pure state-transition logic for Leadership Quest's own Team State —
 * a SEPARATE persisted entity from both LocalProgressState and
 * EntrepreneurQuestState (see use-leadership-quest.ts for the storage
 * key), following the exact same "self-contained sandbox" pattern
 * src/lib/entrepreneur-quest/state.ts already established (which itself
 * mirrors src/simulator/engine.ts). Badges earned here still go into the
 * ONE shared `earnedBadgeIds` array in LocalProgressState (via
 * local-progress/state.ts's awardBadge) — that part is deliberately
 * shared, everything else is not (brief section 15: "do not tightly
 * couple the two state systems").
 */

export interface LQTeamState {
  trust: number;
  morale: number;
  progress: number;
  energy: number;
}

export function createDefaultTeamState(): LQTeamState {
  return { trust: LQ_STARTING_TRUST, morale: LQ_STARTING_MORALE, progress: LQ_STARTING_PROGRESS, energy: LQ_STARTING_ENERGY };
}

/** One recorded choice, in the order it was made — used by both
 * computeLeadershipProfile (brief section 13, tallied from ACTUAL
 * choices) and deriveDominantTag (brief section 6, Mission 12
 * referencing "some of the child's previous choices"). Kept as an
 * ordered list rather than relying on `leadershipChoices`'s map, since a
 * map has no order and profile ties are broken deterministically by
 * LQ_ARCHETYPE_IDS order, not by recency. */
export interface LQReflectionEntry {
  eventId: string;
  choiceKey: string;
}

export interface LeadershipQuestState {
  team: LQTeamState;
  completedMissionIds: string[];
  completedLabScenarioIds: string[];
  /** eventId -> choiceKey, mirrors EntrepreneurQuestState.decisionChoices
   * exactly: shows a choice as already-made if a round is revisited, and
   * guards recordChoice against double-applying the same effect. */
  leadershipChoices: Record<string, string>;
  uhOhEventsSeenIds: string[];
  reflectionHistory: LQReflectionEntry[];
}

export function createDefaultState(): LeadershipQuestState {
  return {
    team: createDefaultTeamState(),
    completedMissionIds: [],
    completedLabScenarioIds: [],
    leadershipChoices: {},
    uhOhEventsSeenIds: [],
    reflectionHistory: [],
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function applyEffectToTeam(team: LQTeamState, effect: LQEffect): LQTeamState {
  return {
    trust: clamp(Math.round((team.trust + (effect.trustDelta ?? 0)) * 10) / 10, LQ_MIN_TEAM_STAT, LQ_MAX_TEAM_STAT),
    morale: clamp(Math.round((team.morale + (effect.moraleDelta ?? 0)) * 10) / 10, LQ_MIN_TEAM_STAT, LQ_MAX_TEAM_STAT),
    progress: clamp(team.progress + (effect.progressDelta ?? 0), LQ_MIN_PROGRESS, LQ_MAX_PROGRESS),
    energy: clamp(Math.round((team.energy + (effect.energyDelta ?? 0)) * 10) / 10, LQ_MIN_TEAM_STAT, LQ_MAX_TEAM_STAT),
  };
}

/**
 * Records which choice was picked for a given event AND applies that
 * choice's real effect (see LQ_EFFECTS) to the Team State — used for
 * every scoreable moment in the whole quest: mission decisions, fixed
 * mini-game completions (a single "completed" choiceKey), uh-oh events,
 * and Leadership Lab scenarios (whose effects are empty objects, by
 * design — see LQ_EFFECTS's Lab entries). Guarded against
 * double-application exactly like Entrepreneur Quest's recordDecision:
 * revisiting an already-decided event records the same choice again but
 * never re-applies its effect a second time.
 */
export function recordChoice(state: LeadershipQuestState, eventId: string, choiceKey: string): LeadershipQuestState {
  const alreadyDecided = state.leadershipChoices[eventId] !== undefined;
  const withChoice = { ...state, leadershipChoices: { ...state.leadershipChoices, [eventId]: choiceKey } };
  if (alreadyDecided) return withChoice;

  const effect = LQ_EFFECTS[eventId]?.[choiceKey];
  const withTeam = effect ? { ...withChoice, team: applyEffectToTeam(withChoice.team, effect) } : withChoice;
  return { ...withTeam, reflectionHistory: [...withTeam.reflectionHistory, { eventId, choiceKey }] };
}

export function completeMission(state: LeadershipQuestState, missionId: string): LeadershipQuestState {
  if (state.completedMissionIds.includes(missionId)) return state;
  return { ...state, completedMissionIds: [...state.completedMissionIds, missionId] };
}

export function completeLabScenario(state: LeadershipQuestState, scenarioId: string): LeadershipQuestState {
  if (state.completedLabScenarioIds.includes(scenarioId)) return state;
  return { ...state, completedLabScenarioIds: [...state.completedLabScenarioIds, scenarioId] };
}

export function markUhOhSeen(state: LeadershipQuestState, uhOhId: string): LeadershipQuestState {
  if (state.uhOhEventsSeenIds.includes(uhOhId)) return state;
  return { ...state, uhOhEventsSeenIds: [...state.uhOhEventsSeenIds, uhOhId] };
}

/** True once the child has ever made a choice tagged with the given
 * archetype — used only to trigger the "lq-good-listener"/
 * "lq-problem-solver" badges (brief section 14), never to compute or
 * show a score. */
export function hasEverChosenArchetype(state: LeadershipQuestState, archetypeId: LQArchetypeId): boolean {
  return state.reflectionHistory.some((entry) => LQ_EFFECTS[entry.eventId]?.[entry.choiceKey]?.archetypeTag === archetypeId);
}

/**
 * Tallies every recorded choice's archetypeTag and returns the top 1-2
 * archetypes (brief section 13) — deterministic ties broken by
 * LQ_ARCHETYPE_IDS's fixed order, never randomly and never as a
 * percentage/score. Returns an empty array if no tagged choice has been
 * made yet (e.g. viewing the profile before playing) rather than
 * guessing one.
 */
export function computeLeadershipProfile(reflectionHistory: LQReflectionEntry[]): LQArchetypeId[] {
  const tally = new Map<LQArchetypeId, number>();
  for (const entry of reflectionHistory) {
    const tag = LQ_EFFECTS[entry.eventId]?.[entry.choiceKey]?.archetypeTag;
    if (tag) tally.set(tag, (tally.get(tag) ?? 0) + 1);
  }
  if (tally.size === 0) return [];

  const ranked = LQ_ARCHETYPE_IDS.filter((id) => tally.has(id)).sort((a, b) => (tally.get(b) ?? 0) - (tally.get(a) ?? 0));
  return ranked.slice(0, 2);
}

/**
 * The single most-tallied archetype so far — used only by Mission 12's
 * final-challenge-choice-1 to pick which framing text variant to show
 * (brief section 6: "the final mission should reference some of the
 * child's previous choices"). Returns null if nothing is tagged yet, in
 * which case the mission page falls back to a neutral framing.
 */
export function deriveDominantTag(reflectionHistory: LQReflectionEntry[]): LQArchetypeId | null {
  const top = computeLeadershipProfile(reflectionHistory);
  return top[0] ?? null;
}
