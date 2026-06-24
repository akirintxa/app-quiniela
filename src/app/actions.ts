'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/utils/supabase/server';
import {
  createServiceRoleClient,
  tryCreateServiceRoleClient,
} from '@/utils/supabase/admin';
import { isAppAdminEmail } from "@/lib/app-admin";
import { randomResultForMatch } from '@/lib/admin-random-scores';
import { resolveKnockoutWinnerId } from '@/lib/match-admin';
import {
  finalizeMatchSync,
  recalculateAllFinishedMatchPoints,
  startMatchSync,
  swapMatchSidesSync,
  updateLiveScoreSync,
  updatePredictionsPoints,
  loadMatchRow,
} from '@/lib/match-sync';
import { auditInvertedFutureGroupMatches } from '@/lib/match-side-alignment-server';
import type { InvertedMatchAuditRow } from '@/lib/score-providers/match-side-alignment';
import { revalidateAfterMatchUpdate } from '@/lib/revalidate-app';
import { isFavoriteTeamChangeLocked, isTournamentStarted } from '@/lib/tournament';
import { KNOCKOUT_MATCH_IDS } from '@/lib/bracket-fixtures';
import {
  getMatchIdsToInvalidateOnGroupChange,
  getMatchIdsToInvalidateOnKnockoutChange,
} from '@/lib/knockout-invalidation';
import { isMatchClosedForPredictions } from '@/lib/prediction';
import { Match, Prediction } from '@/types';
import { GroupId } from '@/types/knockout';
import {
  fetchPoolMatchPredictionsForMembers,
  type PoolMatchPredictionRow,
} from '@/lib/pool-predictions-server';

// Helper to check admin permission
async function checkAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || !isAppAdminEmail(user.email)) {
    throw new Error("Unauthorized");
  }
  return supabase;
}

export async function getIsAppAdmin(): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return isAppAdminEmail(user?.email);
}

async function invalidateKnockoutPredictions(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  matchIds: number[]
) {
  const unique = [...new Set(matchIds)].filter(Boolean);
  if (unique.length === 0) return;
  await supabase.from('predictions').delete().eq('user_id', userId).in('match_id', unique);
}

export async function fetchPoolMatchPredictions(
  poolId: string,
  matchId: number,
  memberProfiles: { id: string; nickname: string }[],
  phaseCompleteByUser: Record<string, boolean>
): Promise<PoolMatchPredictionRow[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Debes iniciar sesión');

  return fetchPoolMatchPredictionsForMembers(
    poolId,
    user.id,
    matchId,
    memberProfiles,
    phaseCompleteByUser
  );
}

// USER: Save a prediction
export async function savePrediction(matchId: number, scoreA: number, scoreB: number, winnerId?: number | null) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Debes iniciar sesión');

  const { data: match } = await supabase
    .from('matches')
    .select('is_locked, is_finished, start_time, team_a_id, team_b_id, stage, group_id')
    .eq('id', matchId)
    .single();
  if (!match) throw new Error('Partido no encontrado');
  
  if (isMatchClosedForPredictions(match)) {
    throw new Error('Cerrado');
  }

  const predictedWinnerId = winnerId || (scoreA > scoreB ? match.team_a_id : (scoreB > scoreA ? match.team_b_id : null));

  const { data, error } = await supabase
    .from('predictions')
    .upsert({
      user_id: user.id,
      match_id: matchId,
      predicted_a: scoreA,
      predicted_b: scoreB,
      predicted_winner_id: predictedWinnerId
    }, { onConflict: 'user_id,match_id' })
    .select();

  if (error) throw error;

  if (match.stage === 'group' && match.group_id) {
    const toClear = getMatchIdsToInvalidateOnGroupChange(match.group_id as GroupId);
    await invalidateKnockoutPredictions(supabase, user.id, toClear);
  } else if (match.stage !== 'group') {
    const downstream = getMatchIdsToInvalidateOnKnockoutChange(matchId).filter((id) => id !== matchId);
    await invalidateKnockoutPredictions(supabase, user.id, downstream);
  }

  revalidatePath('/');
  revalidatePath('/groups');
  return data;
}

export type StagePredictionInput = {
  matchId: number;
  scoreA: number;
  scoreB: number;
  winnerId?: number | null;
};

