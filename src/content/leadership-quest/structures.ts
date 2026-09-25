/**
 * Structural (locale-independent) data for Leadership Quest — the same
 * structural/translatable split every other content type in this app
 * already uses (curriculum, games, Entrepreneur Quest): ids, ordering,
 * and numeric effect tables live here; every word of prose lives under
 * `leadershipQuest.*` in messages/*.json, looked up via useTranslations()
 * in each page/component, keyed off these ids.
 *
 * Leadership Quest is a THIRD independent track, fully separate from
 * Entrepreneur Quest's state and content (see
 * src/lib/leadership-quest/state.ts for why it has its own storage key
 * rather than sharing EntrepreneurQuestState) — the only thing genuinely
 * shared between the two is the badge mechanism (awardBadge/earnedBadgeIds
 * in local-progress/state.ts), exactly as intended by the brief's "keep
 * Leadership Quest independently playable" instruction.
 */

/** Exactly 4 recurring fictional team characters (brief section 3) —
 * original, avoiding the brief's own illustrative archetypes verbatim.
 * `strengthTags` drive the "Meet Your Team"/"First Challenge" matching
 * mini-games (which task suits which character); every other detail
 * (name, personality, challenge, interest, communication style) is prose
 * in messages/*.json under `leadershipQuest.characters.<id>.*`. */
export type LQCharacterId = "nadia" | "oren" | "priya" | "theo";

export interface LQCharacterStructure {
  id: LQCharacterId;
  strengthTags: string[];
}

export const LQ_CHARACTERS: LQCharacterStructure[] = [
  { id: "nadia", strengthTags: ["creativity", "bigPictureThinking"] },
  { id: "oren", strengthTags: ["practicalSkills", "attentionToDetail"] },
  { id: "priya", strengthTags: ["communication", "confidence"] },
  { id: "theo", strengthTags: ["organization", "reliability"] },
];

export const LQ_CHARACTER_IDS: LQCharacterId[] = LQ_CHARACTERS.map((c) => c.id);

/** The 6 non-ranked leadership "patterns" the end-of-quest Leadership
 * Profile (brief section 13) is built from — never a score. Order here
 * is the deterministic tie-break order used by computeLeadershipProfile
 * when two archetypes are tallied equally. */
export type LQArchetypeId =
  | "the-listener"
  | "the-problem-solver"
  | "the-team-builder"
  | "the-calm-thinker"
  | "the-encourager"
  | "the-big-picture-thinker";

export const LQ_ARCHETYPE_IDS: LQArchetypeId[] = [
  "the-listener",
  "the-problem-solver",
  "the-team-builder",
  "the-calm-thinker",
  "the-encourager",
  "the-big-picture-thinker",
];

/** One numeric consequence, applied to the shared Team State and/or
 * tallied toward a Leadership Profile archetype — deliberately small
 * fields only (brief section 5: "do not create an unnecessarily complex
 * simulation"). Never shown to the child as raw numbers: every choice's
 * own natural-language consequence sentence lives in messages/*.json. */
export interface LQEffect {
  trustDelta?: number;
  moraleDelta?: number;
  progressDelta?: number;
  energyDelta?: number;
  /** Which archetype this specific choice reflects, if any — most
   * "fixed outcome" mini-game completions and some dialogue choices
   * carry no tag at all, which is intentional: not every action needs
   * to say something about leadership style. */
  archetypeTag?: LQArchetypeId;
}

/**
 * Every scoreable event in the whole quest — both real branching
 * decisions (a MissionMechanic round with several genuine trade-off
 * choices) AND fixed-outcome mini-game completions (Match/Spot/Allocate/
 * Sort rounds, which always eventually succeed since none of those
 * mechanics has a "wrong forever" state) — share this ONE table and ONE
 * choiceKey shape, so state.ts needs only one recordChoice() function
 * for everything. A mini-game's fixed outcome is simply an event with a
 * single choiceKey, "completed".
 */
