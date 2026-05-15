
import { Match, Prediction } from "@/types";

/**
 * Calcula los puntos ganados para una predicción basada en el sistema aditivo:
 * +1 Ganador/Empate
 * +1 Goles Equipo A
 * +1 Goles Equipo B
 */
export function calculatePoints(prediction: Prediction, match: Match): number {
  if (
    prediction.predicted_a === null ||
    prediction.predicted_b === null ||
    match.result_a === null ||
    match.result_b === null
  ) {
    return 0;
  }

  const pA = Number(prediction.predicted_a);
  const pB = Number(prediction.predicted_b);
  const rA = Number(match.result_a);
  const rB = Number(match.result_b);

  let points = 0;

  // 1. ACIERTO DE TENDENCIA (Ganador o Empate) -> +2 Puntos
  const isKnockout = match.stage !== 'group';
  let correctOutcome = false;

  if (isKnockout) {
    // En eliminatorias, la tendencia es quién pasa de ronda
    const actualWinnerId = rA > rB ? match.team_a_id : (rB > rA ? match.team_b_id : match.winner_id);
    const predictedWinnerId = pA > pB ? match.team_a_id : (pB > pA ? match.team_b_id : prediction.predicted_winner_id);
    
    correctOutcome = actualWinnerId !== null && predictedWinnerId !== null && actualWinnerId === predictedWinnerId;
  } else {
    // En fase de grupos, la tendencia es el resultado (1, X, 2)
    const predictedDiff = pA - pB;
    const actualDiff = rA - rB;
    correctOutcome = 
      (predictedDiff > 0 && actualDiff > 0) || // Gana A
      (predictedDiff < 0 && actualDiff < 0) || // Gana B
      (predictedDiff === 0 && actualDiff === 0); // Empate
  }

  if (correctOutcome) points += 2;

  // 2. ACIERTO DE DIFERENCIA DE GOLES -> +1 Punto
  const predictedDiff = pA - pB;
  const actualDiff = rA - rB;
  if (Math.abs(predictedDiff) === Math.abs(actualDiff)) points += 1;

  // 3. ACIERTO DE GOLES INDIVIDUALES -> +1 Punto por cada equipo (+2 total)
  if (pA === rA) points += 1;
  if (pB === rB) points += 1;

  return points;
}
