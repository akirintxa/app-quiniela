import { Match, Prediction } from "@/types";
import {
  getKnockoutOfficialWinnerTeamId,
  resolvePredictedKnockoutWinnerNationalId,
  type KnockoutResolvedForWinner,
} from "./match-admin";

export const MAX_POINTS_PER_MATCH = 5;
export const MAX_POINTS_KNOCKOUT_MATCH = 7;
export const KNOCKOUT_QUALIFIER_BONUS = 2;

export const KNOCKOUT_STAGES = [
  "round_32",
  "round_16",
  "quarter_final",
  "semi_final",
  "final",
  "third_place",
] as const;

export const SCORING_RULES = [
  { points: 2, label: "Ganador", detail: "Aciertas quién gana (o empate)" },
  {
    points: 1,
    label: "Diferencia",
    detail:
      "Mismo margen de goles y mismo resultado (victoria local, visitante o empate)",
  },
  { points: 1, label: "Goles local", detail: "Marcador exacto del equipo A" },
  { points: 1, label: "Goles visita", detail: "Marcador exacto del equipo B" },
] as const;

export const KNOCKOUT_QUALIFIER_RULE = {
  points: KNOCKOUT_QUALIFIER_BONUS,
  label: "Clasificado",
  /** Texto corto (compacto / móvil en manual). */
  detail: "16vos en adelante: aciertas quién pasa (incluye penales)",
} as const;

export type PointsBreakdown = {
  winner: number;
  difference: number;
  goalsA: number;
  goalsB: number;
  qualifier: number;
  total: number;
};

export function isKnockoutStage(stage: string): boolean {
  return (KNOCKOUT_STAGES as readonly string[]).includes(stage);
}

/** Resuelve bandos KO desde fila de partido ya enriquecida en UI o bracket. */
export function knockoutResolvedFromMatch(
  match: Match & {
    knockout_slot_a_id?: number | null;
    knockout_slot_b_id?: number | null;
  }
): KnockoutResolvedForWinner | null {
  if (!isKnockoutStage(match.stage)) return null;
  return {
    team_a_id: match.team_a?.id ?? match.team_a_id,
    team_b_id: match.team_b?.id ?? match.team_b_id,
    team_a: match.team_a ?? undefined,
    team_b: match.team_b ?? undefined,
    knockout_slot_a_id: match.knockout_slot_a_id ?? match.team_a_id,
    knockout_slot_b_id: match.knockout_slot_b_id ?? match.team_b_id,
  };
}

function isCorrectRegulationOutcome(pA: number, pB: number, rA: number, rB: number): boolean {
  const predictedDiff = pA - pB;
  const actualDiff = rA - rB;
  return (
    (predictedDiff > 0 && actualDiff > 0) ||
    (predictedDiff < 0 && actualDiff < 0) ||
    (predictedDiff === 0 && actualDiff === 0)
  );
}

function isCorrectQualifier(
  prediction: PredictionForScoring,
  match: Match,
  resolved: KnockoutResolvedForWinner | null | undefined
): boolean {
  if (!resolved) return false;
  const actual = getKnockoutOfficialWinnerTeamId(match, resolved);
  const predicted = resolvePredictedKnockoutWinnerNationalId(
    prediction,
    match,
    resolved
  );
  return actual != null && predicted != null && actual === predicted;
}

export type PredictionForScoring = Pick<
  Prediction,
  "predicted_a" | "predicted_b" | "predicted_winner_id"
>;

/** Desglose por partido (máx. +5 grupos; +7 eliminatorias con bono clasificado). */
export function getPointsBreakdown(
  prediction: PredictionForScoring,
  match: Match,
  resolved?: KnockoutResolvedForWinner | null
): PointsBreakdown {
  const empty: PointsBreakdown = {
    winner: 0,
    difference: 0,
    goalsA: 0,
    goalsB: 0,
    qualifier: 0,
    total: 0,
  };

  if (
    prediction.predicted_a === null ||
    prediction.predicted_b === null ||
    match.result_a === null ||
    match.result_b === null
  ) {
    return empty;
  }

  const pA = Number(prediction.predicted_a);
  const pB = Number(prediction.predicted_b);
  const rA = Number(match.result_a);
  const rB = Number(match.result_b);

  const knockout = isKnockoutStage(match.stage);
  const resolvedRow = knockout
    ? resolved ?? knockoutResolvedFromMatch(match)
    : null;

  const winner = isCorrectRegulationOutcome(pA, pB, rA, rB) ? 2 : 0;
  const difference = pA - pB === rA - rB ? 1 : 0;
  const goalsA = pA === rA ? 1 : 0;
  const goalsB = pB === rB ? 1 : 0;
  const qualifier =
    knockout && isCorrectQualifier(prediction, match, resolvedRow)
      ? KNOCKOUT_QUALIFIER_BONUS
      : 0;

  return {
    winner,
    difference,
    goalsA,
    goalsB,
    qualifier,
    total: winner + difference + goalsA + goalsB + qualifier,
  };
}

export function formatPointsBreakdown(b: PointsBreakdown): string {
  const parts: string[] = [];
  if (b.winner) parts.push("+2G");
  if (b.difference) parts.push("+1D");
  if (b.goalsA) parts.push("+1A");
  if (b.goalsB) parts.push("+1B");
  if (b.qualifier) parts.push("+2C");
  return parts.length > 0 ? parts.join(" ") : "0";
}

export function calculatePoints(
  prediction: PredictionForScoring,
  match: Match,
  resolved?: KnockoutResolvedForWinner | null
): number {
  return getPointsBreakdown(prediction, match, resolved).total;
}

export function maxPointsForStage(stage: string): number {
  return isKnockoutStage(stage) ? MAX_POINTS_KNOCKOUT_MATCH : MAX_POINTS_PER_MATCH;
}
