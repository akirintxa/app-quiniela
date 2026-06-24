import type { SupabaseClient } from "@supabase/supabase-js";
import type { DbMatchWithTeams } from "@/lib/score-providers/find-external-match";
import {
  listInvertedFutureGroupMatches,
  type InvertedMatchAuditRow,
} from "@/lib/score-providers/match-side-alignment";
import { fetchWorldCup26Games } from "@/lib/score-providers/worldcup26";

type ServiceSupabase = SupabaseClient;

function buildPredictionCountMap(
  predictions: { match_id: number }[]
): Map<number, number> {
  const counts = new Map<number, number>();
  for (const row of predictions) {
    counts.set(row.match_id, (counts.get(row.match_id) ?? 0) + 1);
  }
  return counts;
}

export async function auditInvertedFutureGroupMatches(
  supabase: ServiceSupabase
): Promise<InvertedMatchAuditRow[]> {
  const games = await fetchWorldCup26Games();

  const { data: matches, error } = await supabase
    .from("matches")
    .select(`*, team_a:teams!team_a_id(name), team_b:teams!team_b_id(name)`)
    .eq("stage", "group")
    .eq("is_finished", false);

  if (error) throw new Error(error.message);

  const dbMatches = (matches ?? []) as DbMatchWithTeams[];
  const matchIds = dbMatches.map((m) => m.id);

  let predictionCounts = new Map<number, number>();
  if (matchIds.length > 0) {
    const { data: preds, error: predError } = await supabase
      .from("predictions")
      .select("match_id")
      .in("match_id", matchIds);

    if (predError) throw new Error(predError.message);
    predictionCounts = buildPredictionCountMap(preds ?? []);
  }

  return listInvertedFutureGroupMatches(games, dbMatches, predictionCounts);
}
