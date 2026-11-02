/**
 * Structural (locale-independent) data for Real Life Quests — the same
 * structural/translatable split every other content type in this app
 * uses (curriculum, games, Entrepreneur Quest, Leadership Quest): ids,
 * category, ordering, and supervision level live here; every word of
 * prose lives under `realLifeQuests.*` in messages/*.json, looked up via
 * useTranslations() in the hub/mission pages, keyed off these ids.
 *
 * Real Life Quests is a fourth, independent "track" in the same sense
 * Entrepreneur Quest and Leadership Quest are: its own content namespace,
 * its own small localStorage-backed state (src/lib/real-life-quests),
 * reusing only the shared `useLocalProgress()` XP-award mechanism — never
 * a parallel rewards system. Unlike EQ/LQ it has no stage sequence or
 * decision-effect tables: every mission is a standalone, optional,
 * real-world activity, so this file is intentionally much smaller than
 * entrepreneur-quest/structures.ts or leadership-quest/structures.ts.
 */

export type RLQCategory = "money-skills" | "entrepreneurship" | "leadership";

/** How much adult involvement a mission needs — never a gate that blocks
 * a child from reading or trying the content, just an honest label shown
 * on the card and the mission page (brief section 7: "any real selling,
 * payments, community events or customer interactions must require an
 * appropriate adult's involvement and supervision"). */
export type RLQSupervision = "independent" | "with-adult" | "adult-required";

/** One of the 5 existing, already-shipped destinations a mission can
 * optionally point to (brief section 3: "links to relevant existing
 * lessons or games when a suitable connection exists"). Each key maps to
 * one shared `realLifeQuests.linkedActivity.<key>` label and a fixed,
 * always-accessible href — never a stage- or progress-gated deep link,
 * so the link is valid regardless of what the child has already done in
 * that other track. */
export type RLQLinkedActivity = "savingsGoals" | "priceDetectiveGame" | "buildABudgetGame" | "entrepreneurQuest" | "leadershipQuest";

export const RLQ_LINKED_ACTIVITY_HREFS: Record<RLQLinkedActivity, string> = {
  savingsGoals: "/play/goals",
  priceDetectiveGame: "/play/world/market-town",
  buildABudgetGame: "/play/world/golden-vault",
  entrepreneurQuest: "/entrepreneur-quest",
  leadershipQuest: "/leadership-quest",
};

export interface RLQMissionStructure {
  id: string;
  category: RLQCategory;
  /** Display/reading order within its category (1-4 per category). */
  order: number;
  supervision: RLQSupervision;
  /** Modest, flat XP reward for genuine participation — reused from the
   * exact same `applyActivityCompletion()` every curriculum lesson and
   * game already uses, awarded once on first completion regardless of
   * which version (standard/independent/simpler) was tried, and with NO
   * coin reward: this is about real-world learning, not virtual earning
   * (brief section 2: "The objective is learning and autonomy, not
   * maximizing earnings"). */
  xpReward: number;
  linkedActivity?: RLQLinkedActivity;
}

/**
 * All 12 missions (brief section 4), 4 per category. Ids are stable,
 * English-only structural keys; every piece of prose for a mission lives
 * at `realLifeQuests.missions.<id>.*` in messages/*.json.
 */
export const RLQ_MISSIONS: RLQMissionStructure[] = [
  // Money Skills
  { id: "save-for-something-you-love", category: "money-skills", order: 1, supervision: "independent", xpReward: 15, linkedActivity: "savingsGoals" },
  { id: "the-price-detective", category: "money-skills", order: 2, supervision: "with-adult", xpReward: 10, linkedActivity: "priceDetectiveGame" },
  { id: "plan-a-shopping-trip", category: "money-skills", order: 3, supervision: "with-adult", xpReward: 15, linkedActivity: "buildABudgetGame" },
  { id: "resource-rescue", category: "money-skills", order: 4, supervision: "independent", xpReward: 10 },

  // Entrepreneurship
  { id: "make-something", category: "entrepreneurship", order: 1, supervision: "independent", xpReward: 10, linkedActivity: "entrepreneurQuest" },
  { id: "my-first-mini-business", category: "entrepreneurship", order: 2, supervision: "adult-required", xpReward: 20, linkedActivity: "entrepreneurQuest" },
  { id: "test-my-idea", category: "entrepreneurship", order: 3, supervision: "with-adult", xpReward: 15, linkedActivity: "entrepreneurQuest" },
  { id: "understand-the-numbers", category: "entrepreneurship", order: 4, supervision: "independent", xpReward: 15, linkedActivity: "entrepreneurQuest" },

  // Leadership
  { id: "solve-a-real-problem", category: "leadership", order: 1, supervision: "independent", xpReward: 10, linkedActivity: "leadershipQuest" },
  { id: "make-something-together", category: "leadership", order: 2, supervision: "with-adult", xpReward: 15, linkedActivity: "leadershipQuest" },
  { id: "share-my-idea", category: "leadership", order: 3, supervision: "independent", xpReward: 10, linkedActivity: "leadershipQuest" },
  { id: "learn-change-and-try-again", category: "leadership", order: 4, supervision: "independent", xpReward: 10, linkedActivity: "leadershipQuest" },
];

export const RLQ_CATEGORIES: RLQCategory[] = ["money-skills", "entrepreneurship", "leadership"];

export function getRLQMissionById(id: string): RLQMissionStructure | undefined {
  return RLQ_MISSIONS.find((m) => m.id === id);
}

export function getRLQMissionsByCategory(category: RLQCategory): RLQMissionStructure[] {
  return RLQ_MISSIONS.filter((m) => m.category === category).sort((a, b) => a.order - b.order);
}

/** The 3 response-method variants every mission must offer (brief
 * section 5): the regular steps, a more independent/challenging take, and
 * a simpler/visual/adult-supported take. A 4th, separate adaptation for
 * non-speaking/not-yet-reading children (`nonverbalAdaptation` in the
 * messages namespace) is shown alongside all three, not gated behind a
 * mode switch — never a separate "accessibility mode" to toggle into. */
export type RLQVariant = "standard" | "independent" | "simpler";

export const RLQ_VARIANTS: RLQVariant[] = ["standard", "independent", "simpler"];

/** The reflection step's quick, no-writing-required response options
 * (brief section 5: "a reflection prompt with multiple response
 * methods") — shown as large tappable choices; the free-text box next to
 * them is always optional, never required to mark a mission complete. */
export type RLQReflectionChoice = "great" | "okay" | "tricky" | "idea";

export const RLQ_REFLECTION_CHOICES: RLQReflectionChoice[] = ["great", "okay", "tricky", "idea"];
