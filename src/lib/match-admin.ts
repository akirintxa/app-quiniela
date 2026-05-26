import type { Match, Prediction } from "@/types";

export type KnockoutResolvedForWinner = Pick<
  Match,
  "team_a_id" | "team_b_id" | "team_a" | "team_b"
> & {
  knockout_slot_a_id?: number | null;
  knockout_slot_b_id?: number | null;
};

export function resolvedKnockoutSideNationalId(
  resolved: KnockoutResolvedForWinner,
  side: "a" | "b"
): number | null {
  if (side === "a") {
    const id = resolved.team_a?.id ?? resolved.team_a_id;
    return id != null && !Number.isNaN(Number(id)) ? Number(id) : null;
  }
  const id = resolved.team_b?.id ?? resolved.team_b_id;
  return id != null && !Number.isNaN(Number(id)) ? Number(id) : null;
}

/**
 * ID del equipo nacional ganador en un partido KO con resultado oficial,
 * usando la fila resuelta del bracket (no los FK placeholder de `matches`).
 */
export function getKnockoutOfficialWinnerTeamId(
  raw: Pick<
    Match,
    | "winner_id"
    | "result_a"
    | "result_b"
    | "team_a_id"
    | "team_b_id"
    | "team_a"
    | "team_b"
    | "stage"
  >,
  resolved: KnockoutResolvedForWinner | null | undefined
): number | null {
  if (raw.stage === "group") return null;
  if (raw.result_a === null || raw.result_b === null) return null;
  if (!resolved) return null;

  const ra = Number(raw.result_a);
  const rb = Number(raw.result_b);
  if (Number.isNaN(ra) || Number.isNaN(rb)) return null;

  if (ra > rb) return resolvedKnockoutSideNationalId(resolved, "a");
  if (rb > ra) return resolvedKnockoutSideNationalId(resolved, "b");

  const widRaw = raw.winner_id;
  if (widRaw == null) return null;
  const w = Number(widRaw);
  if (Number.isNaN(w)) return null;

  const aId = Number(resolved.team_a_id);
  const bId = Number(resolved.team_b_id);
  if (!Number.isNaN(aId) && w === aId) return resolvedKnockoutSideNationalId(resolved, "a");
  if (!Number.isNaN(bId) && w === bId) return resolvedKnockoutSideNationalId(resolved, "b");

  const taId = resolved.team_a?.id != null ? Number(resolved.team_a.id) : NaN;
  const tbId = resolved.team_b?.id != null ? Number(resolved.team_b.id) : NaN;
  if (!Number.isNaN(taId) && w === taId) return resolvedKnockoutSideNationalId(resolved, "a");
  if (!Number.isNaN(tbId) && w === tbId) return resolvedKnockoutSideNationalId(resolved, "b");

  const slotA =
    resolved.knockout_slot_a_id != null ? Number(resolved.knockout_slot_a_id) : NaN;
  const slotB =
    resolved.knockout_slot_b_id != null ? Number(resolved.knockout_slot_b_id) : NaN;
  if (!Number.isNaN(slotA) && w === slotA) return resolvedKnockoutSideNationalId(resolved, "a");
  if (!Number.isNaN(slotB) && w === slotB) return resolvedKnockoutSideNationalId(resolved, "b");

  return null;
}

/** Convierte `predicted_winner_id` / `winner_id` (a menudo FK de slot) al id nacional del bando ganador. */
export function resolveStoredKnockoutWinnerToNationalId(
  storedWinnerId: number | null | undefined,
  raw: Pick<Match, "team_a_id" | "team_b_id">,
  resolved: KnockoutResolvedForWinner
): number | null {
  if (storedWinnerId == null) return null;
  const w = Number(storedWinnerId);
  if (Number.isNaN(w)) return null;

  const aId = Number(resolved.team_a_id);
  const bId = Number(resolved.team_b_id);
  if (!Number.isNaN(aId) && w === aId) return resolvedKnockoutSideNationalId(resolved, "a");
  if (!Number.isNaN(bId) && w === bId) return resolvedKnockoutSideNationalId(resolved, "b");

  const taId = resolved.team_a?.id != null ? Number(resolved.team_a.id) : NaN;
  const tbId = resolved.team_b?.id != null ? Number(resolved.team_b.id) : NaN;
  if (!Number.isNaN(taId) && w === taId) return resolvedKnockoutSideNationalId(resolved, "a");
  if (!Number.isNaN(tbId) && w === tbId) return resolvedKnockoutSideNationalId(resolved, "b");

  const slotA =
    resolved.knockout_slot_a_id != null
      ? Number(resolved.knockout_slot_a_id)
      : Number(raw.team_a_id);
  const slotB =
    resolved.knockout_slot_b_id != null
      ? Number(resolved.knockout_slot_b_id)
      : Number(raw.team_b_id);
  if (!Number.isNaN(slotA) && w === slotA) return resolvedKnockoutSideNationalId(resolved, "a");
  if (!Number.isNaN(slotB) && w === slotB) return resolvedKnockoutSideNationalId(resolved, "b");

  const rawA = Number(raw.team_a_id);
  const rawB = Number(raw.team_b_id);
  if (!Number.isNaN(rawA) && w === rawA) return resolvedKnockoutSideNationalId(resolved, "a");
  if (!Number.isNaN(rawB) && w === rawB) return resolvedKnockoutSideNationalId(resolved, "b");

  return null;
}

/** Ganador pronosticado en KO usando marcador + penales (ids nacionales, no FK de slot). */
export function resolvePredictedKnockoutWinnerNationalId(
  prediction: Pick<Prediction, "predicted_a" | "predicted_b" | "predicted_winner_id">,
  raw: Pick<Match, "team_a_id" | "team_b_id">,
  resolved: KnockoutResolvedForWinner | null | undefined
): number | null {
  if (!resolved) return null;
  if (prediction.predicted_a === null || prediction.predicted_b === null) return null;

  const pA = Number(prediction.predicted_a);
  const pB = Number(prediction.predicted_b);
  if (Number.isNaN(pA) || Number.isNaN(pB)) return null;

  if (pA > pB) return resolvedKnockoutSideNationalId(resolved, "a");
  if (pB > pA) return resolvedKnockoutSideNationalId(resolved, "b");
  if (pA === pB) {
    return resolveStoredKnockoutWinnerToNationalId(
      prediction.predicted_winner_id,
      raw,
      resolved
    );
  }
  return null;
}

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
