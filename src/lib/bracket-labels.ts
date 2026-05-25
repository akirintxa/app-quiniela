import { BracketSlot, GroupId, ThirdPlaceAssignment } from "@/types/knockout";
import { ANNEX_COLUMN_TO_SLOT_CODE } from "./bracket-fixtures";

export function groupPosLabel(group: GroupId, position: 1 | 2): string {
  return position === 1 ? `1ro Grupo ${group}` : `2do Grupo ${group}`;
}

export function bestThirdLabel(eligible: GroupId[]): string {
  return `Mejor 3er Grupo ${eligible.join("/")}`;
}

export function winnerLabel(matchId: number): string {
  return `Ganador Partido ${matchId}`;
}

export function loserLabel(matchId: number): string {
  return `Perdedor Partido ${matchId}`;
}

export function slotToPlaceholderCode(slot: BracketSlot, thirdAssignment?: ThirdPlaceAssignment): string {
  if (slot.kind === "group_pos") {
    return `${slot.position}${slot.group}`;
  }
  if (slot.kind === "best_third") {
    if (thirdAssignment?.byAnnexColumn[slot.annexColumn]) {
      const g = thirdAssignment.byAnnexColumn[slot.annexColumn];
      return `3${g}`;
    }
    return ANNEX_COLUMN_TO_SLOT_CODE[slot.annexColumn] ?? "3X?";
  }
  if (slot.kind === "winner") {
    return `W${slot.fromMatchId}`;
  }
  return `L${slot.fromMatchId}`;
}

export function getPlaceholderLabel(
  slot: BracketSlot,
  thirdAssignment?: ThirdPlaceAssignment
): string {
  if (slot.kind === "group_pos") {
    return groupPosLabel(slot.group, slot.position);
  }
  if (slot.kind === "best_third") {
    if (thirdAssignment?.byAnnexColumn[slot.annexColumn]) {
      const g = thirdAssignment.byAnnexColumn[slot.annexColumn];
      return `Mejor 3er Grupo ${g}`;
    }
    return bestThirdLabel(slot.eligible);
  }
  if (slot.kind === "winner") {
    return winnerLabel(slot.fromMatchId);
  }
  return loserLabel(slot.fromMatchId);
}
