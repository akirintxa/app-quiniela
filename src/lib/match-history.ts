import { Match, Prediction, Team } from "@/types";
import {
  FAVORITE_BONUS_RULES,
  HISTORY_BONUS_PHASES,
  getFavoriteBonusPointsForHistoryPhase,
  type FavoriteBonusKey,
  type HistoryBonusPhaseKey,
} from "./favorite-bonus";
import {
  getKnockoutPenaltyWinnerDisplayName,
  type KnockoutResolvedForWinner,
} from "./match-admin";
import { formatPointsBreakdown, getPointsBreakdown } from "./points";
import { resolveKnockoutTeamsForLeague } from "./knockout-ui";

export type MatchHistoryRow = {
  kind: "match" | "bonus";
  match: string;
  pred: string;
  res: string;
  pts: number;
  breakdown: string;
  total: number;
};

const STAGE_SHORT_LABELS: Record<string, string> = {
  group: "Grupos",
  round_32: "16vos",
  round_16: "8vos",
  quarter_final: "Cuartos",
  semi_final: "Semis",
  final: "Final",
  third_place: "3er puesto",
};

export function getHistoryPhaseShortLabel(match: Match): string {
  if (match.stage === "group") {
    return match.group_id ? `Grupo ${match.group_id}` : "Grupos";
  }
  return STAGE_SHORT_LABELS[match.stage] ?? match.stage;
}

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
  const phase = getHistoryPhaseShortLabel(match);
  const resolved = knockoutLabels?.get(match.id);
  const teamA = resolved?.teamAName ?? match.team_a?.name ?? "Equipo A";
  const teamB = resolved?.teamBName ?? match.team_b?.name ?? "Equipo B";
  return `${phase} — ${teamA} vs ${teamB}`;
}

function bonusHistoryResultLabel(
  bonusKey: FavoriteBonusKey,
  bonusPts: number
): string {
  if (bonusKey === "final_winner") {
    return bonusPts > 0 ? "Campeón" : "No campeón";
  }
  return bonusPts > 0 ? "Clasificó" : "No clasificó";
}

function getPhaseKeyForMatch(match: Match): HistoryBonusPhaseKey | null {
  if (match.stage === "group") return "groups";
  if (match.stage === "round_32") return "round_32";
  if (match.stage === "round_16") return "round_16";
  if (match.stage === "quarter_final") return "quarter_final";
  if (match.stage === "semi_final") return "semi_final";
  if (match.stage === "final") return "final";
  return null;
}

function isLastFinishedMatchInPhase(
  match: Match,
  finishedMatches: Match[],
  allMatches: Match[]
): boolean {
  const phaseKey = getPhaseKeyForMatch(match);
  if (!phaseKey) return false;

  const phaseDef = HISTORY_BONUS_PHASES.find((p) => p.key === phaseKey);
  if (!phaseDef) return false;

  const phaseMatches = allMatches.filter((m) => phaseDef.stages.includes(m.stage));
  const finishedInPhase = finishedMatches.filter((m) =>
    phaseDef.stages.includes(m.stage)
  );
  if (finishedInPhase.length === 0) return false;

  const last = [...finishedInPhase].sort(
    (a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime()
  )[0];
  return last.id === match.id;
}

export type BuildMatchHistoryInput = {
  finishedMatches: Match[];
  predictions: Prediction[];
  knockoutLabels: Map<number, { teamAName: string; teamBName: string }>;
  favoriteTeamId: number | null;
  allGroupMatches: Match[];
  allKnockoutMatches: Match[];
  allTeams: Team[];
  favoriteTeamName?: string | null;
};

export function buildMatchHistoryRows(input: BuildMatchHistoryInput): MatchHistoryRow[] {
  const {
    finishedMatches,
    predictions,
    knockoutLabels,
    favoriteTeamId,
    allGroupMatches,
    allKnockoutMatches,
    allTeams,
    favoriteTeamName,
  } = input;

  const allMatches = [...allGroupMatches, ...allKnockoutMatches];
  const resolvedKnockoutById = new Map<number, KnockoutResolvedForWinner>();
  if (allTeams.length > 0 && allKnockoutMatches.length > 0) {
    for (const row of resolveKnockoutTeamsForLeague(
      allKnockoutMatches,
      allGroupMatches,
      allTeams,
      []
    )) {
      resolvedKnockoutById.set(row.id, row as KnockoutResolvedForWinner);
    }
  }

  const chronological = [...finishedMatches].sort(
    (a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
  );

  const rows: MatchHistoryRow[] = [];
  let cumulative = 0;
  const insertedBonusPhases = new Set<HistoryBonusPhaseKey>();

  const bonusContext = {
    groupMatches: allGroupMatches,
    knockoutMatches: allKnockoutMatches,
    allTeams,
    resolvedKnockoutById,
  };

  for (const m of chronological) {
    const p = predictions.find((pr) => pr.match_id === m.id);
    const pts = p?.points_won ?? 0;
    cumulative += pts;
    const breakdown =
      p && m.result_a != null
        ? formatPointsBreakdown(
            getPointsBreakdown(
              p as Prediction,
              m as Match,
              resolvedKnockoutById.get(m.id)
            )
          )
        : "";

    const resolved = knockoutLabels.get(m.id);
    const isPenaltyDecision =
      m.stage !== "group" &&
      m.result_a != null &&
      m.result_b != null &&
      m.result_a === m.result_b &&
      m.winner_id != null;

    const penWinnerName = isPenaltyDecision
      ? getKnockoutPenaltyWinnerDisplayName(m, resolved ?? null)
      : null;

    const resDisplay = `${m.result_a}-${m.result_b}${
      penWinnerName ? ` · Penales: ${penWinnerName}` : ""
    }`;

    rows.push({
      kind: "match",
      match: formatHistoryMatchLabel(m, knockoutLabels),
      pred: p ? `${p.predicted_a}-${p.predicted_b}` : "-",
      res: resDisplay,
      pts,
      breakdown,
      total: cumulative,
    });

    if (isLastFinishedMatchInPhase(m, finishedMatches, allMatches)) {
      const phaseKey = getPhaseKeyForMatch(m);
      if (phaseKey && !insertedBonusPhases.has(phaseKey)) {
        const phaseDef = HISTORY_BONUS_PHASES.find((p) => p.key === phaseKey)!;
        const bonusPts = getFavoriteBonusPointsForHistoryPhase(
          favoriteTeamId,
          phaseDef,
          bonusContext
        );
        if (bonusPts !== null) {
          insertedBonusPhases.add(phaseKey);
          cumulative += bonusPts;
          const rule = FAVORITE_BONUS_RULES.find((r) => r.key === phaseDef.bonusKey);
          const favLabel = favoriteTeamName ?? "Equipo favorito";
          rows.push({
            kind: "bonus",
            match: `Bono favorito · ${phaseDef.shortLabel}`,
            pred: favLabel,
            res: bonusHistoryResultLabel(phaseDef.bonusKey, bonusPts),
            pts: bonusPts,
            breakdown: rule?.label ?? "",
            total: cumulative,
          });
        }
      }
    }
  }

  return rows.reverse();
}