/** Guarda varias predicciones de una fase en un solo paso */
export async function saveStagePredictions(items: StagePredictionInput[]) {
  if (items.length === 0) return { saved: 0 };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Debes iniciar sesión");

  const matchIds = items.map((i) => i.matchId);
  const { data: matches } = await supabase.from("matches").select("*").in("id", matchIds);
  const matchMap = new Map((matches ?? []).map((m) => [m.id, m]));

  const rows: {
    user_id: string;
    match_id: number;
    predicted_a: number;
    predicted_b: number;
    predicted_winner_id: number | null;
  }[] = [];
  const downstreamToClear = new Set<number>();

  for (const item of items) {
    const match = matchMap.get(item.matchId);
    if (!match) continue;
    if (isMatchClosedForPredictions(match)) {
      continue;
    }

    const predictedWinnerId =
      item.winnerId ??
      (item.scoreA > item.scoreB
        ? match.team_a_id
        : item.scoreB > item.scoreA
          ? match.team_b_id
          : null);

    rows.push({
      user_id: user.id,
      match_id: item.matchId,
      predicted_a: item.scoreA,
      predicted_b: item.scoreB,
      predicted_winner_id: predictedWinnerId,
    });

    if (match.stage !== "group") {
      getMatchIdsToInvalidateOnKnockoutChange(item.matchId)
        .filter((id) => id !== item.matchId)
        .forEach((id) => downstreamToClear.add(id));
    }
  }

  if (rows.length === 0) return { saved: 0 };

  const { error } = await supabase
    .from("predictions")
    .upsert(rows, { onConflict: "user_id,match_id" });

  if (error) throw error;

  await invalidateKnockoutPredictions(supabase, user.id, [...downstreamToClear]);

  revalidatePath("/");
  revalidatePath("/groups");

  return { saved: rows.length };
}

function buildRandomPredictions(
  userId: string,
  matches: { id: number; stage: string; team_a_id: number; team_b_id: number }[]
) {
  return matches.map((match) => {
    const scoreA = Math.floor(Math.random() * 4);
    const scoreB = Math.floor(Math.random() * 4);
    let winnerId = null;
    if (match.stage !== 'group' && scoreA === scoreB) {
      winnerId = Math.random() > 0.5 ? match.team_a_id : match.team_b_id;
    } else {
      winnerId = scoreA > scoreB ? match.team_a_id : scoreB > scoreA ? match.team_b_id : null;
    }
    return {
      user_id: userId,
      match_id: match.id,
      predicted_a: scoreA,
      predicted_b: scoreB,
      predicted_winner_id: winnerId,
    };
  });
}

// USER: Randomize Group Predictions (single group)
export async function randomizeGroupPredictions(groupId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { data: matches } = await supabase
    .from('matches')
    .select('*')
    .eq('group_id', groupId)
    .eq('stage', 'group')
    .eq('is_finished', false)
    .eq('is_locked', false);

  const openMatches = (matches ?? []).filter((m) => !isMatchClosedForPredictions(m));
  if (openMatches.length === 0) return;

  await supabase
    .from('predictions')
    .upsert(buildRandomPredictions(user.id, openMatches), { onConflict: 'user_id,match_id' });

  const toClear = getMatchIdsToInvalidateOnGroupChange(groupId as GroupId);
  await invalidateKnockoutPredictions(supabase, user.id, toClear);

  revalidatePath('/');
  revalidatePath('/groups');
}

// USER: Randomize all group-stage predictions (A–L)
export async function randomizeAllGroupPredictions() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { data: matches } = await supabase
    .from('matches')
    .select('*')
    .eq('stage', 'group')
    .eq('is_finished', false)
    .eq('is_locked', false);

  const openMatches = (matches ?? []).filter((m) => !isMatchClosedForPredictions(m));
  if (openMatches.length === 0) return;

  await supabase
    .from('predictions')
    .upsert(buildRandomPredictions(user.id, openMatches), { onConflict: 'user_id,match_id' });

  await invalidateKnockoutPredictions(supabase, user.id, KNOCKOUT_MATCH_IDS);

  revalidatePath('/');
  revalidatePath('/groups');
}

