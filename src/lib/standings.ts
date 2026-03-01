
import { Match, Team } from "@/types";

export interface TeamStats {
  team: Team;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  gf: number;
  ga: number;
  gd: number;
  points: number;
}

export function calculateStandings(matches: Match[], teams: Team[]): TeamStats[] {
  const stats: Record<number, TeamStats> = {};

  // Initialize stats for each team
  teams.forEach(team => {
    stats[team.id] = {
      team,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      gf: 0,
      ga: 0,
      gd: 0,
      points: 0
    };
  });

  // Process matches that have results
  matches.forEach(match => {
    if (match.result_a === null || match.result_b === null) return;

    const teamA = stats[match.team_a_id];
    const teamB = stats[match.team_b_id];

    if (!teamA || !teamB) return;

    teamA.played++;
    teamB.played++;
    teamA.gf += match.result_a;
    teamA.ga += match.result_b;
    teamB.gf += match.result_b;
    teamB.ga += match.result_a;

    if (match.result_a > match.result_b) {
      teamA.won++;
      teamA.points += 3;
      teamB.lost++;
    } else if (match.result_a < match.result_b) {
      teamB.won++;
      teamB.points += 3;
      teamA.lost++;
    } else {
      teamA.drawn++;
      teamA.points += 1;
      teamB.drawn++;
      teamB.points += 1;
    }

    teamA.gd = teamA.gf - teamA.ga;
    teamB.gd = teamB.gf - teamB.ga;
  });

  // Sort by Points -> GD -> GF
  return Object.values(stats).sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.gd !== a.gd) return b.gd - a.gd;
    return b.gf - a.gf;
  });
}
