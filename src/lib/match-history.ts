import { Match, Prediction, Team } from "@/types";
import { formatPointsBreakdown, getPointsBreakdown } from "./points";
import { resolveKnockoutTeamsForLeague } from "./knockout-ui";

export type MatchHistoryRow = {
  match: string;
  pred: string;
  res: string;
  pts: number;
  breakdown: string;
  total: number;
};

/** Nombres reales en eliminatorias (oficial), no placeholders del seed. */
export function buildKnockoutHistoryLabels(
  knockoutMatches: Match[],
  groupMatches: Match[],
  allTeams: Team[]
): Map<number, { teamAName: string; teamBName: string }> {
  const map = new Map<number, { teamAName: string; teamBName: string }>();
  if (knockoutMatches.length === 0) return map;

  const resolved = resolveKnockoutTeamsForLeague(
    knockoutMatches,
    groupMatches,
    allTeams,
    []
  );

  for (const m of resolved) {
    const teamAName =
      m.team_a?.name ?? m.bracket_label_a ?? m.placeholder_a ?? "Equipo A";
    const teamBName =
      m.team_b?.name ?? m.bracket_label_b ?? m.placeholder_b ?? "Equipo B";
    map.set(m.id, { teamAName, teamBName });
  }

  return map;
}

export function formatHistoryMatchLabel(
  match: Match & {
    team_a?: { name: string } | null;
    team_b?: { name: string } | null;
  },
  knockoutLabels?: Map<number, { teamAName: string; teamBName: string }>
): string {
  const resolved = knockoutLabels?.get(match.id);
  if (resolved) {
    return `${resolved.teamAName} vs ${resolved.teamBName}`;
  }

  const a = match.team_a?.name ?? "Equipo A";
  const b = match.team_b?.name ?? "Equipo B";

  if (match.stage === "group") {
    return `${a.substring(0, 3).toUpperCase()} vs ${b.substring(0, 3).toUpperCase()}`;
  }

  return `${a} vs ${b}`;
}

export function buildMatchHistoryRows(
  matches: Match[],
  predictions: Prediction[],
  knockoutLabels: Map<number, { teamAName: string; teamBName: string }>
): MatchHistoryRow[] {
  let cumulative = 0;
  return matches
    .map((m) => {
      const p = predictions.find((pr) => pr.match_id === m.id);
      const pts = p?.points_won || 0;
      cumulative += pts;
      const breakdown =
        p && m.result_a != null
          ? formatPointsBreakdown(
              getPointsBreakdown(p as Prediction, m as Match)
            )
          : "";
      return {
        match: formatHistoryMatchLabel(m, knockoutLabels),
        pred: p ? `${p.predicted_a}-${p.predicted_b}` : "-",
        res: `${m.result_a}-${m.result_b}`,
        pts,
        breakdown,
        total: cumulative,
      };
    })
    .reverse();
}
