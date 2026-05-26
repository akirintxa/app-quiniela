import type { SupabaseClient } from "@supabase/supabase-js";
import { Match, Team } from "@/types";
import type { KnockoutResolvedForWinner } from "./match-admin";
import { resolveKnockoutTeamsForLeague } from "./knockout-ui";

/** Bracket oficial resuelto para puntuar un partido KO en admin. */
export async function loadResolvedKnockoutMatch(
  supabase: SupabaseClient,
  matchId: number,
  stage: string
): Promise<KnockoutResolvedForWinner | null> {
  if (stage === "group") return null;

  const [{ data: groupMatches }, { data: knockoutMatches }, { data: allTeams }] =
    await Promise.all([
      supabase
        .from("matches")
        .select("*, team_a:teams!team_a_id(*), team_b:teams!team_b_id(*)")
        .eq("stage", "group"),
      supabase
        .from("matches")
        .select("*, team_a:teams!team_a_id(*), team_b:teams!team_b_id(*)")
        .neq("stage", "group"),
      supabase.from("teams").select("*"),
    ]);

  const resolved = resolveKnockoutTeamsForLeague(
    (knockoutMatches || []) as Match[],
    (groupMatches || []) as Match[],
    (allTeams || []) as Team[],
    []
  );

  const row = resolved.find((m) => m.id === matchId);
  return row ? (row as KnockoutResolvedForWinner) : null;
}
