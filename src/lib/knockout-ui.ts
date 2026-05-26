import { Match, Prediction, Team } from "@/types";
import { KnockoutMatchViewModel } from "@/types/knockout";
import { resolveKnockoutBracket } from "./knockout";

export type MatchCardExtras = Match & {
  placeholder_a?: string;
  placeholder_b?: string;
  bracket_label_a?: string;
  bracket_label_b?: string;
  is_confirmed_a?: boolean;
  is_confirmed_b?: boolean;
  ghost_team_a?: string;
  ghost_team_b?: string;
};

/** Cruces oficiales del torneo (sin proyección por predicciones). */
export function viewModelToMatchCardReal(
  vm: KnockoutMatchViewModel
): MatchCardExtras {
  const confirmedA =
    vm.slotA.source === "confirmed" && vm.slotA.displayTeam != null;
  const confirmedB =
    vm.slotB.source === "confirmed" && vm.slotB.displayTeam != null;

  return {
    ...vm.match,
    team_a: confirmedA ? vm.slotA.displayTeam : undefined,
    team_b: confirmedB ? vm.slotB.displayTeam : undefined,
    team_a_id: confirmedA ? vm.slotA.displayTeam!.id : vm.match.team_a_id,
    team_b_id: confirmedB ? vm.slotB.displayTeam!.id : vm.match.team_b_id,
    placeholder_a: vm.slotA.placeholderCode,
    placeholder_b: vm.slotB.placeholderCode,
    bracket_label_a: vm.slotA.placeholderLabel,
    bracket_label_b: vm.slotB.placeholderLabel,
    is_confirmed_a: confirmedA,
    is_confirmed_b: confirmedB,
  };
}

export function resolveKnockoutTeamsForLeague(
  knockoutMatches: Match[],
  groupMatches: Match[],
  allTeams: Team[],
  predictions: Prediction[] = []
): MatchCardExtras[] {
  const vms = resolveKnockoutBracket({
    knockoutMatches,
    groupMatches,
    predictions,
    allTeams,
    displaySource: "real",
  });
  return vms.map(viewModelToMatchCardReal);
}

export function viewModelToMatchCard(vm: KnockoutMatchViewModel): MatchCardExtras {
  const displayA = vm.slotA.displayTeam;
  const displayB = vm.slotB.displayTeam;

  return {
    ...vm.match,
    team_a: displayA ?? vm.match.team_a,
    team_b: displayB ?? vm.match.team_b,
    team_a_id: displayA?.id ?? vm.match.team_a_id,
    team_b_id: displayB?.id ?? vm.match.team_b_id,
    placeholder_a: vm.slotA.placeholderCode,
    placeholder_b: vm.slotB.placeholderCode,
    is_confirmed_a: vm.slotA.source === "confirmed",
    is_confirmed_b: vm.slotB.source === "confirmed",
    ghost_team_a:
      vm.slotA.predictedTeam &&
      displayA &&
      vm.slotA.predictedTeam.id !== displayA.id
        ? vm.slotA.predictedTeam.name
        : undefined,
    ghost_team_b:
      vm.slotB.predictedTeam &&
      displayB &&
      vm.slotB.predictedTeam.id !== displayB.id
        ? vm.slotB.predictedTeam.name
        : undefined,
  };
}

export interface MatchDraft {
  scoreA: number | string;
  scoreB: number | string;
  winnerId: number | null;
  savedScoreA: number | string;
  savedScoreB: number | string;
  savedWinnerId: number | null;
}

export function draftFromPrediction(pred?: Prediction | null): MatchDraft {
  const scoreA = pred?.predicted_a ?? "";
  const scoreB = pred?.predicted_b ?? "";
  const winnerId = pred?.predicted_winner_id ?? null;
  return {
    scoreA,
    scoreB,
    winnerId,
    savedScoreA: scoreA,
    savedScoreB: scoreB,
    savedWinnerId: winnerId,
  };
}

export function isDraftDirty(d: MatchDraft): boolean {
  return (
    d.scoreA !== d.savedScoreA ||
    d.scoreB !== d.savedScoreB ||
    d.winnerId !== d.savedWinnerId
  );
}

export function isDraftValid(
  d: MatchDraft,
  isKnockout: boolean
): boolean {
  if (d.scoreA === "" || d.scoreB === "") return false;
  if (isKnockout && Number(d.scoreA) === Number(d.scoreB) && !d.winnerId) {
    return false;
  }
  return true;
}
