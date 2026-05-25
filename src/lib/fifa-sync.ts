/**
 * Sincronización con datos en vivo de FIFA (futuro).
 *
 * Flujo previsto:
 * 1. Cron o webhook que lea el feed oficial / página de resultados.
 * 2. Mapear partido FIFA → matches.id (por fecha, equipos o código externo).
 * 3. Llamar las mismas server actions que el panel admin:
 *    startMatch → updateLiveScore → finalizeMatch.
 *
 * No implementado aún; el panel /admin es la fuente manual de verdad.
 */

export type FifaExternalMatch = {
  externalId: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  status: "scheduled" | "live" | "finished";
};

export async function syncFifaMatches(): Promise<void> {
  throw new Error("FIFA sync no implementado. Usa /admin por ahora.");
}
