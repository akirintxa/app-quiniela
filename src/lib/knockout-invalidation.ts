import { GroupId } from "@/types/knockout";
import {
  BRACKET_FIXTURES,
  getDownstreamMatchIds,
  KNOCKOUT_MATCH_IDS,
} from "./bracket-fixtures";
import { BracketSlot } from "@/types/knockout";

function slotReferencesGroup(slot: BracketSlot, groupId: GroupId): boolean {
  if (slot.kind === "group_pos" && slot.group === groupId) return true;
  if (slot.kind === "best_third" && slot.eligible.includes(groupId)) return true;
  return false;
}

/** Match IDs whose slots depend on a group's classification */
export function getKnockoutMatchIdsAffectedByGroup(groupId: GroupId): number[] {
  const seedIds = new Set<number>();

  for (const fixture of BRACKET_FIXTURES) {
    if (slotReferencesGroup(fixture.slotA, groupId) || slotReferencesGroup(fixture.slotB, groupId)) {
      seedIds.add(fixture.id);
    }
  }

  const all = new Set<number>();
  for (const id of seedIds) {
    all.add(id);
    getDownstreamMatchIds(id).forEach((d) => all.add(d));
  }

  return Array.from(all);
}

/** All knockout match IDs (when any group changes, third-place annex may reshuffle all 3X slots) */
export function getAllKnockoutMatchIdsWithThirdPlaceSlots(): number[] {
  const ids = new Set<number>();
  for (const fixture of BRACKET_FIXTURES) {
    if (fixture.slotA.kind === "best_third" || fixture.slotB.kind === "best_third") {
      ids.add(fixture.id);
      getDownstreamMatchIds(fixture.id).forEach((d) => ids.add(d));
    }
  }
  return Array.from(ids);
}

/** Al cambiar un grupo, vaciar todas las predicciones de eliminatorias (el cuadro entero depende de la clasificación). */
export function getMatchIdsToInvalidateOnGroupChange(_groupId: GroupId): number[] {
  return KNOCKOUT_MATCH_IDS;
}

export function getMatchIdsToInvalidateOnKnockoutChange(matchId: number): number[] {
  return [matchId, ...getDownstreamMatchIds(matchId)];
}
