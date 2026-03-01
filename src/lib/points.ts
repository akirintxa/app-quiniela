
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

  let points = 0;

  // 1. ACIERTO DE TENDENCIA (Ganador o Empate)
  const predictedDiff = prediction.predicted_a - prediction.predicted_b;
  const actualDiff = match.result_a - match.result_b;

  const correctOutcome = 
    (predictedDiff > 0 && actualDiff > 0) || // Gana A
    (predictedDiff < 0 && actualDiff < 0) || // Gana B
    (predictedDiff === 0 && actualDiff === 0); // Empate

  if (correctOutcome) points += 1;

  // 2. ACIERTO DE GOLES EQUIPO A
  if (prediction.predicted_a === match.result_a) points += 1;

  // 3. ACIERTO DE GOLES EQUIPO B
  if (prediction.predicted_b === match.result_b) points += 1;

  return points;
}
