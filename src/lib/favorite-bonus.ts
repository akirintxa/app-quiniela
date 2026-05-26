import { Match, Prediction, Team } from "@/types";
import { calculateStandings } from "./standings";

export const FAVORITE_BONUS_RULES = [
  {
    key: "to_round_16",
    points: 5,
    label: "Clasifica a dieciseisavos",
    detail: "Tu favorito queda entre los 16 (fase de grupos, resultado real)",
  },
  {
    key: "to_round_8",
    points: 5,
    label: "Clasifica a octavos",
    detail: "Gana su partido de dieciseisavos",
  },
  {
    key: "to_quarter",
    points: 10,
    label: "Clasifica a cuartos",
    detail: "Gana su partido de octavos",
  },
  {
    key: "to_semi",
    points: 10,
    label: "Clasifica a semis",
    detail: "Gana su partido de cuartos",
  },
  {
    key: "to_final",
    points: 15,
    label: "Llega a la final",
    detail: "Gana su partido de semifinal",
  },
  {
    key: "final_winner",
    points: 15,
    label: "Campeón del Mundial",
    detail: "Aciertas el ganador en la final",
  },
] as const;

export type FavoriteBonusKey = (typeof FAVORITE_BONUS_RULES)[number]["key"];

export type FavoriteBonusAward = {
  key: FavoriteBonusKey;
  points: number;
  label: string;
};

export type FavoriteBonusResult = {
  total: number;
  awards: FavoriteBonusAward[];
};

function getMatchWinnerId(match: Match): number | null {
  if (match.result_a === null || match.result_b === null) return null;
  if (match.winner_id) return match.winner_id;
  if (match.result_a > match.result_b) return match.team_a_id;
  if (match.result_b > match.result_a) return match.team_b_id;
  return null;
}

function teamWonStage(
  teamId: number,
  stage: string,
  finishedKnockout: Match[]
): boolean {
  return finishedKnockout
    .filter((m) => m.stage === stage)
    .some((m) => getMatchWinnerId(m) === teamId);
}

function teamQualifiedToRoundOf16(
  teamId: number,
  groupMatches: Match[]
): boolean {
  const finished = groupMatches.filter(
    (m) =>
      m.stage === "group" &&
      m.group_id &&
      m.result_a !== null &&
      m.result_b !== null
  );
  const groupIds = [...new Set(finished.map((m) => m.group_id).filter(Boolean))];

  for (const gid of groupIds) {
    const inGroup = finished.filter((m) => m.group_id === gid);
    const teamMap = new Map<number, Team>();
    inGroup.forEach((m) => {
      if (m.team_a) teamMap.set(m.team_a.id, m.team_a as Team);
      if (m.team_b) teamMap.set(m.team_b.id, m.team_b as Team);
    });
    const standings = calculateStandings(inGroup, Array.from(teamMap.values()));
    const topTwo = standings.slice(0, 2).map((s) => s.team.id);
    if (topTwo.includes(teamId)) return true;
  }
  return false;
}

function predictedFinalWinner(
  prediction: Prediction,
  match: Match
): number | null {
  if (prediction.predicted_winner_id) return prediction.predicted_winner_id;
  if (
    prediction.predicted_a === null ||
    prediction.predicted_b === null
  ) {
    return null;
  }
  const pA = Number(prediction.predicted_a);
  const pB = Number(prediction.predicted_b);
  if (pA > pB) return match.team_a_id;
  if (pB > pA) return match.team_b_id;
  return null;
}

export function calculateFavoriteTeamBonuses(
  favoriteTeamId: number | null | undefined,
  options: {
    groupMatches: Match[];
    knockoutMatches: Match[];
    finalPrediction?: Prediction | null;
  }
): FavoriteBonusResult {
  const awards: FavoriteBonusAward[] = [];
  if (!favoriteTeamId) return { total: 0, awards: [] };

  const teamId = favoriteTeamId;
  const finishedKnockout = options.knockoutMatches.filter(
    (m) => m.result_a !== null && m.result_b !== null
  );

  const rule = (key: FavoriteBonusKey) =>
    FAVORITE_BONUS_RULES.find((r) => r.key === key)!;

  if (teamQualifiedToRoundOf16(teamId, options.groupMatches)) {
    const r = rule("to_round_16");
    awards.push({ key: r.key, points: r.points, label: r.label });
  }

  if (teamWonStage(teamId, "round_32", finishedKnockout)) {
    const r = rule("to_round_8");
    awards.push({ key: r.key, points: r.points, label: r.label });
  }

  if (teamWonStage(teamId, "round_16", finishedKnockout)) {
    const r = rule("to_quarter");
    awards.push({ key: r.key, points: r.points, label: r.label });
  }

  if (teamWonStage(teamId, "quarter_final", finishedKnockout)) {
    const r = rule("to_semi");
    awards.push({ key: r.key, points: r.points, label: r.label });
  }

  if (teamWonStage(teamId, "semi_final", finishedKnockout)) {
    const r = rule("to_final");
    awards.push({ key: r.key, points: r.points, label: r.label });
  }

  const finalMatch = finishedKnockout.find((m) => m.stage === "final");
  if (finalMatch && options.finalPrediction) {
    const actual = getMatchWinnerId(finalMatch);
    const predicted = predictedFinalWinner(options.finalPrediction, finalMatch);
    if (actual && predicted && actual === predicted) {
      const r = rule("final_winner");
      awards.push({ key: r.key, points: r.points, label: r.label });
    }
  }

  const total = awards.reduce((sum, a) => sum + a.points, 0);
  return { total, awards };
}

