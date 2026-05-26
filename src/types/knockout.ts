import { Match, Prediction, Team } from "@/types";

export type GroupId = "A" | "B" | "C" | "D" | "E" | "F" | "G" | "H" | "I" | "J" | "K" | "L";

export type KnockoutStage =
  | "round_32"
  | "round_16"
  | "quarter_final"
  | "semi_final"
  | "third_place"
  | "final";

export type StandingsMode = "real" | "predicted";

export type DisplaySource = "real" | "predicted";

export type SlotKind = "group_pos" | "best_third" | "winner" | "loser";

export interface GroupPosSlot {
  kind: "group_pos";
  group: GroupId;
  position: 1 | 2;
}

export interface BestThirdSlot {
  kind: "best_third";
  eligible: GroupId[];
  /** Annex C column key (1A, 1B, 1D, 1E, 1G, 1I, 1K, 1L) */
  annexColumn: "1A" | "1B" | "1D" | "1E" | "1G" | "1I" | "1K" | "1L";
}

export interface WinnerSlot {
  kind: "winner";
  fromMatchId: number;
}

export interface LoserSlot {
  kind: "loser";
  fromMatchId: number;
}

export type BracketSlot = GroupPosSlot | BestThirdSlot | WinnerSlot | LoserSlot;

export interface BracketMatchDef {
  id: number;
  stage: KnockoutStage;
  slotA: BracketSlot;
  slotB: BracketSlot;
  startTime: string;
  bracketRound: number;
  bracketIndex: number;
}

export type SlotSource = "placeholder" | "predicted" | "confirmed";

export interface KnockoutTeamSlot {
  placeholderLabel: string;
  placeholderCode: string;
  displayTeam?: Team;
  predictedTeam?: Team;
  /** Resultado real cuando difiere del pronóstico mostrado (texto auxiliar en la tarjeta). */
  officialTeam?: Team;
  source: SlotSource;
  isCorrect?: boolean;
}

export interface KnockoutMatchViewModel {
  match: Match;
  slotA: KnockoutTeamSlot;
  slotB: KnockoutTeamSlot;
  userPrediction?: Prediction;
}

export interface ThirdPlaceAssignment {
  combinationId: number;
  /** Maps annex column (1A, 1E, ...) to resolved group third e.g. 3E */
  byAnnexColumn: Record<string, GroupId>;
  /** Maps 3X1..3X8 slot codes to group letter */
  bySlotCode: Record<string, GroupId>;
}

export interface ResolveKnockoutInput {
  knockoutMatches: Match[];
  groupMatches: Match[];
  predictions: Prediction[];
  allTeams: Team[];
  displaySource: DisplaySource;
}
