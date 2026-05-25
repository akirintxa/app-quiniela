import type { SupabaseClient } from "@supabase/supabase-js";
import { getTeamFlagUrl } from "./team-flag";

export type FavoriteTeam = {
  id: number;
  name: string;
  iso_code: string;
};

export type ProfileFields = {
  nickname: string | null;
  favorite_team_id: number | null;
  favoriteTeam: FavoriteTeam | null;
};

/** Carga perfil sin join embebido (no requiere FK en schema cache de Supabase). */
export async function fetchProfileFields(
  supabase: SupabaseClient,
  userId: string
): Promise<ProfileFields | null> {
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("nickname, favorite_team_id")
    .eq("id", userId)
    .maybeSingle();

  if (error) throw error;
  if (!profile) return null;

  let favoriteTeam: FavoriteTeam | null = null;
  if (profile.favorite_team_id) {
    const { data: team, error: teamError } = await supabase
      .from("teams")
      .select("id, name, iso_code")
      .eq("id", profile.favorite_team_id)
      .maybeSingle();
    if (teamError) throw teamError;
    favoriteTeam = team;
  }

  return {
    nickname: profile.nickname,
    favorite_team_id: profile.favorite_team_id,
    favoriteTeam,
  };
}

export function getFavoriteTeamFlagUrl(
  team: FavoriteTeam | null,
  size: 40 | 80 = 40
): string | null {
  return getTeamFlagUrl(team, size);
}

/** Mapa team_id → equipo para banderas en ranking de ligas */
export async function loadFavoriteTeamsByIds(
  supabase: SupabaseClient,
  teamIds: number[]
): Promise<Map<number, FavoriteTeam>> {
  const map = new Map<number, FavoriteTeam>();
  const unique = [...new Set(teamIds.filter((id) => id > 0))];
  if (unique.length === 0) return map;

  const { data } = await supabase
    .from("teams")
    .select("id, name, iso_code")
    .in("id", unique);

  data?.forEach((t) => map.set(t.id, t));
  return map;
}