// USER: Randomize Knockout Predictions
export async function randomizeKnockoutPredictions(stage: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { data: matches } = await supabase
    .from('matches')
    .select('*')
    .eq('stage', stage)
    .eq('is_finished', false)
    .eq('is_locked', false);

  const openMatches = (matches ?? []).filter((m) => !isMatchClosedForPredictions(m));
  if (openMatches.length === 0) return;

  const predictions = openMatches.map(match => {
    const scoreA = Math.floor(Math.random() * 4);
    const scoreB = Math.floor(Math.random() * 4);
    let winnerId = null;
    
    // In knockout, draws MUST have a winner
    if (scoreA === scoreB) {
      winnerId = Math.random() > 0.5 ? match.team_a_id : match.team_b_id;
    } else {
      winnerId = scoreA > scoreB ? match.team_a_id : match.team_b_id;
    }

    return {
      user_id: user.id,
      match_id: match.id,
      predicted_a: scoreA,
      predicted_b: scoreB,
      predicted_winner_id: winnerId
    };
  });

  const { error } = await supabase.from('predictions').upsert(predictions, { onConflict: 'user_id,match_id' });
  if (error) throw error;

  revalidatePath('/');
}

// USER: Create Pool
export async function createPool(formData: FormData) {
  const name = (formData.get('name') as string)?.trim();
  if (!name) throw new Error('El nombre de la liga es obligatorio');

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Debes iniciar sesión');

  const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();

  const { data: pool, error: poolError } = await supabase
    .from('pools')
    .insert({ name, creator_id: user.id, invite_code: inviteCode })
    .select()
    .single();

  if (poolError || !pool) {
    throw new Error(poolError?.message ?? 'No se pudo crear la liga');
  }

  const { error: memberError } = await supabase.from('pool_members').insert({
    pool_id: pool.id,
    user_id: user.id,
    role: 'admin',
  });

  if (memberError) {
    await supabase.from('pools').delete().eq('id', pool.id).eq('creator_id', user.id);
    throw new Error(memberError.message);
  }

  revalidatePath('/groups');
  revalidatePath(`/groups/${pool.id}`);
  return pool;
}

// USER: Join Pool
export async function joinPool(formData: FormData) {
  const code = (formData.get('code') as string).toUpperCase();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  const { data: pool } = await supabase.from('pools').select('id').eq('invite_code', code).single();
  if (pool) await supabase.from('pool_members').upsert({ pool_id: pool.id, user_id: user.id });
  revalidatePath('/groups');
}

// USER: Leave Pool
export async function leavePool(poolId: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { error } = await supabase
    .from('pool_members')
    .delete()
    .eq('pool_id', poolId)
    .eq('user_id', user.id);

  if (error) throw error;
  
  revalidatePath('/groups');
  revalidatePath(`/groups/${poolId}`);
}

async function assertCanManagePool(
  supabase: Awaited<ReturnType<typeof createClient>>,
  poolId: number,
  userId: string
) {
  const { data: pool } = await supabase
    .from("pools")
    .select("creator_id")
    .eq("id", poolId)
    .maybeSingle();

  if (pool?.creator_id === userId) return;

  const { data: membership } = await supabase
    .from("pool_members")
    .select("role")
    .eq("pool_id", poolId)
    .eq("user_id", userId)
    .maybeSingle();

  if (!membership || membership.role !== "admin") {
    throw new Error("No tienes permiso para administrar esta liga");
  }
}

// USER: Rename Pool (Creator/Admin)
export async function renamePool(poolId: number, name: string) {
  const next = (name || "").trim();
  if (!next) throw new Error("El nombre de la liga es obligatorio");

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Debes iniciar sesión");

  await assertCanManagePool(supabase, poolId, user.id);

  const { error } = await supabase
    .from("pools")
    .update({ name: next })
    .eq("id", poolId);

  if (error) throw error;

  revalidatePath("/groups");
  revalidatePath(`/groups/${poolId}`);
}

