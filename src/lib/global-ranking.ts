import type { SupabaseClient } from "@supabase/supabase-js";
import { getTotalPointsWithFavoriteBonus } from "./favorite-bonus";
import { getFavoriteBonusesForUsers } from "./favorite-bonus-server";

export type ProfileForRanking = {
  id: string;
  favorite_team_id: number | null;
};

export type PlayerStanding = {
  userId: string;
  matchPoints: number;
  bonusPoints: number;
  totalPoints: number;
};

/** Misma lógica que el ranking global: todos los perfiles, partidos + bono favorito */
export async function buildPlayerStandings(
  supabase: SupabaseClient,
  profiles: ProfileForRanking[]
): Promise<PlayerStanding[]> {
  if (profiles.length === 0) return [];

  const ids = profiles.map((p) => p.id);
  const matchPoints: Record<string, number> = {};
  ids.forEach((id) => {
    matchPoints[id] = 0;
  });

  const { data: predictions } = await supabase
    .from("predictions")
    .select("user_id, points_won")
    .in("user_id", ids);

  predictions?.forEach((p) => {
    if (matchPoints[p.user_id] !== undefined) {
      matchPoints[p.user_id] += p.points_won ?? 0;
    }
  });

  const favoriteBonuses = await getFavoriteBonusesForUsers(supabase, profiles);

  return profiles.map((p) => {
    const mp = matchPoints[p.id] ?? 0;
    const bonus = favoriteBonuses[p.id] ?? { total: 0, awards: [] };
    return {
      userId: p.id,
      matchPoints: mp,
      bonusPoints: bonus.total,
      totalPoints: getTotalPointsWithFavoriteBonus(mp, bonus),
    };
  });
}

export function sortStandingsByTotal(
  standings: PlayerStanding[]
): PlayerStanding[] {
  return [...standings].sort((a, b) => b.totalPoints - a.totalPoints);
}

/** Posición 1-based; 0 si el usuario no está en la lista */
export function getRankForUser(
  sortedStandings: PlayerStanding[],
  userId: string
): number {
  const idx = sortedStandings.findIndex((s) => s.userId === userId);
  return idx === -1 ? 0 : idx + 1;
}

export async function getUserGlobalRankStats(
  supabase: SupabaseClient,
  userId: string
): Promise<{
  points: number;
  matchPoints: number;
  bonusPoints: number;
  rank: number;
  totalPlayers: number;
}> {
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, favorite_team_id");

  const rows: ProfileForRanking[] = profiles ?? [];
  const standings = sortStandingsByTotal(
    await buildPlayerStandings(supabase, rows)
  );
  const mine = standings.find((s) => s.userId === userId);

  return {
    points: mine?.totalPoints ?? 0,
    matchPoints: mine?.matchPoints ?? 0,
    bonusPoints: mine?.bonusPoints ?? 0,
    rank: getRankForUser(standings, userId),
    totalPlayers: rows.length,
  };
}
