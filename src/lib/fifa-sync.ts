import type { SupabaseClient } from "@supabase/supabase-js";
import { createServiceRoleClient } from "@/utils/supabase/admin";
import { MATCH_TIMEZONE } from "@/lib/match-datetime";
import { applyMatchStateSync } from "@/lib/match-sync";
import {
  fetchAllLeagueFixtures,
  fetchFixturesByDate,
  fixtureScores,
  isApiFootballConfigured,
  mapApiStatus,
  type ApiFootballFixture,
} from "@/lib/api-football/client";
import {
  bootstrapExternalFixtureIds,
  resolveWinnerTeamId,
} from "@/lib/api-football/fixture-mapper";
import { apiTeamToIso } from "@/lib/api-football/team-map";
import type { Match, Team } from "@/types";

export type FifaExternalMatch = {
  externalId: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  status: "scheduled" | "live" | "finished";
};

export type SyncFifaMatchesResult = {
  ok: boolean;
  skipped?: boolean;
  reason?: string;
  apiRequests: number;
  fixturesFetched: number;
  matchesConsidered: number;
  updated: number;
  skippedMatches: number;
  errors: string[];
  bootstrap?: { mapped: number; skipped: number };
};

type MatchWithTeams = Match & {
  team_a?: Team | null;
  team_b?: Team | null;
};

const TOURNAMENT_START = new Date("2026-06-10T15:00:00.000Z");
const TOURNAMENT_END = new Date("2026-07-20T06:00:00.000Z");

function getCaracasDateString(offsetDays = 0): string {
  const d = new Date(Date.now() + offsetDays * 86400000);
  return d.toLocaleDateString("en-CA", { timeZone: MATCH_TIMEZONE });
}

function getCaracasHour(): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: MATCH_TIMEZONE,
    hour: "numeric",
    hour12: false,
  }).formatToParts(new Date());
  return Number(parts.find((p) => p.type === "hour")?.value ?? 0);
}

export function isTournamentSyncSeason(now = new Date()): boolean {
  return now >= TOURNAMENT_START && now <= TOURNAMENT_END;
}

/** Horario típico de partidos (Caracas) para ahorrar cuota API */
export function isActiveMatchHours(now = new Date()): boolean {
  if (!isTournamentSyncSeason(now)) return false;
  const hour = getCaracasHour();
  return hour >= 11 || hour < 3;
}

function fixtureByExternalId(
  fixtures: ApiFootballFixture[]
): Map<string, ApiFootballFixture> {
  const map = new Map<string, ApiFootballFixture>();
  for (const f of fixtures) {
    map.set(String(f.fixture.id), f);
  }
  return map;
}

const MATCH_SELECT =
  "*, team_a:teams!team_a_id(id, name, iso_code), team_b:teams!team_b_id(id, name, iso_code)";

async function loadSyncCandidateMatches(
  supabase: SupabaseClient
): Promise<MatchWithTeams[]> {
  const now = Date.now();
  const windowStart = new Date(now - 15 * 60 * 1000).toISOString();
  const windowEnd = new Date(now + 3 * 60 * 60 * 1000).toISOString();

  const [liveRes, windowRes] = await Promise.all([
    supabase
      .from("matches")
      .select(MATCH_SELECT)
      .eq("is_finished", false)
      .eq("is_locked", true),
    supabase
      .from("matches")
      .select(MATCH_SELECT)
      .eq("is_finished", false)
      .gte("start_time", windowStart)
      .lte("start_time", windowEnd),
  ]);

  if (liveRes.error) throw new Error(liveRes.error.message);
  if (windowRes.error) throw new Error(windowRes.error.message);

  const byId = new Map<number, MatchWithTeams>();
  for (const row of [...(liveRes.data ?? []), ...(windowRes.data ?? [])]) {
    byId.set(row.id, row as MatchWithTeams);
  }
  return [...byId.values()];
}

async function countUnmappedMatches(supabase: SupabaseClient): Promise<number> {
  const { count, error } = await supabase
    .from("matches")
    .select("id", { count: "exact", head: true })
    .is("external_fixture_id", null)
    .not("team_a_id", "is", null)
    .not("team_b_id", "is", null);

  if (error) throw new Error(error.message);
  return count ?? 0;
}

function mapFixtureToOurSides(
  match: MatchWithTeams,
  fixture: ApiFootballFixture
): { resultA: number; resultB: number; winnerId: number | null } {
  const { resultA: homeGoals, resultB: awayGoals } = fixtureScores(fixture);
  const homeIsoCode = apiTeamToIso(fixture.teams.home);
  const isHomeTeamA = homeIsoCode === match.team_a?.iso_code;

  const resultA = isHomeTeamA ? homeGoals : awayGoals;
  const resultB = isHomeTeamA ? awayGoals : homeGoals;

  let winnerId: number | null = null;
  if (fixture.teams.home.winner || fixture.teams.away.winner) {
    winnerId = resolveWinnerTeamId(match, fixture);
  }

  return { resultA, resultB, winnerId };
}

