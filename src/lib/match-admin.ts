import type { Match } from "@/types";

export function resolveKnockoutWinnerId(
  match: Pick<Match, "stage" | "team_a_id" | "team_b_id">,
  resultA: number,
  resultB: number,
  winnerId: number | null
): number | null {
  if (match.stage === "group") return null;
  if (resultA > resultB) return match.team_a_id;
  if (resultB > resultA) return match.team_b_id;
  return winnerId;
}

export type MatchAdminStatus = "scheduled" | "live" | "finished";

export function getMatchAdminStatus(
  match: Pick<Match, "result_a" | "result_b" | "is_finished">
): MatchAdminStatus {
  if (match.is_finished) return "finished";
  if (match.result_a !== null && match.result_b !== null) return "live";
  return "scheduled";
}

type PenaltyWinnerMatch = Pick<
  Match,
  "winner_id" | "team_a_id" | "team_b_id" | "team_a" | "team_b"
> & {
  knockout_slot_a_id?: number | null;
  knockout_slot_b_id?: number | null;
};

/** Nombre del equipo que pasa tras penales (empate en marcador + winner_id). IDs comparados con Number por si vienen string desde la BD. */
export function getKnockoutPenaltyWinnerDisplayName(
  match: PenaltyWinnerMatch,
  resolvedSlot?: { teamAName: string; teamBName: string } | null
): string | null {
  const widRaw = match.winner_id;
  if (widRaw == null) return null;
  const w = Number(widRaw);
  if (Number.isNaN(w)) return null;

  const aId = Number(match.team_a_id);
  const bId = Number(match.team_b_id);

  if (!Number.isNaN(aId) && w === aId) {
    return resolvedSlot?.teamAName ?? match.team_a?.name ?? null;
  }
  if (!Number.isNaN(bId) && w === bId) {
    return resolvedSlot?.teamBName ?? match.team_b?.name ?? null;
  }

  const taId = match.team_a?.id != null ? Number(match.team_a.id) : NaN;
  const tbId = match.team_b?.id != null ? Number(match.team_b.id) : NaN;
  if (!Number.isNaN(taId) && w === taId) {
    return resolvedSlot?.teamAName ?? match.team_a?.name ?? null;
  }
  if (!Number.isNaN(tbId) && w === tbId) {
    return resolvedSlot?.teamBName ?? match.team_b?.name ?? null;
  }

  // `winner_id` en BD suele ser el FK del slot (placeholder); el UI puede sustituir team_*_id por el equipo resuelto.
  const slotA =
    match.knockout_slot_a_id != null ? Number(match.knockout_slot_a_id) : NaN;
  const slotB =
    match.knockout_slot_b_id != null ? Number(match.knockout_slot_b_id) : NaN;
  if (!Number.isNaN(slotA) && w === slotA) {
    return resolvedSlot?.teamAName ?? match.team_a?.name ?? null;
  }
  if (!Number.isNaN(slotB) && w === slotB) {
    return resolvedSlot?.teamBName ?? match.team_b?.name ?? null;
  }

  return null;
}
