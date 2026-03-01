
import { Match } from "@/types";

/**
 * Checks if a match's predictions are locked.
 *
 * @param match The match to check.
 * @returns True if predictions are locked, false otherwise.
 */
export function isPredictionLocked(match: Match): boolean {
  const now = new Date();
  const startTime = new Date(match.start_time);
  const lockTime = new Date(startTime.getTime() - 30 * 60 * 1000); // 30 minutes before start time

  return now > lockTime;
}

/**
 * Generates a random prediction for a match.
 *
 * @param match The match to generate a prediction for.
 * @returns A random prediction.
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