export const LQ_EFFECTS: Record<string, Record<string, LQEffect>> = {
  "meet-your-team-match": {
    completed: { progressDelta: 5 },
  },
  "meet-your-team-reflection": {
    excited: { progressDelta: 5, moraleDelta: 0.2, archetypeTag: "the-encourager" },
    "nervous-but-ready": { progressDelta: 5, trustDelta: 0.1, archetypeTag: "the-calm-thinker" },
    "not-sure-yet": { progressDelta: 5 },
  },
  "first-challenge-match": {
    completed: { progressDelta: 12, trustDelta: 0.3, archetypeTag: "the-team-builder" },
  },
  "everyone-has-an-idea-choice": {
    "pick-one-idea": { progressDelta: 10, moraleDelta: -0.2 },
    "combine-both-ideas": { progressDelta: 6, moraleDelta: 0.3, trustDelta: 0.2, archetypeTag: "the-team-builder" },
    "let-them-decide-together": { progressDelta: 4, moraleDelta: 0.2, trustDelta: 0.3, archetypeTag: "the-listener" },
    "go-with-your-own-idea": { progressDelta: 8, moraleDelta: -0.3, trustDelta: -0.2 },
  },
  "missing-task-choice": {
    "ask-what-happened": { progressDelta: 8, trustDelta: 0.3, archetypeTag: "the-listener" },
    "do-it-yourself-quietly": { progressDelta: 10, trustDelta: -0.2 },
    "remind-them-firmly": { progressDelta: 6, moraleDelta: -0.1, trustDelta: 0.1 },
    "wait-and-see": { progressDelta: 2, moraleDelta: -0.1, energyDelta: -0.1 },
  },
  "big-mistake-choice": {
    "blame-publicly": { progressDelta: 10, trustDelta: -0.4, moraleDelta: -0.3 },
    "fix-it-yourself": { progressDelta: 12, trustDelta: -0.1, energyDelta: -0.2 },
    "talk-privately": { progressDelta: 6, trustDelta: 0.4, moraleDelta: 0.2, archetypeTag: "the-encourager" },
    "ignore-it": { progressDelta: 4, moraleDelta: -0.1 },
  },
  "angry-customer-choice": {
    "listen-first": { progressDelta: 8, trustDelta: 0.2, moraleDelta: 0.1, archetypeTag: "the-listener" },
    "apologise-and-fix-it": { progressDelta: 10, moraleDelta: 0.1, archetypeTag: "the-problem-solver" },
    "explain-why-you-were-right": { progressDelta: 5, moraleDelta: -0.1, trustDelta: -0.1 },
    "let-a-teammate-handle-it": { progressDelta: 6, trustDelta: 0.2, archetypeTag: "the-team-builder" },
  },
  "better-idea-choice": {
    "use-their-idea": { progressDelta: 10, moraleDelta: 0.3, trustDelta: 0.2, archetypeTag: "the-big-picture-thinker" },
    "combine-ideas": { progressDelta: 8, moraleDelta: 0.2, archetypeTag: "the-team-builder" },
    "stick-with-your-idea": { progressDelta: 6, moraleDelta: -0.2 },
    "ask-the-team-to-vote": { progressDelta: 5, trustDelta: 0.2, archetypeTag: "the-listener" },
  },
  "team-conflict-spot": {
    completed: { progressDelta: 5 },
  },
  "team-conflict-choice": {
    "hear-both-sides": { progressDelta: 8, trustDelta: 0.3, archetypeTag: "the-listener" },
    "pick-a-side": { progressDelta: 6, moraleDelta: -0.3, trustDelta: -0.1 },
    "find-common-ground": { progressDelta: 7, moraleDelta: 0.3, trustDelta: 0.2, archetypeTag: "the-problem-solver" },
    "tell-them-to-stop-and-move-on": { progressDelta: 10, moraleDelta: -0.2, energyDelta: -0.1 },
  },
  "motivation-problem-spot": {
    completed: { progressDelta: 5, archetypeTag: "the-problem-solver" },
  },
  "motivation-problem-choice": {
    "explain-the-goal-again": { progressDelta: 8, moraleDelta: 0.3, archetypeTag: "the-big-picture-thinker" },
    "check-in-with-each-person": { progressDelta: 6, moraleDelta: 0.3, trustDelta: 0.2, archetypeTag: "the-listener" },
    "push-through-and-keep-going": { progressDelta: 10, moraleDelta: -0.3, energyDelta: -0.3 },
    "take-a-short-break": { progressDelta: 3, moraleDelta: 0.2, energyDelta: 0.3 },
  },
  "the-deadline-allocate": {
    completed: { progressDelta: 8 },
  },
  "the-deadline-choice": {
    "explain-the-new-plan-to-everyone": { progressDelta: 6, trustDelta: 0.3, moraleDelta: 0.1, archetypeTag: "the-listener" },
    "just-tell-people-what-to-drop": { progressDelta: 8, moraleDelta: -0.2 },
    "ask-the-team-what-to-cut": { progressDelta: 5, trustDelta: 0.3, archetypeTag: "the-team-builder" },
  },
  "pressure-test-sort": {
    completed: { progressDelta: 10, archetypeTag: "the-calm-thinker" },
  },
  "pressure-test-reflection": {
    "stay-calm-and-work-the-list": { progressDelta: 5, moraleDelta: 0.2, archetypeTag: "the-calm-thinker" },
    "panic-a-little-but-push-through": { progressDelta: 5, energyDelta: -0.2 },
    "ask-the-team-for-help": { progressDelta: 5, trustDelta: 0.2, archetypeTag: "the-team-builder" },
  },
  "final-challenge-match": {
    completed: { progressDelta: 10, trustDelta: 0.2, archetypeTag: "the-team-builder" },
  },
  "final-challenge-choice-1": {
    "trust-the-team-to-handle-it": { progressDelta: 8, trustDelta: 0.3, archetypeTag: "the-team-builder" },
    "double-check-everything-yourself": { progressDelta: 10, trustDelta: -0.1, energyDelta: -0.2 },
    "ask-for-a-quick-check-in": { progressDelta: 6, trustDelta: 0.2, moraleDelta: 0.2, archetypeTag: "the-listener" },
  },
  "final-challenge-choice-2": {
    "celebrate-what-the-team-achieved": { progressDelta: 10, moraleDelta: 0.4, archetypeTag: "the-encourager" },
    "immediately-plan-the-next-project": { progressDelta: 10, moraleDelta: -0.1, archetypeTag: "the-big-picture-thinker" },
    "thank-each-person-individually": { progressDelta: 8, trustDelta: 0.3, moraleDelta: 0.3, archetypeTag: "the-encourager" },
  },
  // Uh-oh moments (brief section 10) — small, mostly one-off nudges.
  "uh-oh-printer": {
    "borrow-one-from-another-team": { progressDelta: 3 },
    "present-without-printed-materials": { progressDelta: 2, moraleDelta: 0.1 },
    "delay-the-presentation": { progressDelta: 1, moraleDelta: -0.1 },
  },
  "uh-oh-teammate-absent": {
    "share-out-their-tasks": { progressDelta: 3, trustDelta: 0.1, archetypeTag: "the-team-builder" },
    "wait-until-they-are-back": { progressDelta: 1 },
    "do-their-work-yourself": { progressDelta: 3, energyDelta: -0.2 },
  },
  "uh-oh-customer-changed-mind": {
    "adjust-the-plan-together": { progressDelta: 3, trustDelta: 0.1, archetypeTag: "the-big-picture-thinker" },
    "explain-why-you-cant-change-now": { progressDelta: 2, moraleDelta: -0.1 },
    "panic-and-start-over-completely": { progressDelta: 1, energyDelta: -0.2 },
  },
  "uh-oh-misunderstood-instructions": {
    "explain-the-mix-up-and-fix-it-together": { progressDelta: 3, trustDelta: 0.1, archetypeTag: "the-problem-solver" },
    "quietly-fix-it-yourself": { progressDelta: 3, trustDelta: -0.1 },
    "blame-the-instructions": { progressDelta: 1 },
  },
  "uh-oh-idea-stops-working": {
    "try-a-different-approach-together": { progressDelta: 3, moraleDelta: 0.1, archetypeTag: "the-big-picture-thinker" },
    "keep-trying-the-same-way": { progressDelta: 1, energyDelta: -0.2 },
    "ask-the-team-for-new-ideas": { progressDelta: 3, trustDelta: 0.1, archetypeTag: "the-listener" },
  },
  // Leadership Lab (brief section 11) — pure practice, deliberately no
  // team-state effect, but choices still carry archetypeTags so the Lab
  // can (gently) contribute to the Leadership Profile's tally too.
  "lab-rejected-idea": {
    "say-sorry-and-explain-why": { archetypeTag: "the-encourager" },
    "ask-them-to-explain-more": { archetypeTag: "the-listener" },
    "say-nothing-and-move-on": {},
  },
  "lab-quiet-teammate": {
    "ask-them-directly-what-they-think": { archetypeTag: "the-listener" },
    "give-them-a-small-task-to-build-confidence": { archetypeTag: "the-encourager" },
    "let-them-stay-quiet": {},
  },
  "lab-hide-or-tell": {
    "tell-the-team-right-away": { archetypeTag: "the-problem-solver" },
    "fix-it-quietly-first": {},
    "hide-it-and-hope-no-one-notices": {},
  },
  "lab-doesnt-agree": {
    "ask-them-to-explain-their-thinking": { archetypeTag: "the-listener" },
    "explain-why-your-plan-is-better": {},
    "suggest-talking-about-it-after": { archetypeTag: "the-calm-thinker" },
  },
  "lab-credit-for-idea": {
    "point-out-whose-idea-it-was": { archetypeTag: "the-encourager" },
    "say-nothing-its-not-a-big-deal": {},
    "ask-them-how-they-feel-about-it": { archetypeTag: "the-listener" },
  },
  "lab-tired-teammate": {
    "check-in-again-later": { archetypeTag: "the-listener" },
    "take-something-off-their-plate": { archetypeTag: "the-encourager" },
    "take-their-word-for-it": {},
  },
  "lab-new-member": {
    "introduce-them-to-everyone-and-explain-the-plan": { archetypeTag: "the-team-builder" },
    "let-them-figure-it-out": {},
    "ask-the-team-to-help-them-settle-in": { archetypeTag: "the-team-builder" },
  },
  "lab-mixed-feedback": {
    "say-what-you-liked-and-what-to-change": { archetypeTag: "the-problem-solver" },
    "just-say-its-not-good-enough": {},
    "avoid-saying-anything-and-fix-it-yourself": {},
  },
};

