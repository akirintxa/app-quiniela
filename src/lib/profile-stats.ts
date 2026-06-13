import { isCorrectMatchOutcome } from "@/lib/points";
import type { Match } from "@/types";

export type ProfileStatsFromPredictions = {
  matchPoints: number;
  scoredPredictions: number;
  plenos: number;
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

/** Plenos = marcador exacto; ganadores = acierto 1X2 en 90' (no excluyentes). */
export function aggregateProfileStats(
  predictions: PredictionWithMatch[]
): ProfileStatsFromPredictions {
  let matchPoints = 0;
  let plenos = 0;
  let ganadores = 0;

  for (const p of predictions) {
    matchPoints += p.points_won ?? 0;

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

    if (p.predicted_a === m.result_a && p.predicted_b === m.result_b) {
      plenos++;
    }

    if (
      isCorrectMatchOutcome(
        p.predicted_a,
        p.predicted_b,
        m.result_a,
        m.result_b
      )
    ) {
      ganadores++;
    }
  }

  const scoredPredictions = predictions.length;

  return {
    matchPoints,
    scoredPredictions,
    plenos,
    ganadores,
    effectiveness:
      scoredPredictions > 0
        ? Math.round((ganadores / scoredPredictions) * 100)
        : 0,
  };
}
