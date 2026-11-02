import type { ComponentType } from "react";
import type { GameRound } from "./types";
import { SortMechanic } from "./mechanics/SortMechanic";
import { CompareMechanic } from "./mechanics/CompareMechanic";
import { AllocateMechanic } from "./mechanics/AllocateMechanic";
import { MatchMechanic } from "./mechanics/MatchMechanic";
import { NumericMechanic } from "./mechanics/NumericMechanic";
import { SpotMechanic } from "./mechanics/SpotMechanic";
import { MultipleChoiceMechanic } from "./mechanics/MultipleChoiceMechanic";
import { MissionMechanic } from "./mechanics/MissionMechanic";

export interface MechanicProps<TRound extends GameRound = GameRound> {
  round: TRound;
  currencyCode: string;
  /** The UI's selected language, threaded down from GameShell (which
   * reads it via next-intl's useLocale()) — see the same rationale on
   * MoneyAmount's uiLocale prop for why this is passed explicitly
   * rather than each mechanic calling the hook itself (keeps mechanics
   * simple, single-responsibility components that just render given
   * data, matching how currencyCode is already handled). */
  uiLocale: string;
  usesCurrency: boolean;
  /** The optional second argument exists only for MissionMechanic,
   * which passes the chosen option's key — every other mechanic still
   * calls onAnswer with just the boolean, which remains perfectly
   * valid since the parameter is optional. Entrepreneur Quest is what
   * needed this: it reuses MissionMechanic directly for its
   * decision-based events and challenges, and needs to know WHICH
   * choice a child picked (to persist it), not just that a choice was
   * made. Adding it here, on the shared type, was simpler and more
   * honest than duplicating MissionMechanic's rendering just to get at
   * the same information a different way. */
  onAnswer: (isCorrect: boolean, choiceKey?: string) => void;
  /** True once the round has been answered correctly at least once —
   * mechanics use this to lock further input rather than each
   * reimplementing that rule. */
  isResolved: boolean;
}

/**
 * The single place a mechanic type is wired to its renderer. This is the
 * one file that would need a one-line addition if the engine ever grows
 * an 8th mechanic — every game config just references a mechanic by name.
 */
export const MECHANIC_REGISTRY: Record<GameRound["mechanic"], ComponentType<MechanicProps<any>>> = {
  sort: SortMechanic,
  compare: CompareMechanic,
  allocate: AllocateMechanic,
  match: MatchMechanic,
  numeric: NumericMechanic,
  spot: SpotMechanic,
  "multiple-choice": MultipleChoiceMechanic,
  mission: MissionMechanic,
};
