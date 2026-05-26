import type { Match } from "@/types";
import { resolveKnockoutWinnerId } from "./match-admin";

export type RandomMatchResult = {
  resultA: number;
  resultB: number;
  winnerId: number | null;
};

function randomInt(maxInclusive: number): number {
  return Math.floor(Math.random() * (maxInclusive + 1));
}

/** Marcador aleatorio para fase de grupos (0–4). */
export function randomGroupMatchResult(): RandomMatchResult {
  return {
    resultA: randomInt(4),
    resultB: randomInt(4),
    winnerId: null,
  };
}

/** Marcador aleatorio para eliminatorias; en empate elige ganador al azar. */
export function randomKnockoutMatchResult(
  match: Pick<Match, "stage" | "team_a_id" | "team_b_id">
): RandomMatchResult {
  let resultA = randomInt(3);
  let resultB = randomInt(3);

  if (resultA === resultB) {
    const winnerId =
      Math.random() < 0.5 ? match.team_a_id : match.team_b_id;
    return { resultA, resultB, winnerId };
  }

  return {
    resultA,
    resultB,
    winnerId: resolveKnockoutWinnerId(match, resultA, resultB, null),
  };
}

export function randomResultForMatch(match: Match): RandomMatchResult {
  return match.stage === "group"
    ? randomGroupMatchResult()
    : randomKnockoutMatchResult(match);
}
