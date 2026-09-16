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
  onAnswer: (isCorrect: boolean) => void;
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