// USER: Kick Pool Member (Creator/Admin)
export async function kickPoolMember(poolId: number, memberUserId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Debes iniciar sesión");

  if (memberUserId === user.id) {
    throw new Error("No puedes expulsarte a ti mismo");
  }

  await assertCanManagePool(supabase, poolId, user.id);

  const { data: pool } = await supabase
    .from("pools")
    .select("creator_id")
    .eq("id", poolId)
    .maybeSingle();

  if (pool?.creator_id && pool.creator_id === memberUserId) {
    throw new Error("No puedes expulsar al creador de la liga");
  }

  // RLS solo permite DELETE de la propia fila; el creador/admin necesita service role o política extra.
  const db = tryCreateServiceRoleClient() ?? supabase;
  const { data: removed, error } = await db
    .from("pool_members")
    .delete()
    .eq("pool_id", poolId)
    .eq("user_id", memberUserId)
    .select("user_id");

  if (error) throw error;
  if (!removed?.length) {
    throw new Error("No se pudo expulsar al usuario de la liga");
  }

  revalidatePath("/groups");
  revalidatePath(`/groups/${poolId}`);
}

// USER: Delete Pool (Only for Creator)
export async function deletePool(poolId: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  // Verificar que sea el creador
  const { data: pool } = await supabase.from('pools').select('creator_id').eq('id', poolId).single();
  
  if (!pool || pool.creator_id !== user.id) {
    throw new Error('No tienes permiso para eliminar esta liga');
  }

  // Eliminar los miembros primero para evitar error de llave foránea
  const { error: membersError } = await supabase
    .from('pool_members')
    .delete()
    .eq('pool_id', poolId);

  if (membersError) throw membersError;

  // Eliminar la liga
  const { error } = await supabase
    .from('pools')
    .delete()
    .eq('id', poolId);

  if (error) throw error;

  revalidatePath('/groups');
  return { success: true };
  }
// USER: Update Profile
export async function updateProfile(formData: FormData) {
  const nickname = (formData.get('nickname') as string)?.trim();
  const favoriteTeamId = formData.get('favorite_team_id') as string;

  if (!nickname) return { error: 'El apodo es obligatorio' };
  
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return { error: 'No autorizado' };

  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('favorite_team_id')
    .eq('id', user.id)
    .maybeSingle();

  const favoriteTeamLocked = await isFavoriteTeamChangeLocked(supabase);
  const existingTeamId = existingProfile?.favorite_team_id ?? null;
  const submittedTeamId = favoriteTeamId ? Number(favoriteTeamId) : null;

  let teamId: number | null;
  if (favoriteTeamLocked) {
    if (
      submittedTeamId != null &&
      existingTeamId != null &&
      submittedTeamId !== existingTeamId
    ) {
      return {
        error:
          'El equipo favorito no se puede cambiar: todos los equipos ya jugaron al menos un partido',
      };
    }
    teamId = existingTeamId;
  } else {
    teamId = submittedTeamId;
  }

  const { error: authError } = await supabase.auth.updateUser({
    data: { nickname },
  });

  if (authError) return { error: 'Error al actualizar metadatos' };

  const profilePayload = {
    nickname,
    favorite_team_id: teamId,
    updated_at: new Date().toISOString(),
  };

  const { data: updatedRows, error: updateError } = await supabase
    .from('profiles')
    .update(profilePayload)
    .eq('id', user.id)
    .select('id');

  if (updateError) {
    console.error('updateProfile:', updateError.message);
    return { error: updateError.message };
  }

  if (!updatedRows?.length) {
    const { error: insertError } = await supabase.from('profiles').insert({
      id: user.id,
      ...profilePayload,
    });
    if (insertError) {
      console.error('updateProfile insert:', insertError.message);
      return { error: insertError.message };
    }
  }

  revalidatePath('/', 'layout');
  revalidatePath('/profile');
  revalidatePath('/ranking');

  return { success: true };
}

// ADMIN Actions (service role tras validar email — ver SUPABASE_SERVICE_ROLE_KEY)

export type AdminMatchActionResult =
  | { ok: true }
  | { ok: false; error: string };

async function getAdminDb() {
  await checkAdmin();
  return createServiceRoleClient();
}

/** Partido iniciado: 0-0, predicciones bloqueadas, puntos en vivo recalculables */
export async function startMatch(
  matchId: number
): Promise<AdminMatchActionResult> {
  try {
    const supabase = await getAdminDb();
    const result = await startMatchSync(supabase, matchId);
    if (!result.ok) return result;
    revalidateAfterMatchUpdate();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Error al iniciar' };
  }
}