/** Suma predicciones + bono favorito para un usuario */
export function getTotalPointsWithFavoriteBonus(
  matchPoints: number,
  favoriteBonus: FavoriteBonusResult
): number {
  return matchPoints + favoriteBonus.total;
}

export type HistoryBonusPhaseKey =
  | "groups"
  | "round_32"
  | "round_16"
  | "quarter_final"
  | "semi_final"
  | "final";

export const HISTORY_BONUS_PHASES: {
  key: HistoryBonusPhaseKey;
  stages: string[];
  shortLabel: string;
  bonusKey: FavoriteBonusKey;
}[] = [
  { key: "groups", stages: ["group"], shortLabel: "Grupos", bonusKey: "to_round_16" },
  { key: "round_32", stages: ["round_32"], shortLabel: "16vos", bonusKey: "to_round_8" },
  { key: "round_16", stages: ["round_16"], shortLabel: "8vos", bonusKey: "to_quarter" },
  {
    key: "quarter_final",
    stages: ["quarter_final"],
    shortLabel: "Cuartos",
    bonusKey: "to_semi",
  },
  { key: "semi_final", stages: ["semi_final"], shortLabel: "Semis", bonusKey: "to_final" },
  { key: "final", stages: ["final"], shortLabel: "Final", bonusKey: "final_winner" },
];

function matchHasOfficialResult(m: Match): boolean {
  return m.result_a !== null && m.result_b !== null;
}

export function isHistoryPhaseOfficiallyComplete(
  phase: (typeof HISTORY_BONUS_PHASES)[number],
  allMatches: Match[]
): boolean {
  const inPhase = allMatches.filter((m) => phase.stages.includes(m.stage));
  if (inPhase.length === 0) return false;
  return inPhase.every(matchHasOfficialResult);
}

/** Puntos de bono favorito al cerrar una fase (0 si no aplica). null si la fase aún no termina. */
export function getFavoriteBonusPointsForHistoryPhase(
  favoriteTeamId: number | null | undefined,
  phase: (typeof HISTORY_BONUS_PHASES)[number],
  options: {
    groupMatches: Match[];
    knockoutMatches: Match[];
    finalPrediction?: Prediction | null;
  }
): number | null {
  const allMatches = [...options.groupMatches, ...options.knockoutMatches];
  if (!isHistoryPhaseOfficiallyComplete(phase, allMatches)) return null;
  if (!favoriteTeamId) return 0;

  const finishedKnockout = options.knockoutMatches.filter(matchHasOfficialResult);

  switch (phase.bonusKey) {
    case "to_round_16":
      return teamQualifiedToRoundOf16(favoriteTeamId, options.groupMatches) ? 5 : 0;
    case "to_round_8":
      return teamWonStage(favoriteTeamId, "round_32", finishedKnockout) ? 5 : 0;
    case "to_quarter":
      return teamWonStage(favoriteTeamId, "round_16", finishedKnockout) ? 10 : 0;
    case "to_semi":
      return teamWonStage(favoriteTeamId, "quarter_final", finishedKnockout) ? 10 : 0;
    case "to_final":
      return teamWonStage(favoriteTeamId, "semi_final", finishedKnockout) ? 15 : 0;
    case "final_winner": {
      const finalMatch = finishedKnockout.find((m) => m.stage === "final");
      if (!finalMatch || !options.finalPrediction) return 0;
      const actual = getMatchWinnerId(finalMatch);
      const predicted = predictedFinalWinner(options.finalPrediction, finalMatch);
      return actual && predicted && actual === predicted ? 15 : 0;
    }
    default:
      return 0;
  }
}
