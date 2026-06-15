import type { Match, Prediction, Team } from "@/types";

export type MatchOutcomeSummary = {
  teamALabel: string;
  teamBLabel: string;
  teamACount: number;
  drawCount: number;
  teamBCount: number;
  pendingCount: number;
  memberCount: number;
  isGroupStage: boolean;
};

export type OutcomeSide = "teamA" | "draw" | "teamB";

export function classifyPredictionOutcome(
  prediction: Pick<
    Prediction,
    "predicted_a" | "predicted_b" | "predicted_winner_id"
  >,
  match: Pick<Match, "team_a_id" | "team_b_id" | "stage">
): OutcomeSide | null {
  if (prediction.predicted_a == null || prediction.predicted_b == null) {
    return null;
  }

  const scoreA = prediction.predicted_a;
  const scoreB = prediction.predicted_b;

  if (scoreA > scoreB) return "teamA";
  if (scoreA < scoreB) return "teamB";

  if (match.stage === "group") return "draw";

  if (prediction.predicted_winner_id === match.team_a_id) return "teamA";
  if (prediction.predicted_winner_id === match.team_b_id) return "teamB";

  return null;
}

export function getMatchTeamLabels(match: {
  team_a?: Team | null;
  team_b?: Team | null;
  bracket_label_a?: string | null;
  bracket_label_b?: string | null;
}): { teamA: string; teamB: string } {
  return {
    teamA: match.team_a?.name ?? match.bracket_label_a ?? "Local",
    teamB: match.team_b?.name ?? match.bracket_label_b ?? "Visitante",
  };
}

export function buildMatchOutcomeSummary(
  predictions: Prediction[],
  match: Match,
  memberCount: number
): MatchOutcomeSummary {
  const { teamA, teamB } = getMatchTeamLabels(match);

  let teamACount = 0;
  let drawCount = 0;
  let teamBCount = 0;
  let incompleteCount = 0;

  const usersWithPrediction = new Set<string>();

  for (const prediction of predictions) {
    usersWithPrediction.add(prediction.user_id);
    const side = classifyPredictionOutcome(prediction, match);
    if (side === "teamA") teamACount++;
    else if (side === "draw") drawCount++;
    else if (side === "teamB") teamBCount++;
    else incompleteCount++;
  }

  const noPredictionCount = Math.max(
    0,
    memberCount - usersWithPrediction.size
  );

  return {
    teamALabel: teamA,
    teamBLabel: teamB,
    teamACount,
    drawCount,
    teamBCount,
    pendingCount: incompleteCount + noPredictionCount,
    memberCount,
    isGroupStage: match.stage === "group",
  };
}