/** Actualiza marcador en vivo y reparte puntos provisionalmente */
export async function updateLiveScore(
  matchId: number,
  resultA: number,
  resultB: number,
  winnerId: number | null = null
): Promise<AdminMatchActionResult> {
  try {
    const supabase = await getAdminDb();
    const result = await updateLiveScoreSync(
      supabase,
      matchId,
      resultA,
      resultB,
      winnerId
    );
    if (!result.ok) return result;
    revalidateAfterMatchUpdate();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Error al actualizar' };
  }
}

export async function finalizeMatch(
  matchId: number,
  resultA: number,
  resultB: number,
  winnerId: number | null = null
): Promise<AdminMatchActionResult> {
  try {
    const supabase = await getAdminDb();
    const existing = await loadMatchRow(supabase, matchId);
    const resolvedWinner = resolveKnockoutWinnerId(
      existing,
      resultA,
      resultB,
      winnerId
    );

    if (existing.stage !== 'group' && resultA === resultB && !resolvedWinner) {
      return {
        ok: false,
        error: 'En eliminatorias con empate debes indicar quién pasa de ronda',
      };
    }

    const result = await finalizeMatchSync(
      supabase,
      matchId,
      resultA,
      resultB,
      winnerId
    );
    if (!result.ok) return result;
    revalidateAfterMatchUpdate();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Error al finalizar' };
  }
}

export async function resetMatch(
  matchId: number
): Promise<AdminMatchActionResult> {
  try {
    const supabase = await getAdminDb();

    const { error: matchError } = await supabase
      .from('matches')
      .update({
        result_a: null,
        result_b: null,
        winner_id: null,
        is_locked: false,
        is_finished: false,
      })
      .eq('id', matchId);

    if (matchError) return { ok: false, error: matchError.message };

    const { error: predError } = await supabase
      .from('predictions')
      .update({ points_won: null })
      .eq('match_id', matchId);

    if (predError) return { ok: false, error: predError.message };

    revalidateAfterMatchUpdate();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Error al reiniciar' };
  }
}

export type AdminResetPhaseParams =
  | { section: 'groups'; groupId: string }
  | { section: 'knockout'; stage: string };

export type AdminResetPhaseResult =
  | { ok: true; reset: number }
  | { ok: false; error: string };

const TOURNAMENT_LIVE_GUARD =
  'Deshabilitado: el mundial ya está en curso. Solo se permiten marcadores partido a partido.';

async function assertTournamentTestActionsAllowed(
  supabase: Awaited<ReturnType<typeof getAdminDb>>
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (await isTournamentStarted(supabase)) {
    return { ok: false, error: TOURNAMENT_LIVE_GUARD };
  }
  return { ok: true };
}

/** Borra marcadores y puntos de todos los partidos de la fase (solo admin / pruebas). */
export async function resetPhaseResults(
  params: AdminResetPhaseParams
): Promise<AdminResetPhaseResult> {
  try {
    const supabase = await getAdminDb();
    const guard = await assertTournamentTestActionsAllowed(supabase);
    if (!guard.ok) return guard;

    let query = supabase.from('matches').select('id');

    if (params.section === 'groups') {
      query = query.eq('stage', 'group').eq('group_id', params.groupId);
    } else {
      query = query.eq('stage', params.stage);
    }

    const { data: rows, error: fetchError } = await query;
    if (fetchError) return { ok: false, error: fetchError.message };

    const ids = (rows ?? []).map((r) => r.id as number);
    if (ids.length === 0) return { ok: true, reset: 0 };

    const { error: matchError } = await supabase
      .from('matches')
      .update({
        result_a: null,
        result_b: null,
        winner_id: null,
        is_locked: false,
        is_finished: false,
      })
      .in('id', ids);

    if (matchError) return { ok: false, error: matchError.message };

    const { error: predError } = await supabase
      .from('predictions')
      .update({ points_won: null })
      .in('match_id', ids);

    if (predError) return { ok: false, error: predError.message };

    revalidateAfterMatchUpdate();
    return { ok: true, reset: ids.length };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : 'Error al reiniciar la fase',
    };
  }
}

export type AdminRandomizePhaseParams =
  | { section: 'groups' }
  | { section: 'knockout'; stage: string };