export type LQMissionKind = "match" | "mission-choice" | "spot" | "allocate" | "sort" | "multi-step";

export interface LQMatchPairStructure {
  id: string;
  characterId: LQCharacterId;
}

export interface LQMissionStructure {
  id: string;
  order: number;
  kind: LQMissionKind;
  /** Scoreable event ids that occur within this mission, in order — see
   * LQ_EFFECTS. A "match"/"spot"/"allocate"/"sort" mission's own fixed
   * outcome is itself one event (choiceKey "completed"); a
   * "mission-choice" mission has one branching decision event; a
   * "multi-step" mission (only Mission 12) has several. */
  eventIds: string[];
  /** Present only for "match"-kind sub-parts (Missions 1, 2, 12) — the
   * correct task->character assignments MatchMechanic checks against.
   * Task label text lives in messages/*.json; character names are
   * looked up separately via LQ_CHARACTERS ids. */
  matchPairs?: LQMatchPairStructure[];
}

/**
 * The ~12 core missions (brief section 6) — ids are stable structural
 * keys; every mission's dialogue, situation text, choice labels and
 * consequence sentences live in messages/*.json under
 * `leadershipQuest.missions.<id>.*`. Route:
 * /leadership-quest/missions/[missionId] renders whichever "kind" of
 * mission body a given id needs (see the mission page component) —
 * one dynamic route rather than 12 hand-written ones, since each
 * mission's shape differs (closer to how Entrepreneur Quest's Business
 * Problems are each addressed by id, not a single linear stepper).
 */
