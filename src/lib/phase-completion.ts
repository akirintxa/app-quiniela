import { Match, Prediction } from "@/types";

export type PhaseContext =
  | { view: "groups"; groupId: string }
  | { view: "knockout"; stage: string };

export function getPhaseMatchIds(
  allMatches: Match[],
  phase: PhaseContext
): number[] {
  if (phase.view === "groups") {
    return allMatches
      .filter((m) => m.stage === "group" && m.group_id === phase.groupId)
      .map((m) => m.id);
  }
  const stages =
    phase.stage === "final" ? ["final", "third_place"] : [phase.stage];
  return allMatches
    .filter((m) => stages.includes(m.stage))
    .map((m) => m.id);
}

export function isUserPhaseComplete(
  userPredictions: Prediction[],
  phaseMatchIds: number[],
  phaseMatches: Match[]
): boolean {
  if (phaseMatchIds.length === 0) return true;

  const matchById = new Map(phaseMatches.map((m) => [m.id, m]));

  return phaseMatchIds.every((matchId) => {
    const match = matchById.get(matchId);
    if (match?.is_finished) return true;
    const p = userPredictions.find((pr) => pr.match_id === matchId);
    return p?.predicted_a != null && p?.predicted_b != null;
  });
}

export function buildPhaseCompletionByUser(
  memberIds: string[],
  allPredictions: Prediction[],
  phaseMatchIds: number[],
  phaseMatches: Match[]
): Record<string, boolean> {
  const byUser: Record<string, Prediction[]> = {};
  memberIds.forEach((id) => {
    byUser[id] = [];
  });
  allPredictions.forEach((p) => {
    if (byUser[p.user_id]) byUser[p.user_id].push(p);
  });

  const result: Record<string, boolean> = {};
  memberIds.forEach((id) => {
    result[id] = isUserPhaseComplete(
      byUser[id] ?? [],
      phaseMatchIds,
      phaseMatches
    );
  });
  return result;
}