export type AdminRandomizePhaseResult =
  | { ok: true; finalized: number; skipped: number }
  | { ok: false; error: string };

/** Finaliza todos los partidos pendientes de una fase con marcadores aleatorios (solo pruebas). */
export async function randomizePhaseResults(
  params: AdminRandomizePhaseParams
): Promise<AdminRandomizePhaseResult> {
  try {
    const supabase = await getAdminDb();
    const guard = await assertTournamentTestActionsAllowed(supabase);
    if (!guard.ok) return guard;

    let query = supabase
      .from('matches')
      .select('*')
      .eq('is_finished', false);

    if (params.section === 'groups') {
      query = query.eq('stage', 'group');
    } else {
      query = query.eq('stage', params.stage);
    }

    const { data: matches, error: fetchError } = await query;
    if (fetchError) return { ok: false, error: fetchError.message };
    if (!matches?.length) {
      return { ok: true, finalized: 0, skipped: 0 };
    }

    let finalized = 0;
    let skipped = 0;

    for (const row of matches) {
      const match = row as Match;
      if (!match.team_a_id || !match.team_b_id) {
        skipped += 1;
        continue;
      }

      const { resultA, resultB, winnerId } = randomResultForMatch(match);
      const resolvedWinner = resolveKnockoutWinnerId(
        match,
        resultA,
        resultB,
        winnerId
      );

      if (match.stage !== 'group' && resultA === resultB && !resolvedWinner) {
        skipped += 1;
        continue;
      }

      const { data: updated, error: updateError } = await supabase
        .from('matches')
        .update({
          result_a: resultA,
          result_b: resultB,
          winner_id: resolvedWinner,
          is_locked: true,
          is_finished: true,
        })
        .eq('id', match.id)
        .select()
        .single();

      if (updateError) {
        return { ok: false, error: updateError.message };
      }

      if (updated) {
        await updatePredictionsPoints(supabase, match.id, updated as Match);
      }
      finalized += 1;
    }

    revalidateAfterMatchUpdate();
    return { ok: true, finalized, skipped };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : 'Error al generar resultados',
    };
  }
}

/** Recalcula points_won de todas las predicciones con las reglas actuales */
export async function recalculateAllPoints(): Promise<
  | { ok: true; matches: number; predictions: number }
  | { ok: false; error: string }
> {
  try {
    const supabase = await getAdminDb();
    const { matches, predictions } =
      await recalculateAllFinishedMatchPoints(supabase);
    revalidateAfterMatchUpdate();
    return { ok: true, matches, predictions };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Error al recalcular puntos",
    };
  }
}

export type AdminSideAlignmentAuditResult =
  | { ok: true; rows: InvertedMatchAuditRow[] }
  | { ok: false; error: string };

export async function fetchInvertedFutureGroupMatchesAudit(): Promise<AdminSideAlignmentAuditResult> {
  try {
    const supabase = await getAdminDb();
    const rows = await auditInvertedFutureGroupMatches(supabase);
    return { ok: true, rows };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Error al auditar alineación",
    };
  }
}

export type AdminSwapSidesResult =
  | { ok: true; swapped: number; errors: string[] }
  | { ok: false; error: string };

export async function swapMatchSidesAdmin(
  matchId: number
): Promise<AdminMatchActionResult> {
  try {
    const supabase = await getAdminDb();
    const result = await swapMatchSidesSync(supabase, matchId);
    if (!result.ok) return result;
    revalidateAfterMatchUpdate();
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Error al invertir lados",
    };
  }
}

export async function swapAllInvertedFutureGroupMatches(): Promise<AdminSwapSidesResult> {
  try {
    const supabase = await getAdminDb();
    const rows = await auditInvertedFutureGroupMatches(supabase);
    const errors: string[] = [];
    let swapped = 0;

    for (const row of rows) {
      const result = await swapMatchSidesSync(supabase, row.matchId);
      if (!result.ok) {
        errors.push(`Partido ${row.matchId}: ${result.error}`);
      } else {
        swapped += 1;
      }
    }

    if (swapped > 0) {
      revalidateAfterMatchUpdate();
    }

    return { ok: true, swapped, errors };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Error al invertir partidos",
    };
  }
}