export const LQ_MISSIONS: LQMissionStructure[] = [
  {
    id: "meet-your-team",
    order: 1,
    kind: "match",
    eventIds: ["meet-your-team-match", "meet-your-team-reflection"],
    matchPairs: [
      { id: "come-up-with-ideas", characterId: "nadia" },
      { id: "fix-something-broken", characterId: "oren" },
      { id: "talk-to-a-visitor", characterId: "priya" },
      { id: "keep-track-of-the-plan", characterId: "theo" },
    ],
  },
  {
    id: "first-challenge",
    order: 2,
    kind: "match",
    eventIds: ["first-challenge-match"],
    matchPairs: [
      { id: "design-the-poster", characterId: "nadia" },
      { id: "build-the-display", characterId: "oren" },
      { id: "explain-it-to-visitors", characterId: "priya" },
      { id: "make-the-plan", characterId: "theo" },
    ],
  },
  { id: "everyone-has-an-idea", order: 3, kind: "mission-choice", eventIds: ["everyone-has-an-idea-choice"] },
  { id: "missing-task", order: 4, kind: "mission-choice", eventIds: ["missing-task-choice"] },
  { id: "big-mistake", order: 5, kind: "mission-choice", eventIds: ["big-mistake-choice"] },
  { id: "angry-customer", order: 6, kind: "mission-choice", eventIds: ["angry-customer-choice"] },
  { id: "better-idea", order: 7, kind: "mission-choice", eventIds: ["better-idea-choice"] },
  { id: "team-conflict", order: 8, kind: "spot", eventIds: ["team-conflict-spot", "team-conflict-choice"] },
  { id: "motivation-problem", order: 9, kind: "spot", eventIds: ["motivation-problem-spot", "motivation-problem-choice"] },
  { id: "the-deadline", order: 10, kind: "allocate", eventIds: ["the-deadline-allocate", "the-deadline-choice"] },
  { id: "pressure-test", order: 11, kind: "sort", eventIds: ["pressure-test-sort", "pressure-test-reflection"] },
  {
    id: "final-challenge",
    order: 12,
    kind: "multi-step",
    eventIds: ["final-challenge-match", "final-challenge-choice-1", "final-challenge-choice-2"],
    matchPairs: [
      { id: "come-up-with-the-idea", characterId: "nadia" },
      { id: "build-the-thing", characterId: "oren" },
      { id: "present-it-to-people", characterId: "priya" },
      { id: "keep-everyone-on-track", characterId: "theo" },
    ],
  },
];

