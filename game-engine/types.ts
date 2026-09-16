import type { AgeBand } from "@/types/database.types";

/**
 * The complete set of reusable interaction "mechanics" the engine ships
 * with. Every one of the 12 launch games is built by CONFIGURING one of
 * these — none of them has its own bespoke UI. Adding game #13 means
 * writing a new config object (Section "Adding a new game" in
 * money-quest-game-engine.md), not a new component, unless it genuinely
 * needs an 8th interaction pattern this list doesn't cover yet.
 */
export type MechanicType =
  | "sort"            // drag/tap items into 2+ labelled buckets
  | "compare"          // choose the best of 2-3 priced/valued options
  | "allocate"         // distribute a fixed amount across categories
  | "match"            // match pairs (term<->definition, symbol<->name)
  | "numeric"          // compute/enter a number, checked with tolerance
  | "spot"             // select the suspicious/relevant items among several
  | "multiple-choice"  // classic single-best-answer question
  | "mission";         // a realistic situation with several valid choices, each with its own consequence — no single "correct" pick

export type DifficultyTier = "standard" | "challenge";

/** Every round, regardless of mechanic, carries these — this is where
 * the "explain why, never shame" requirement is structurally enforced:
 * `explanation` is a REQUIRED field on every round shape, always shown
 * after an answer (right or wrong), not an optional nicety. */
interface GameRoundBase {
  id: string;
  prompt: string;
  explanation: string;
  hint: string;
}

export interface SortRound extends GameRoundBase {
  mechanic: "sort";
  buckets: { key: string; label: string }[];
  items: { id: string; label: string; correctBucketKey: string }[];
}

export interface CompareOption {
  key: string;
  label: string;
  amountMinorUnits: number;
  /** Optional per-unit detail (e.g. "per 100g") for unit-price rounds
   * like Price Detective — purely informational, the engine doesn't
   * compute this, the config author supplies the already-worked figure
   * so content authors control the numbers precisely. */
  detail?: string;
}

export interface CompareRound extends GameRoundBase {
  mechanic: "compare";
  options: CompareOption[];
  correctOptionKey: string;
}

export interface AllocateCategory {
  key: string;
  label: string;
}

export interface AllocateRound extends GameRoundBase {
  mechanic: "allocate";
  totalMinorUnits: number;
  categories: AllocateCategory[];
  /** A round "passes" once every category's allocation is within its
   * tolerance of the target — this models "there's a sensible range,
   * not one rigid right answer," matching how the curriculum itself
   * treats budgeting (a guideline, not a strict rule). */
  targets: { categoryKey: string; targetMinorUnits: number; toleranceMinorUnits: number }[];
}

export interface MatchPair {
  id: string;
  left: string;
  right: string;
}

export interface MatchRound extends GameRoundBase {
  mechanic: "match";
  pairs: MatchPair[];
}

export interface NumericRound extends GameRoundBase {
  mechanic: "numeric";
  /** The correct answer, always in MAJOR units (e.g. 10 meaning "10
   * coins"), for every currency including zero-decimal ones like JPY —
   * this is deliberately NOT minor units, because a fixed minor-unit
   * value would silently be wrong whenever the same round is played
   * under a currency with a different minorUnitDigits than whichever
   * one the config author was picturing. Major units are the one
   * representation that means the same thing regardless of currency. */
  correctValue: number;
  isCurrency: boolean;
  toleranceValue: number;
  /** Shown as context above the input, e.g. "£100 saved at 5% interest
   * for a year" — supplied pre-formatted by the config author so the
   * engine doesn't need to know currency formatting rules itself for
   * arbitrary prose; the actual answer field IS currency-formatted by
   * the engine when isCurrency is true. */
  givenContext: string;
}

export interface SpotItem {
  id: string;
  text: string;
  isSuspicious: boolean;
}

export interface SpotRound extends GameRoundBase {
  mechanic: "spot";
  scenario: string;
  items: SpotItem[];
}

export interface MultipleChoiceRound extends GameRoundBase {
  mechanic: "multiple-choice";
  options: string[];
  correctOption: string;
}

export interface MissionChoice {
  key: string;
  label: string;
  /** This choice's own specific outcome, shown only after picking it —
   * the whole point of a mission round (per the product brief: "do not
   * simply mark every decision as good or bad") is that this text
   * explains a realistic, nuanced consequence, never a bare
   * correct/incorrect judgment. Every choice has one; none is "the"
   * right answer. */
  consequence: string;
  /** Optional price shown alongside the choice (e.g. "Toy - £6") —
   * purely informational, exactly like CompareOption.amountMinorUnits;
   * never compared against anything since there's no correct choice
   * to check it against. */
  costMinorUnits?: number;
}

export interface MissionRound extends GameRoundBase {
  mechanic: "mission";
  /** The starting situation, e.g. "You have £10." — same role as
   * NumericRound's givenContext: shown as context above the choices. */
  situation: string;
  choices: MissionChoice[];
}

export type GameRound =
  | SortRound
  | CompareRound
  | AllocateRound
  | MatchRound
  | NumericRound
  | SpotRound
  | MultipleChoiceRound
  | MissionRound;

export interface FeedbackCopy {
  /** Always paired with the round's `explanation` — this is the short
   * encouraging line, the explanation is the substantive "why." */
  correct: string;
  /** Must redirect, never shame. See money-quest-game-engine.md's
   * banned/required phrase list — this field is where that rule lives
   * in data, so a content author can't accidentally write a shaming
   * line into a config even if they wanted to skip the doc. */
  incorrect: string;
}

export interface GameVariant {
  ageBand: AgeBand;
  difficulty: DifficultyTier;
  rounds: GameRound[];
  xpReward: number;
  coinRewardMinorUnits: number;
  /** Fraction of rounds that must be correct (retries allowed per round,
   * see GameShell) for the game to count as passed/completed. */
  passingScoreFraction: number;
  estimatedMinutes: number; // for the "2-5 minutes" design target — a content-authoring check, not enforced at runtime
}

export interface GameConfig {
  key: string; // slug, e.g. "needs-or-wants" — primary identifier
  title: string;
  worldId: string;
  topicId: string;
  /** Whether this game's rounds contain currency amounts that must be
   * formatted through the child's own currency (per the currency
   * architecture's "never hardcode a symbol" rule) — every mechanic
   * renderer checks this flag before deciding whether to run amounts
   * through formatCurrency(). */
  usesCurrency: boolean;
  feedback: FeedbackCopy;
  variants: GameVariant[];
}

export function getVariant(
  config: GameConfig,
  ageBand: AgeBand,
  difficulty: DifficultyTier = "standard"
): GameVariant | undefined {
  return (
    config.variants.find((v) => v.ageBand === ageBand && v.difficulty === difficulty) ??
    // Falls back to "standard" difficulty in the child's own age band if
    // a "challenge" variant hasn't been authored yet for this game —
    // never falls back to a DIFFERENT age band, since a Builder game
    // rendered for an Explorer child (or vice versa) is a content bug,
    // not a case to silently paper over.
    config.variants.find((v) => v.ageBand === ageBand && v.difficulty === "standard")
  );
}
