
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

  // 1. ACIERTO DE TENDENCIA (Ganador o Empate) -> +2 Puntos
  const predictedDiff = prediction.predicted_a - prediction.predicted_b;
  const actualDiff = match.result_a - match.result_b;

  const correctOutcome = 
    (predictedDiff > 0 && actualDiff > 0) || // Gana A
    (predictedDiff < 0 && actualDiff < 0) || // Gana B
    (predictedDiff === 0 && actualDiff === 0); // Empate

  if (correctOutcome) points += 2;

  // 2. ACIERTO DE DIFERENCIA DE GOLES -> +1 Punto
  // Se premia la lectura del margen del partido (ej: 1-0 vs 2-1)
  // Usamos Math.abs para premiar la diferencia incluso si falló el ganador
  if (Math.abs(predictedDiff) === Math.abs(actualDiff)) points += 1;

  // 3. ACIERTO DE GOLES INDIVIDUALES -> +1 Punto por cada equipo (+2 total)
  if (prediction.predicted_a === match.result_a) points += 1;
  if (prediction.predicted_b === match.result_b) points += 1;

  return points;
}
