import type { SupabaseClient } from "@supabase/supabase-js";
import { Match, Team } from "@/types";
import {
  calculateFavoriteTeamBonuses,
  FavoriteBonusResult,
} from "./favorite-bonus";

export async function loadFavoriteBonusContext(supabase: SupabaseClient) {
  const [
    { data: groupMatches },
    { data: knockoutMatches },
    { data: allTeams },
  ] = await Promise.all([
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

  return {
    groupMatches: (groupMatches || []) as Match[],
    knockoutMatches: (knockoutMatches || []) as Match[],
    allTeams: (allTeams || []) as Team[],
  };
}

export async function getFavoriteBonusForUser(
  supabase: SupabaseClient,
  _userId: string,
  favoriteTeamId: number | null | undefined,
  context?: {
    groupMatches: Match[];
    knockoutMatches: Match[];
  }
): Promise<FavoriteBonusResult> {
  const loaded = await loadFavoriteBonusContext(supabase);
  const groupMatches = context?.groupMatches ?? loaded.groupMatches;
  const knockoutMatches = context?.knockoutMatches ?? loaded.knockoutMatches;

  return calculateFavoriteTeamBonuses(favoriteTeamId, {
    groupMatches,
    knockoutMatches,
    allTeams: loaded.allTeams,
  });
}

export async function getFavoriteBonusesForUsers(
  supabase: SupabaseClient,
  users: { id: string; favorite_team_id: number | null }[]
): Promise<Record<string, FavoriteBonusResult>> {
  const ctx = await loadFavoriteBonusContext(supabase);

  const out: Record<string, FavoriteBonusResult> = {};
  for (const u of users) {
    out[u.id] = calculateFavoriteTeamBonuses(u.favorite_team_id, {
      groupMatches: ctx.groupMatches,
      knockoutMatches: ctx.knockoutMatches,
      allTeams: ctx.allTeams,
    });
  }
  return out;
}
