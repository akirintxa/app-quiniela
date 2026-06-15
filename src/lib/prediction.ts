import { Match } from "@/types";

export const PREDICTION_LOCK_MINUTES_BEFORE = 30;

export function getPredictionLockTime(startTimeIso: string): Date {
  const start = new Date(startTimeIso);
  return new Date(
    start.getTime() - PREDICTION_LOCK_MINUTES_BEFORE * 60 * 1000
  );
}

/**
 * True when predictions should be closed (30 min before kickoff).
 */
export function isPredictionLocked(
  match: Pick<Match, "start_time" | "is_finished">
): boolean {
  if (match.is_finished) return true;
  return new Date() >= getPredictionLockTime(match.start_time);
}

/**
 * Whether the user can still save predictions (server + UI).
 */
export function isMatchClosedForPredictions(
  match: Pick<Match, "start_time" | "is_finished" | "is_locked">
): boolean {
  return (
    match.is_finished || match.is_locked || isPredictionLocked(match)
  );
}

/**
 * Generates a random prediction for a match.
 */
export function generateRandomPrediction(match: Match) {
  const predicted_a = Math.floor(Math.random() * 5); // 0-4 goals
  const predicted_b = Math.floor(Math.random() * 5); // 0-4 goals
  let predicted_winner_id = null;

  if (match.stage !== "group" && predicted_a === predicted_b) {
    predicted_winner_id = Math.random() > 0.5 ? match.team_a_id : match.team_b_id;
  }

  return {
    predicted_a,
    predicted_b,
    predicted_winner_id,
  };
}
