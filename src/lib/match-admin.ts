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
