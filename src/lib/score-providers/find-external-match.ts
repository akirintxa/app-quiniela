import { teamsMatch } from "@/lib/score-providers/map-external-scores";
import type { WorldCup26Game } from "@/lib/score-providers/worldcup26";
import type { Match, Team } from "@/types";

export type DbMatchWithTeams = Match & {
  team_a?: Team | null;
  team_b?: Team | null;
};

const KNOCKOUT_ID_MIN = 73;
const KNOCKOUT_ID_MAX = 104;

function pairMatchesGame(
  game: WorldCup26Game,
  match: DbMatchWithTeams
): boolean {
  const homeVsA = teamsMatch(game.home_team_name_en, match.team_a?.name);
  const awayVsB = teamsMatch(game.away_team_name_en, match.team_b?.name);
  const homeVsB = teamsMatch(game.home_team_name_en, match.team_b?.name);
  const awayVsA = teamsMatch(game.away_team_name_en, match.team_a?.name);
  return (homeVsA && awayVsB) || (homeVsB && awayVsA);
}

/** FIFA fixture ids 73–104 match our knockout rows; group stage uses insert order, not FIFA ids. */
export function findDbMatchForExternalGame(
  game: WorldCup26Game,
  dbMatches: DbMatchWithTeams[]
): DbMatchWithTeams | null {
  const apiId = Number(game.id);
  if (!Number.isFinite(apiId) || apiId <= 0) return null;

  if (apiId >= KNOCKOUT_ID_MIN && apiId <= KNOCKOUT_ID_MAX) {
    return dbMatches.find((m) => m.id === apiId) ?? null;
  }

  const groupId = game.group?.trim().toUpperCase();
  const candidates = groupId
    ? dbMatches.filter((m) => m.stage === "group" && m.group_id === groupId)
    : dbMatches.filter((m) => m.stage === "group");

  const matches = candidates.filter((m) => pairMatchesGame(game, m));
  if (matches.length === 1) return matches[0];
  if (matches.length > 1) return null;
  return null;
}