export function getLQMissionById(id: string): LQMissionStructure | undefined {
  return LQ_MISSIONS.find((m) => m.id === id);
}

export function getLQMissionByOrder(order: number): LQMissionStructure | undefined {
  return LQ_MISSIONS.find((m) => m.order === order);
}

export const LQ_MISSION_IDS: string[] = LQ_MISSIONS.map((m) => m.id);

/** "The Missing Task" (Mission 4) — a small progressive-disclosure
 * investigate step before the real choice (brief: "must investigate
 * before deciding"), same pattern as Entrepreneur Quest's
 * BusinessProblemMechanic clue reveals: plain local state, no wrong
 * taps, no team-state effect on its own. */
export const LQ_MISSING_TASK_CLUE_IDS = ["ask-the-teammate", "check-the-shared-plan", "ask-another-teammate"];

/** "Spot the Problem" scenario for Mission 8 (Team Conflict) — the two
 * inflaming statements are `isSuspicious`, matching SpotMechanic's exact-
 * set-match contract. */
export const LQ_TEAM_CONFLICT_SPOT_ITEM_IDS: { id: string; isSuspicious: boolean }[] = [
  { id: "you-never-listen-to-me", isSuspicious: true },
  { id: "i-think-we-see-it-differently", isSuspicious: false },
  { id: "youre-doing-this-on-purpose", isSuspicious: true },
  { id: "can-we-slow-down-for-a-second", isSuspicious: false },
  { id: "fine-whatever-you-want", isSuspicious: false },
];

/** "Spot the Problem" scenario for Mission 9 (Motivation Problem) — of
 * the brief's own 5 candidate causes, exactly 2 are genuinely true for
 * this scenario (unclear goal, feeling ignored); the rest are here as
 * honest, plausible-but-not-quite-right distractors, not obviously
 * wrong ones. */
export const LQ_MOTIVATION_SPOT_ITEM_IDS: { id: string; isSuspicious: boolean }[] = [
  { id: "unclear-goal", isSuspicious: true },
  { id: "too-much-work", isSuspicious: false },
  { id: "boredom", isSuspicious: false },
  { id: "feeling-ignored", isSuspicious: true },
  { id: "lack-of-progress", isSuspicious: false },
];

/** "Team Priorities" (Mission 10, The Deadline) — AllocateMechanic used
 * with usesCurrency:false: a fixed "1000 minutes" of remaining time split
 * across 5 tasks. AllocateMechanic's stepper moves in fixed 100-unit
 * clicks (see AllocateMechanic.tsx's STEP_MINOR_UNITS) regardless of
 * currency, so every target/tolerance here is a multiple of 100 —
 * otherwise a target could sit at a value the stepper can never land on.
 * Targets are tolerance-based (a sensible range, not one rigid split),
 * matching how AllocateMechanic already models budgeting elsewhere. */
