
import { isCorrectMatchOutcome, getPointsBreakdown } from "@/lib/points";
import type { Match, Prediction } from "@/types";

export type PoolMemberEffectiveness = {
  userId: string;
  played: number;
  plenos: number;
  ganadores: number;
  diferencias: number;
  golesLocal: number;
  golesVisita: number;
  effectivenessPct: number;
};

export type PoolTimelineStep = {
  matchId: number;
  label: string;
  cumulativeByUser: Record<string, number>;
};

function competitionRankAtIndex(
  sortedByPointsDesc: { points: number }[],
  index: number
): number {
  const pts = sortedByPointsDesc[index].points;
  const firstIdx = sortedByPointsDesc.findIndex((s) => s.points === pts);
  return firstIdx + 1;
}

/** Línea del usuario que consulta (siempre negro sólido). */
export const CURRENT_USER_CHART_COLOR = "#0a0a0a";

export type MemberChartStyle = {
  color: string;
  strokeDasharray?: string;
};

/** Fuerte + pastel por familia de color (16 huecos por ciclo). */
const HUE_PAIRS = [
  { strong: "#CA8A04", pastel: "#FDE047" }, // amarillo
  { strong: "#2563EB", pastel: "#93C5FD" }, // azul
  { strong: "#DC2626", pastel: "#FCA5A5" }, // rojo
  { strong: "#16A34A", pastel: "#86EFAC" }, // verde
  { strong: "#7C3AED", pastel: "#C4B5FD" }, // morado
  { strong: "#EA580C", pastel: "#FDBA74" }, // naranja
  { strong: "#374151", pastel: "#D1D5DB" }, // gris oscuro / claro
  { strong: "#78350F", pastel: "#E7C9A3" }, // marrón / claro
] as const;

const SLOTS_PER_CYCLE = HUE_PAIRS.length * 2;

const OVERFLOW_DASH = ["10 6", "3 5", "10 6 3 6"] as const;

export function styleForMemberIndex(index: number): MemberChartStyle {
  const slot = index % SLOTS_PER_CYCLE;
  const pairIndex = Math.floor(slot / 2);
  const isPastel = slot % 2 === 1;
  const pair = HUE_PAIRS[pairIndex];
  const color = isPastel ? pair.pastel : pair.strong;
  const overflow = Math.floor(index / SLOTS_PER_CYCLE);
  if (overflow === 0) return { color };
  const dash = OVERFLOW_DASH[(overflow - 1) % OVERFLOW_DASH.length];
  return { color, strokeDasharray: dash };
}

export function buildMemberStyleMap(
  members: { id: string; nickname: string }[]
): Map<string, MemberChartStyle> {
  const sorted = [...members].sort((a, b) =>
    a.nickname.localeCompare(b.nickname, "es")
  );
  const map = new Map<string, MemberChartStyle>();
  sorted.forEach((m, i) => map.set(m.id, styleForMemberIndex(i)));
  return map;
}

export function chartLineStyle(
  userId: string,
  currentUserId: string,
  styleMap: Map<string, MemberChartStyle>
): MemberChartStyle {
  if (userId === currentUserId) {
    return { color: CURRENT_USER_CHART_COLOR };
  }
  return styleMap.get(userId) ?? styleForMemberIndex(0);
}

function isScoredMatch(m: Match): boolean {
  return m.result_a !== null && m.result_b !== null;
}

export function buildPoolPointsTimeline(
  finishedMatches: Match[],
  predictions: Prediction[],
  memberIds: string[]
): PoolTimelineStep[] {
  const sorted = [...finishedMatches]
    .filter(isScoredMatch)
    .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());

  const predsByUserMatch = new Map<string, Prediction>();
  for (const p of predictions) {
    predsByUserMatch.set(`${p.user_id}:${p.match_id}`, p);
  }

  const cumulative: Record<string, number> = {};
  memberIds.forEach((id) => { cumulative[id] = 0; });

  const steps: PoolTimelineStep[] = [
    { matchId: 0, label: "Inicio", cumulativeByUser: { ...cumulative } },
  ];

  for (const match of sorted) {
    for (const userId of memberIds) {
      const pred = predsByUserMatch.get(`${userId}:${match.id}`);
      if (pred?.points_won != null) {
        cumulative[userId] += pred.points_won;
      }
    }
    const teamA = match.team_a?.name?.slice(0, 3).toUpperCase() ?? "A";
    const teamB = match.team_b?.name?.slice(0, 3).toUpperCase() ?? "B";
    steps.push({
      matchId: match.id,
      label: `${teamA}-${teamB}`,
      cumulativeByUser: { ...cumulative },
    });
  }

  return steps;
}

export function aggregateMemberEffectiveness(
  userId: string,
  predictions: Prediction[],
  matchesById: Map<number, Match>
): PoolMemberEffectiveness {
  const stats: PoolMemberEffectiveness = {
    userId, played: 0, plenos: 0, ganadores: 0, diferencias: 0,
    golesLocal: 0, golesVisita: 0, effectivenessPct: 0,
  };

  for (const p of predictions) {
    if (p.user_id !== userId) continue;
    const m = matchesById.get(p.match_id);
    if (!m || !isScoredMatch(m) || p.predicted_a === null || p.predicted_b === null) continue;

    stats.played += 1;
    const rA = m.result_a!;
    const rB = m.result_b!;
    const pA = p.predicted_a;
    const pB = p.predicted_b;

    if (pA === rA && pB === rB) stats.plenos += 1;
    if (isCorrectMatchOutcome(pA, pB, rA, rB)) stats.ganadores += 1;

    const breakdown = getPointsBreakdown(p, m);
    if (breakdown.difference) stats.diferencias += 1;
    if (breakdown.goalsA) stats.golesLocal += 1;
    if (breakdown.goalsB) stats.golesVisita += 1;
  }

  stats.effectivenessPct = stats.played > 0
    ? Math.round((stats.ganadores / stats.played) * 100)
    : 0;

  return stats;
}

export function buildPoolEffectivenessTable(
  memberIds: string[],
  predictions: Prediction[],
  matchesById: Map<number, Match>
): PoolMemberEffectiveness[] {
  return memberIds.map((id) => aggregateMemberEffectiveness(id, predictions, matchesById));
}

export function selectChartMemberIds(
  memberIds: string[],
  finalTotals: Record<string, number>,
  currentUserId: string,
  maxLines = 6
): string[] {
  const ranked = [...memberIds].sort((a, b) => (finalTotals[b] ?? 0) - (finalTotals[a] ?? 0));
  const top = ranked.slice(0, maxLines);
  if (!top.includes(currentUserId)) {
    top.pop();
    top.push(currentUserId);
  }
  return top;
}

export type PoolRankTimelineStep = {
  matchId: number;
  label: string;
  rankByUser: Record<string, number>;
};

/** Posición en la liga tras cada partido (mismos puntos acumulados que la gráfica de puntos). */
export function buildPoolRankTimeline(
  pointsTimeline: PoolTimelineStep[],
  memberIds: string[]
): PoolRankTimelineStep[] {
  return pointsTimeline.map((step) => {
    const sorted = [...memberIds]
      .map((id) => ({ id, points: step.cumulativeByUser[id] ?? 0 }))
      .sort((a, b) => b.points - a.points || a.id.localeCompare(b.id));

    const rankByUser: Record<string, number> = {};
    sorted.forEach((row, index) => {
      rankByUser[row.id] = competitionRankAtIndex(
        sorted.map((s) => ({ points: s.points })),
        index
      );
    });

    return {
      matchId: step.matchId,
      label: step.label,
      rankByUser,
    };
  });
}
