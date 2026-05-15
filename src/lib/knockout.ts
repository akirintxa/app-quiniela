
import { Match, Prediction, Team } from "@/types";
import { calculateStandings, TeamStats } from "./standings";

/**
 * Resolves placeholder teams in knockout matches based on group stage predictions.
 * Handles placeholders like '1A', '2B', '3X1', etc.
 */
export function resolveKnockoutTeams(
  knockoutMatches: Match[],
  allGroupMatches: Match[],
  userPredictions: Prediction[],
  allTeams: Team[]
): Match[] {
  // 1. Calculate standings for all groups
  const groupIds = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"];
  const groupStandings: Record<string, TeamStats[]> = {};
  const allThirdPlaces: TeamStats[] = [];

  groupIds.forEach(gid => {
    const matchesInGroup = allGroupMatches.filter(m => m.group_id === gid);
    const teamsInGroup = Array.from(new Set([
      ...matchesInGroup.map(m => m.team_a_id),
      ...matchesInGroup.map(m => m.team_b_id)
    ])).map(id => allTeams.find(t => t.id === id)).filter(Boolean) as Team[];

    // Use real results if finished, otherwise use predictions for standings
    const simulatedMatches = matchesInGroup.map(m => {
      if (m.is_finished) return m; // Prioridad a la realidad
      
      const pred = userPredictions.find(p => p.match_id === m.id);
      return {
        ...m,
        result_a: pred?.predicted_a ?? null,
        result_b: pred?.predicted_b ?? null
      };
    });

    const standings = calculateStandings(simulatedMatches as Match[], teamsInGroup);
    groupStandings[gid] = standings;
    if (standings.length >= 3) {
      allThirdPlaces.push(standings[2]);
    }
  });

  // Sort best 3rd places: Points -> GD -> GF
  const bestThirdPlaces = allThirdPlaces.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.gd !== a.gd) return b.gd - a.gd;
    return b.gf - a.gf;
  });

  // 2. Map placeholder ISO codes to teams
  const placeholderMap: Record<string, Team> = {};
  groupIds.forEach(gid => {
    if (groupStandings[gid][0]) placeholderMap[`1${gid}`] = groupStandings[gid][0].team;
    if (groupStandings[gid][1]) placeholderMap[`2${gid}`] = groupStandings[gid][1].team;
  });
  
  bestThirdPlaces.forEach((stats, index) => {
    placeholderMap[`3X${index + 1}`] = stats.team;
  });

  // 3. Resolve matches recursively
  const matchMap = new Map<number, Match>();
  // Initial fill
  knockoutMatches.forEach(m => matchMap.set(m.id, { ...m }));

  const resolveTeam = (team: Team | undefined, matchId: number): Team | undefined => {
    if (!team) return undefined;
    if (placeholderMap[team.iso_code]) return placeholderMap[team.iso_code];
    
    // Check if it's a winner placeholder like 'W73'
    if (team.iso_code.startsWith('W')) {
      const prevMatchIdStr = team.iso_code.substring(1);
      const prevMatchId = parseInt(prevMatchIdStr);
      if (!isNaN(prevMatchId)) {
        const prevMatch = matchMap.get(prevMatchId);
        if (prevMatch) {
          // PRIORIDAD 1: Resultado REAL si el partido ya terminó
          if (prevMatch.is_finished) {
            const winnerId = prevMatch.result_a! > prevMatch.result_b! 
              ? prevMatch.team_a_id 
              : (prevMatch.result_b! > prevMatch.result_a! ? prevMatch.team_b_id : prevMatch.winner_id);
            
            const resolvedA = resolveTeam(prevMatch.team_a, prevMatchId);
            const resolvedB = resolveTeam(prevMatch.team_b, prevMatchId);
            return winnerId === resolvedA?.id ? resolvedA : resolvedB;
          }

          // PRIORIDAD 2: Predicción del usuario si aún no hay resultado real
          const pred = userPredictions.find(p => p.match_id === prevMatchId);
          if (pred && pred.predicted_a !== null && pred.predicted_b !== null) {
            // Recurse to resolve the teams of the previous match first
            const resolvedA = resolveTeam(prevMatch.team_a, prevMatchId);
            const resolvedB = resolveTeam(prevMatch.team_b, prevMatchId);
            
            if (pred.predicted_a > pred.predicted_b) return resolvedA;
            if (pred.predicted_b > pred.predicted_a) return resolvedB;
            if (pred.predicted_winner_id) {
              return pred.predicted_winner_id === (resolvedA?.id) ? resolvedA : resolvedB;
            }
          }
        }
      }
    }
    return team;
  };

  const resolvedMatches = knockoutMatches.map(match => {
    const resolvedMatch = matchMap.get(match.id)!;
    
    const resolvedA = resolveTeam(match.team_a, match.id);
    if (resolvedA) {
      resolvedMatch.team_a = resolvedA;
      resolvedMatch.team_a_id = resolvedA.id;
    }

    const resolvedB = resolveTeam(match.team_b, match.id);
    if (resolvedB) {
      resolvedMatch.team_b = resolvedB;
      resolvedMatch.team_b_id = resolvedB.id;
    }

    return resolvedMatch;
  });

  return resolvedMatches;
}