export const LQ_DEADLINE_TOTAL_MINUTES = 1000;
export const LQ_DEADLINE_CATEGORIES = [
  { key: "finish-the-main-feature", targetMinutes: 400, toleranceMinutes: 100 },
  { key: "fix-the-known-problem", targetMinutes: 300, toleranceMinutes: 100 },
  { key: "polish-the-design", targetMinutes: 100, toleranceMinutes: 100 },
  { key: "write-the-instructions", targetMinutes: 100, toleranceMinutes: 100 },
  { key: "extra-nice-to-have", targetMinutes: 100, toleranceMinutes: 100 },
];

/** "Put It in Order" / pressure triage (Mission 11, The Pressure Test) —
 * SortMechanic reused with buckets relabeled as urgency, not category. */
export const LQ_PRESSURE_TEST_BUCKET_KEYS = ["deal-with-first", "deal-with-next", "can-wait"] as const;
export const LQ_PRESSURE_TEST_ITEMS: { id: string; correctBucketKey: (typeof LQ_PRESSURE_TEST_BUCKET_KEYS)[number] }[] = [
  { id: "a-teammate-is-stuck-and-blocked", correctBucketKey: "deal-with-first" },
  { id: "the-customer-is-waiting-for-an-answer", correctBucketKey: "deal-with-first" },
  { id: "one-teammate-seems-upset", correctBucketKey: "deal-with-next" },
  { id: "a-small-typo-in-the-document", correctBucketKey: "can-wait" },
  { id: "an-idea-for-a-later-improvement", correctBucketKey: "can-wait" },
];

/** "Uh-oh" unexpected events (brief section 10) — each fires once, the
 * first time its trigger mission is completed, inserted before the next
 * mission. Content-only additions to LQ_EFFECTS above provide the
 * numbers; ids here just say when each one appears. */
export interface LQUhOhEventStructure {
  id: string;
  triggerAfterMissionId: string;
}

export const LQ_UH_OH_EVENTS: LQUhOhEventStructure[] = [
  { id: "uh-oh-printer", triggerAfterMissionId: "first-challenge" },
  { id: "uh-oh-teammate-absent", triggerAfterMissionId: "big-mistake" },
  { id: "uh-oh-customer-changed-mind", triggerAfterMissionId: "better-idea" },
  { id: "uh-oh-misunderstood-instructions", triggerAfterMissionId: "team-conflict" },
  { id: "uh-oh-idea-stops-working", triggerAfterMissionId: "the-deadline" },
];

/** Leadership Lab (brief section 11) — short standalone practice,
 * always available, never gated behind mission progress. */
export const LQ_LAB_SCENARIO_IDS: string[] = [
  "lab-rejected-idea",
  "lab-quiet-teammate",
  "lab-hide-or-tell",
  "lab-doesnt-agree",
  "lab-credit-for-idea",
  "lab-tired-teammate",
  "lab-new-member",
  "lab-mixed-feedback",
];

/** Leadership Quest's own badges (brief section 14) — `lq-` prefix keeps
 * them separate from Entrepreneur Quest's `eq-` badges inside the ONE
 * shared `earnedBadgeIds` array (see local-progress/state.ts's
 * awardBadge). Each has a concrete, checkable trigger — never a
 * competitive ranking. */
export const LQ_BADGE_IDS = {
  firstLeader: "lq-first-leader", // completing "meet-your-team"
  teamBuilder: "lq-team-builder", // completing "first-challenge"
  goodListener: "lq-good-listener", // first choice tagged "the-listener"
  problemSolver: "lq-problem-solver", // first choice tagged "the-problem-solver"
  calmUnderPressure: "lq-calm-under-pressure", // completing "pressure-test"
  finalLeader: "lq-final-leader", // completing "final-challenge"
} as const;

/** Starting Team State (brief section 5) — deliberately mid-scale, not
 * maxed, so growth (or a genuine dip) is visible from the first mission. */
export const LQ_STARTING_TRUST = 3;
export const LQ_STARTING_MORALE = 3;
export const LQ_STARTING_PROGRESS = 0;
export const LQ_STARTING_ENERGY = 4;
export const LQ_MAX_TEAM_STAT = 5;
export const LQ_MIN_TEAM_STAT = 0;
export const LQ_MAX_PROGRESS = 100;
export const LQ_MIN_PROGRESS = 0;
