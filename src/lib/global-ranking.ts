import type { SupabaseClient } from "@supabase/supabase-js";
import { unstable_cache } from "next/cache";
import { tryCreateServiceRoleClient } from "@/utils/supabase/admin";
import { GLOBAL_RANKING_CACHE_TAG } from "@/lib/revalidate-app";
import { getTotalPointsWithFavoriteBonus } from "./favorite-bonus";
import { getFavoriteBonusesForUsers } from "./favorite-bonus-server";
import { fetchAllPredictionsForRanking } from "./pool-predictions-server";

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
  profiles: ProfileForRanking[],
  prefetchedPredictions?: { user_id: string; points_won: number | null }[]
): Promise<PlayerStanding[]> {
  if (profiles.length === 0) return [];

  const ids = profiles.map((p) => p.id);
  const matchPoints: Record<string, number> = {};
  ids.forEach((id) => {
    matchPoints[id] = 0;
  });

  let predictions: { user_id: string; points_won: number | null }[] | null =
    null;
  if (prefetchedPredictions) {
    predictions = prefetchedPredictions;
  } else {
    const { data } = await supabase
      .from("predictions")
      .select("user_id, points_won")
      .in("user_id", ids);
    predictions = data;
  }

  predictions?.forEach((p) => {
    if (matchPoints[p.user_id] !== undefined && p.points_won != null) {
      matchPoints[p.user_id] += p.points_won;
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

/** Posición con empates (1, 1, 3…): mismos puntos comparten número de puesto */
export function getCompetitionRankAtIndex(
  sortedByPointsDesc: { points: number }[],
  index: number
): number {
  const pts = sortedByPointsDesc[index].points;
  const firstIdx = sortedByPointsDesc.findIndex((s) => s.points === pts);
  return firstIdx + 1;
}

/** Posición 1-based con empates; 0 si el usuario no está en la lista */
export function getRankForUser(
  sortedStandings: PlayerStanding[],
  userId: string
): number {
  const idx = sortedStandings.findIndex((s) => s.userId === userId);
  if (idx === -1) return 0;
  return getCompetitionRankAtIndex(
    sortedStandings.map((s) => ({ points: s.totalPoints })),
    idx
  );
}

export type LeagueStanding = {
  poolId: number;
  name: string;
  members: number;
  totalPoints: number;
  average: number;
};

/** Promedio de puntos (partidos + bono favorito) por liga, mismas reglas que el ranking de jugadores. */
export async function buildLeagueRankings(
  supabase: SupabaseClient
): Promise<LeagueStanding[]> {
  const [{ data: pools }, { data: members }, { data: profiles }] =
    await Promise.all([
      supabase.from("pools").select("id, name"),
      supabase.from("pool_members").select("pool_id, user_id"),
      supabase.from("profiles").select("id, favorite_team_id"),
    ]);

  if (!pools?.length || !members?.length) return [];

  const profileById = new Map(
    (profiles ?? []).map((p) => [p.id, p.favorite_team_id] as const)
  );

  const membersByPool = new Map<number, string[]>();
  for (const m of members) {
    const list = membersByPool.get(m.pool_id) ?? [];
    if (!list.includes(m.user_id)) list.push(m.user_id);
    membersByPool.set(m.pool_id, list);
  }

  const allUserIds = [...new Set(members.map((m) => m.user_id))];
  const profileRows: ProfileForRanking[] = allUserIds.map((id) => ({
    id,
    favorite_team_id: profileById.get(id) ?? null,
  }));

  let prefetched: { user_id: string; points_won: number | null }[];
  try {
    prefetched = await fetchAllPredictionsForRanking();
  } catch (e) {
    console.error("buildLeagueRankings predictions:", e);
    prefetched = [];
  }

  const standingsByUser = new Map(
    (await buildPlayerStandings(supabase, profileRows, prefetched)).map(
      (s) => [s.userId, s] as const
    )
  );

  const results: LeagueStanding[] = [];
  for (const pool of pools) {
    const userIds = membersByPool.get(pool.id) ?? [];
    if (userIds.length < 2) continue;

    const totalPoints = userIds.reduce(
      (sum, id) => sum + (standingsByUser.get(id)?.totalPoints ?? 0),
      0
    );

    results.push({
      poolId: pool.id,
      name: pool.name,
      members: userIds.length,
      totalPoints,
      average: Math.round((totalPoints / userIds.length) * 10) / 10,
    });
  }

  return results.sort((a, b) => b.average - a.average);
}

async function buildGlobalPlayerStandingsUncached(
  supabase: SupabaseClient
): Promise<PlayerStanding[]> {
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, favorite_team_id");

  const rows: ProfileForRanking[] = profiles ?? [];
  let prefetched: { user_id: string; points_won: number | null }[] = [];
  try {
    prefetched = await fetchAllPredictionsForRanking();
  } catch (e) {
    console.error("buildGlobalPlayerStandings predictions:", e);
  }

  return sortStandingsByTotal(
    await buildPlayerStandings(supabase, rows, prefetched)
  );
}

async function buildGlobalPlayerStandingsCached(): Promise<PlayerStanding[]> {
  const supabase = tryCreateServiceRoleClient();
  if (!supabase) return [];
  return buildGlobalPlayerStandingsUncached(supabase);
}

const getCachedGlobalPlayerStandings = unstable_cache(
  buildGlobalPlayerStandingsCached,
  ["global-player-standings-v1"],
  { revalidate: 60, tags: [GLOBAL_RANKING_CACHE_TAG] }
);

export async function buildGlobalPlayerStandings(
  supabase: SupabaseClient
): Promise<PlayerStanding[]> {
  if (tryCreateServiceRoleClient()) {
    return getCachedGlobalPlayerStandings();
  }
  return buildGlobalPlayerStandingsUncached(supabase);
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
  const standings = await buildGlobalPlayerStandings(supabase);
  const mine = standings.find((s) => s.userId === userId);

  return {
    points: mine?.totalPoints ?? 0,
    matchPoints: mine?.matchPoints ?? 0,
    bonusPoints: mine?.bonusPoints ?? 0,
    rank: getRankForUser(standings, userId),
    totalPlayers: standings.length,
  };
}