async function applyFixtureToMatch(
  supabase: SupabaseClient,
  match: MatchWithTeams,
  fixture: ApiFootballFixture
): Promise<{ applied: boolean; error?: string }> {
  const mappedStatus = mapApiStatus(fixture.fixture.status.short);
  if (mappedStatus === "ignore") {
    return { applied: false };
  }

  if (mappedStatus === "scheduled") {
    return { applied: false };
  }

  const { resultA, resultB, winnerId } = mapFixtureToOurSides(match, fixture);

  const result = await applyMatchStateSync(supabase, match.id, {
    status: mappedStatus,
    resultA,
    resultB,
    winnerId,
  });

  if (!result.ok) {
    return { applied: false, error: result.error };
  }

  await supabase
    .from("matches")
    .update({ external_fixture_id: String(fixture.fixture.id) })
    .eq("id", match.id);

  return { applied: !result.skipped };
}

export type SyncFifaMatchesOptions = {
  /** Ignora ventana horaria y temporada (útil para pruebas) */
  force?: boolean;
};

/**
 * Sincroniza marcadores desde API-Football (api-sports.io).
 * Usa polling por fecha en ventana activa; mapea fixtures con external_fixture_id.
 */
export async function syncFifaMatches(
  options: SyncFifaMatchesOptions = {}
): Promise<SyncFifaMatchesResult> {
  const result: SyncFifaMatchesResult = {
    ok: true,
    apiRequests: 0,
    fixturesFetched: 0,
    matchesConsidered: 0,
    updated: 0,
    skippedMatches: 0,
    errors: [],
  };

  if (!isApiFootballConfigured()) {
    return {
      ...result,
      ok: false,
      skipped: true,
      reason: "API_FOOTBALL_KEY no configurada",
    };
  }

  if (!options.force && !isTournamentSyncSeason()) {
    return {
      ...result,
      skipped: true,
      reason: "Fuera de temporada del Mundial 2026",
    };
  }

  if (!options.force && !isActiveMatchHours()) {
    return {
      ...result,
      skipped: true,
      reason: "Fuera de horario activo de partidos (Caracas)",
    };
  }

  const supabase = createServiceRoleClient();

  try {
    const unmapped = await countUnmappedMatches(supabase);
    const allFixtures: ApiFootballFixture[] = [];
    const fixtureIndex = new Map<string, ApiFootballFixture>();

    if (unmapped > 0) {
      const leagueFixtures = await fetchAllLeagueFixtures();
      result.apiRequests += 1;
      result.fixturesFetched += leagueFixtures.length;
      for (const f of leagueFixtures) {
        fixtureIndex.set(String(f.fixture.id), f);
      }
      result.bootstrap = await bootstrapExternalFixtureIds(
        supabase,
        leagueFixtures
      );
    }

    const dates = [
      getCaracasDateString(-1),
      getCaracasDateString(0),
      getCaracasDateString(1),
    ];

    for (const date of [...new Set(dates)]) {
      const dayFixtures = await fetchFixturesByDate(date);
      result.apiRequests += 1;
      result.fixturesFetched += dayFixtures.length;
      for (const f of dayFixtures) {
        fixtureIndex.set(String(f.fixture.id), f);
        allFixtures.push(f);
      }
    }

    void allFixtures;
    const candidates = await loadSyncCandidateMatches(supabase);
    result.matchesConsidered = candidates.length;

    for (const match of candidates) {
      if (!match.external_fixture_id) {
        result.skippedMatches += 1;
        result.errors.push(
          `Partido ${match.id} sin external_fixture_id (ejecuta sync tras mapeo)`
        );
        continue;
      }

      const fixture = fixtureIndex.get(match.external_fixture_id);
      if (!fixture) {
        result.skippedMatches += 1;
        continue;
      }

      const { applied, error } = await applyFixtureToMatch(
        supabase,
        match,
        fixture
      );

      if (error) {
        result.errors.push(`Partido ${match.id}: ${error}`);
        continue;
      }

      if (applied) {
        result.updated += 1;
      } else {
        result.skippedMatches += 1;
      }
    }

    if (result.errors.length > 0) {
      console.warn("[fifa-sync] errores:", result.errors);
    }

    console.info("[fifa-sync]", JSON.stringify(result));
    return result;
  } catch (e) {
    const message = e instanceof Error ? e.message : "Error de sincronización";
    console.error("[fifa-sync] fatal:", message);
    return {
      ...result,
      ok: false,
      errors: [...result.errors, message],
    };
  }
}
