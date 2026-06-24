import type { DbMatchWithTeams } from "@/lib/score-providers/find-external-match";
import { findDbMatchForExternalGame } from "@/lib/score-providers/find-external-match";
import { teamsMatch } from "@/lib/score-providers/map-external-scores";
import type { WorldCup26Game } from "@/lib/score-providers/worldcup26";

export type SideAlignmentStatus = "aligned" | "inverted" | "unknown";

export function getMatchSideAlignmentVsExternal(
  game: WorldCup26Game,
  match: DbMatchWithTeams
): SideAlignmentStatus {
  const homeIsA = teamsMatch(game.home_team_name_en, match.team_a?.name);
  const awayIsB = teamsMatch(game.away_team_name_en, match.team_b?.name);
  if (homeIsA && awayIsB) return "aligned";

  const homeIsB = teamsMatch(game.home_team_name_en, match.team_b?.name);
  const awayIsA = teamsMatch(game.away_team_name_en, match.team_a?.name);
  if (homeIsB && awayIsA) return "inverted";

  return "unknown";
}

export function isMatchInvertedVsExternal(
  game: WorldCup26Game,
  match: DbMatchWithTeams
): boolean {
  return getMatchSideAlignmentVsExternal(game, match) === "inverted";
}

export type InvertedMatchAuditRow = {
  matchId: number;
  groupId: string | null;
  apiFixtureId: string;
  teamAName: string;
  teamBName: string;
  fifaHomeName: string;
  fifaAwayName: string;
  startTime: string;
  isLocked: boolean;
  predictionCount: number;
  hasScore: boolean;
};

export function listInvertedFutureGroupMatches(
  games: WorldCup26Game[],
  dbMatches: DbMatchWithTeams[],
  predictionCounts: Map<number, number>
): InvertedMatchAuditRow[] {
  const unfinishedGroup = dbMatches.filter(
    (m) => m.stage === "group" && !m.is_finished
  );
  const rows: InvertedMatchAuditRow[] = [];
  const seen = new Set<number>();

  for (const game of games) {
    if ((game.type ?? "group") !== "group") continue;

    const dbMatch = findDbMatchForExternalGame(game, unfinishedGroup);
    if (!dbMatch || seen.has(dbMatch.id)) continue;
    if (!isMatchInvertedVsExternal(game, dbMatch)) continue;

    seen.add(dbMatch.id);
    rows.push({
      matchId: dbMatch.id,
      groupId: dbMatch.group_id ?? null,
      apiFixtureId: game.id,
      teamAName: dbMatch.team_a?.name ?? `Equipo ${dbMatch.team_a_id}`,
      teamBName: dbMatch.team_b?.name ?? `Equipo ${dbMatch.team_b_id}`,
      fifaHomeName: game.home_team_name_en ?? "?",
      fifaAwayName: game.away_team_name_en ?? "?",
      startTime: dbMatch.start_time,
      isLocked: Boolean(dbMatch.is_locked),
      predictionCount: predictionCounts.get(dbMatch.id) ?? 0,
      hasScore: dbMatch.result_a !== null && dbMatch.result_b !== null,
    });
  }

  return rows.sort(
    (a, b) =>
      new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  );
}
