import { Match, Prediction } from "@/types";

export const MAX_POINTS_PER_MATCH = 5;

export const SCORING_RULES = [
  { points: 2, label: "Ganador", detail: "Aciertas quién gana (o empate en grupos)" },
  { points: 1, label: "Diferencia", detail: "Misma diferencia de goles entre equipos" },
  { points: 1, label: "Goles local", detail: "Marcador exacto del equipo A" },
  { points: 1, label: "Goles visita", detail: "Marcador exacto del equipo B" },
] as const;

export type PointsBreakdown = {
  winner: number;
  difference: number;
  goalsA: number;
  goalsB: number;
  total: number;
};

function isCorrectOutcome(
  match: Match,
  prediction: Prediction,
  pA: number,
  pB: number,
  rA: number,
  rB: number
): boolean {
  const isKnockout = match.stage !== "group";

  if (isKnockout) {
    const actualWinnerId =
      rA > rB ? match.team_a_id : rB > rA ? match.team_b_id : match.winner_id;
    const predictedWinnerId =
      pA > pB ? match.team_a_id : pB > pA ? match.team_b_id : prediction.predicted_winner_id;
    return (
      actualWinnerId != null &&
      predictedWinnerId != null &&
      actualWinnerId === predictedWinnerId
    );
  }

  const predictedDiff = pA - pB;
  const actualDiff = rA - rB;
  return (
    (predictedDiff > 0 && actualDiff > 0) ||
    (predictedDiff < 0 && actualDiff < 0) ||
    (predictedDiff === 0 && actualDiff === 0)
  );
}

/** Desglose por partido (máx. +5 por acierto). */
export function getPointsBreakdown(
  prediction: Prediction,
  match: Match
): PointsBreakdown {
  const empty = { winner: 0, difference: 0, goalsA: 0, goalsB: 0, total: 0 };

  if (
    prediction.predicted_a === null ||
    prediction.predicted_b === null ||
    match.result_a === null ||
    match.result_b === null
  ) {
    return empty;
  }

  const pA = Number(prediction.predicted_a);
  const pB = Number(prediction.predicted_b);
  const rA = Number(match.result_a);
  const rB = Number(match.result_b);

  const winner = isCorrectOutcome(match, prediction, pA, pB, rA, rB) ? 2 : 0;
  const difference =
    Math.abs(pA - pB) === Math.abs(rA - rB) ? 1 : 0;
  const goalsA = pA === rA ? 1 : 0;
  const goalsB = pB === rB ? 1 : 0;

  return {
    winner,
    difference,
    goalsA,
    goalsB,
    total: winner + difference + goalsA + goalsB,
  };
}

export function formatPointsBreakdown(b: PointsBreakdown): string {
  const parts: string[] = [];
  if (b.winner) parts.push("+2");
  if (b.difference) parts.push("+1 dif");
  if (b.goalsA) parts.push("+1 A");
  if (b.goalsB) parts.push("+1 B");
  return parts.length > 0 ? parts.join(" ") : "0";
}

export function calculatePoints(prediction: Prediction, match: Match): number {
  return getPointsBreakdown(prediction, match).total;
}
