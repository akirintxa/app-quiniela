import { getPointsBreakdown, type PredictionForScoring } from "@/lib/points";
import type { Match } from "@/types";

export type ProfileStatsFromPredictions = {
  matchPoints: number;
  scoredPredictions: number;
  plenos: number;
  diferencias: number;
  ganadores: number;
  effectiveness: number;
};

type PredictionWithMatch = {
  points_won: number | null;
  predicted_a: number | null;
  predicted_b: number | null;
  predicted_winner_id?: number | null;
  matches:
    | Pick<
        Match,
        | "result_a"
        | "result_b"
        | "stage"
        | "winner_id"
        | "team_a_id"
        | "team_b_id"
      >
    | Pick<
        Match,
        | "result_a"
        | "result_b"
        | "stage"
        | "winner_id"
        | "team_a_id"
        | "team_b_id"
      >[]
    | null;
};

function matchFromPrediction(p: PredictionWithMatch) {
  const m = p.matches;
  if (!m) return null;
  return Array.isArray(m) ? m[0] : m;
}

/** Estadísticas de perfil alineadas con src/lib/points.ts (misma lógica que points_won). */
export function aggregateProfileStats(
  predictions: PredictionWithMatch[]
): ProfileStatsFromPredictions {
  let matchPoints = 0;
  let plenos = 0;
  let diferencias = 0;
  let ganadores = 0;
  let withPoints = 0;

  for (const p of predictions) {
    matchPoints += p.points_won ?? 0;
    if ((p.points_won ?? 0) > 0) withPoints++;

    const m = matchFromPrediction(p);
    if (
      !m ||
      m.result_a === null ||
      m.result_b === null ||
      p.predicted_a === null ||
      p.predicted_b === null
    ) {
      continue;
    }

    const pred: PredictionForScoring = {
      predicted_a: p.predicted_a,
      predicted_b: p.predicted_b,
      predicted_winner_id: p.predicted_winner_id ?? null,
    };

    const breakdown = getPointsBreakdown(pred, m as Match);

    if (p.predicted_a === m.result_a && p.predicted_b === m.result_b) {
      plenos++;
    } else if (breakdown.difference > 0) {
      diferencias++;
    } else if (breakdown.winner > 0) {
      ganadores++;
    }
  }

  const scoredPredictions = predictions.length;

  return {
    matchPoints,
    scoredPredictions,
    plenos,
    diferencias,
    ganadores,
    effectiveness:
      scoredPredictions > 0
        ? Math.round((withPoints / scoredPredictions) * 100)
        : 0,
  };
}
