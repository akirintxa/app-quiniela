import type { SupabaseClient } from "@supabase/supabase-js";
import type { Match, Team } from "@/types";
import type { ApiFootballFixture } from "./client";
import { apiTeamToIso } from "./team-map";

const KICKOFF_TOLERANCE_MS = 3 * 60 * 60 * 1000;

type MatchWithTeams = Match & {
  team_a?: Team | null;
  team_b?: Team | null;
};

export function fixtureTeamIsos(fixture: ApiFootballFixture): [string, string] | null {
  const home = apiTeamToIso(fixture.teams.home);
  const away = apiTeamToIso(fixture.teams.away);
  if (!home || !away) return null;
  return [home, away];
}

export function matchTeamIsos(match: MatchWithTeams): [string, string] | null {
  const a = match.team_a?.iso_code;
  const b = match.team_b?.iso_code;
  if (!a || !b) return null;
  return [a, b];
}

function isosPairMatch(
  [iso1, iso2]: [string, string],
  [iso3, iso4]: [string, string]
): boolean {
  return (
    (iso1 === iso3 && iso2 === iso4) || (iso1 === iso4 && iso2 === iso3)
  );
}

export function findFixtureForMatch(
  match: MatchWithTeams,
  fixtures: ApiFootballFixture[]
): ApiFootballFixture | null {
  const matchIsos = matchTeamIsos(match);
  if (!matchIsos) return null;

  const kickoff = new Date(match.start_time).getTime();
  let best: ApiFootballFixture | null = null;
  let bestDelta = Infinity;

  for (const fixture of fixtures) {
    const fixtureIsos = fixtureTeamIsos(fixture);
    if (!fixtureIsos || !isosPairMatch(matchIsos, fixtureIsos)) continue;

    const delta = Math.abs(new Date(fixture.fixture.date).getTime() - kickoff);
    if (delta <= KICKOFF_TOLERANCE_MS && delta < bestDelta) {
      best = fixture;
      bestDelta = delta;
    }
  }

  return best;
}

export async function bootstrapExternalFixtureIds(
  supabase: SupabaseClient,
  fixtures: ApiFootballFixture[]
): Promise<{ mapped: number; skipped: number }> {
  const { data: rows, error } = await supabase
    .from("matches")
    .select(
      "id, start_time, external_fixture_id, team_a_id, team_b_id, team_a:teams!team_a_id(iso_code), team_b:teams!team_b_id(iso_code)"
    )
    .is("external_fixture_id", null);

  if (error) throw new Error(error.message);

  let mapped = 0;
  let skipped = 0;

  for (const row of rows ?? []) {
    const match = row as unknown as MatchWithTeams;
    const fixture = findFixtureForMatch(match, fixtures);
    if (!fixture) {
      skipped += 1;
      continue;
    }

    const { error: updateError } = await supabase
      .from("matches")
      .update({ external_fixture_id: String(fixture.fixture.id) })
      .eq("id", match.id);

    if (updateError) {
      console.error(
        `bootstrap fixture map match ${match.id}:`,
        updateError.message
      );
      skipped += 1;
      continue;
    }
    mapped += 1;
  }

  return { mapped, skipped };
}

export function resolveWinnerTeamId(
  match: MatchWithTeams,
  fixture: ApiFootballFixture
): number | null {
  const homeWon = fixture.teams.home.winner === true;
  const awayWon = fixture.teams.away.winner === true;
  if (!homeWon && !awayWon) return null;

  const homeIso = apiTeamToIso(fixture.teams.home);
  const awayIso = apiTeamToIso(fixture.teams.away);
  const teamA = match.team_a?.iso_code;
  const teamB = match.team_b?.iso_code;

  if (homeWon && homeIso === teamA) return match.team_a_id;
  if (homeWon && homeIso === teamB) return match.team_b_id;
  if (awayWon && awayIso === teamA) return match.team_a_id;
  if (awayWon && awayIso === teamB) return match.team_b_id;

  return null;
}
