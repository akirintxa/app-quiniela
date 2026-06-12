import type { SupabaseClient } from "@supabase/supabase-js";
import { resolveKnockoutWinnerId } from "@/lib/match-admin";
import { calculatePoints, isKnockoutStage } from "@/lib/points";
import { loadResolvedKnockoutMatch } from "@/lib/knockout-points-context";
import type { Match, Prediction } from "@/types";

export type MatchSyncResult =
  | { ok: true; skipped?: boolean }
  | { ok: false; error: string };

type ServiceSupabase = SupabaseClient;

export async function updatePredictionsPoints(
  supabase: ServiceSupabase,
  matchId: number,
  matchData: Match
): Promise<number> {
  const { data: predictions, error: fetchError } = await supabase
    .from("predictions")
    .select("*")
    .eq("match_id", matchId);

  if (fetchError) {
    console.error("updatePredictionsPoints fetch:", fetchError);
    throw new Error(fetchError.message);
  }

  if (!predictions?.length) return 0;

  const resolvedKnockout = isKnockoutStage(matchData.stage)
    ? await loadResolvedKnockoutMatch(supabase, matchId, matchData.stage)
    : null;

  for (const pred of predictions) {
    const points = calculatePoints(
      pred as Prediction,
      matchData,
      resolvedKnockout
    );
    const { error } = await supabase
      .from("predictions")
      .update({ points_won: points })
      .eq("id", pred.id);
    if (error) {
      console.error("updatePredictionsPoints row:", error);
      throw new Error(error.message);
    }
  }

  return predictions.length;
}

/** Recalcula points_won de todos los partidos con marcador (p. ej. tras cambiar reglas). */
export async function recalculateAllFinishedMatchPoints(
  supabase: ServiceSupabase
): Promise<{ matches: number; predictions: number }> {
  const { data: matches, error } = await supabase
    .from("matches")
    .select("*")
    .not("result_a", "is", null)
    .not("result_b", "is", null)
    .order("id", { ascending: true });

  if (error) throw new Error(error.message);

  let predictions = 0;
  for (const row of matches ?? []) {
    predictions += await updatePredictionsPoints(
      supabase,
      row.id,
      row as Match
    );
  }

  return { matches: matches?.length ?? 0, predictions };
}

export async function loadMatchRow(
  supabase: ServiceSupabase,
  matchId: number
): Promise<Match> {
  const { data, error } = await supabase
    .from("matches")
    .select("*")
    .eq("id", matchId)
    .single();
  if (error || !data) {
    throw new Error(error?.message || "Partido no encontrado");
  }
  return data as Match;
}

/** Partido iniciado: 0-0, predicciones bloqueadas, puntos en vivo recalculables */
export async function startMatchSync(
  supabase: ServiceSupabase,
  matchId: number
): Promise<MatchSyncResult> {
  try {
    const existing = await loadMatchRow(supabase, matchId);
    if (existing.is_locked && !existing.is_finished) {
      return { ok: true, skipped: true };
    }
    if (existing.is_finished) {
      return { ok: true, skipped: true };
    }

    const winnerId = resolveKnockoutWinnerId(existing, 0, 0, null);

    const { data: match, error } = await supabase
      .from("matches")
      .update({
        result_a: 0,
        result_b: 0,
        winner_id: winnerId,
        is_locked: true,
        is_finished: false,
        last_synced_at: new Date().toISOString(),
      })
      .eq("id", matchId)
      .select()
      .single();

    if (error) return { ok: false, error: error.message };
    if (match) await updatePredictionsPoints(supabase, matchId, match as Match);
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Error al iniciar",
    };
  }
}

export async function updateLiveScoreSync(
  supabase: ServiceSupabase,
  matchId: number,
  resultA: number,
  resultB: number,
  winnerId: number | null = null
): Promise<MatchSyncResult> {
  try {
    const existing = await loadMatchRow(supabase, matchId);
    if (existing.is_finished) {
      return { ok: true, skipped: true };
    }

    const resolvedWinner = resolveKnockoutWinnerId(
      existing,
      resultA,
      resultB,
      winnerId
    );

    const { data: match, error } = await supabase
      .from("matches")
      .update({
        result_a: resultA,
        result_b: resultB,
        winner_id: resolvedWinner,
        is_locked: true,
        is_finished: false,
        last_synced_at: new Date().toISOString(),
      })
      .eq("id", matchId)
      .select()
      .single();

    if (error) return { ok: false, error: error.message };
    if (match) await updatePredictionsPoints(supabase, matchId, match as Match);
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Error al actualizar",
    };
  }
}

export async function finalizeMatchSync(
  supabase: ServiceSupabase,
  matchId: number,
  resultA: number,
  resultB: number,
  winnerId: number | null = null
): Promise<MatchSyncResult> {
  try {
    const existing = await loadMatchRow(supabase, matchId);
    if (existing.is_finished) {
      const sameScore =
        existing.result_a === resultA && existing.result_b === resultB;
      if (sameScore) return { ok: true, skipped: true };
    }

    const resolvedWinner = resolveKnockoutWinnerId(
      existing,
      resultA,
      resultB,
      winnerId
    );

    if (existing.stage !== "group" && resultA === resultB && !resolvedWinner) {
      return {
        ok: false,
        error: "Eliminatoria empatada sin ganador de penales",
      };
    }

    const { data: match, error } = await supabase
      .from("matches")
      .update({
        result_a: resultA,
        result_b: resultB,
        winner_id: resolvedWinner,
        is_locked: true,
        is_finished: true,
        last_synced_at: new Date().toISOString(),
      })
      .eq("id", matchId)
      .select()
      .single();

    if (error) return { ok: false, error: error.message };
    if (match) await updatePredictionsPoints(supabase, matchId, match as Match);
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Error al finalizar",
    };
  }
}

export type ExternalMatchStatus = "scheduled" | "live" | "finished";

export async function applyMatchStateSync(
  supabase: ServiceSupabase,
  matchId: number,
  params: {
    status: ExternalMatchStatus;
    resultA: number;
    resultB: number;
    winnerId?: number | null;
  }
): Promise<MatchSyncResult & { action?: string }> {
  const { status, resultA, resultB, winnerId = null } = params;

  if (status === "scheduled") {
    return { ok: true, skipped: true, action: "scheduled" };
  }

  if (status === "live") {
    const existing = await loadMatchRow(supabase, matchId);
    if (!existing.is_locked) {
      const started = await startMatchSync(supabase, matchId);
      if (!started.ok) return started;
    }
    const updated = await updateLiveScoreSync(
      supabase,
      matchId,
      resultA,
      resultB,
      winnerId
    );
    return { ...updated, action: "live" };
  }

  const finalized = await finalizeMatchSync(
    supabase,
    matchId,
    resultA,
    resultB,
    winnerId
  );
  return { ...finalized, action: "finished" };
}
