'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/utils/supabase/server';
import { calculatePoints } from '@/lib/points';
import { isTournamentStarted } from '@/lib/tournament';
import { KNOCKOUT_MATCH_IDS } from '@/lib/bracket-fixtures';
import {
  getMatchIdsToInvalidateOnGroupChange,
  getMatchIdsToInvalidateOnKnockoutChange,
} from '@/lib/knockout-invalidation';
import { Match, Prediction } from '@/types';
import { GroupId } from '@/types/knockout';

// Helper to check admin permission
async function checkAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  // Convertimos el string de env var en un array de correos limpios
  const adminEmails = process.env.ADMIN_EMAIL?.split(',').map(e => e.trim()) || [];
  
  if (!user || !user.email || !adminEmails.includes(user.email)) {
    throw new Error('Unauthorized');
  }
  return supabase;
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
  
  if (match.is_finished || (match.is_locked && new Date() > new Date(match.start_time))) {
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
    if (match.is_finished || (match.is_locked && new Date() > new Date(match.start_time))) {
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

  if (!matches || matches.length === 0) return;

  await supabase
    .from('predictions')
    .upsert(buildRandomPredictions(user.id, matches), { onConflict: 'user_id,match_id' });

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

  if (!matches || matches.length === 0) return;

  await supabase
    .from('predictions')
    .upsert(buildRandomPredictions(user.id, matches), { onConflict: 'user_id,match_id' });

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

  if (!matches || matches.length === 0) return;

  const predictions = matches.map(match => {
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

  const tournamentStarted = await isTournamentStarted(supabase);
  if (tournamentStarted) {
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('favorite_team_id')
      .eq('id', user.id)
      .single();
    const newTeamId = favoriteTeamId ? Number(favoriteTeamId) : null;
    if (
      existingProfile?.favorite_team_id != null &&
      existingProfile.favorite_team_id !== newTeamId
    ) {
      return {
        error:
          'El equipo favorito no se puede cambiar: el torneo ya tiene resultados oficiales',
      };
    }
  }

  const { error: authError } = await supabase.auth.updateUser({
    data: { nickname },
  });

  if (authError) return { error: 'Error al actualizar metadatos' };

  const teamId = favoriteTeamId ? Number(favoriteTeamId) : null;
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

// ADMIN Actions
async function updatePredictionsPoints(supabase: any, matchId: number, matchData: any) {
  const { data: predictions, error: fetchError } = await supabase.from('predictions').select('*').eq('match_id', matchId);
  
  if (fetchError) {
    console.error("Error fetching predictions for points update:", fetchError);
    return;
  }

  if (predictions && predictions.length > 0) {
    const updates = predictions.map((pred: any) => ({
      id: pred.id, 
      user_id: pred.user_id, 
      match_id: pred.match_id,
      points_won: calculatePoints(pred, matchData as Match)
    }));

    const { error: upsertError } = await supabase.from('predictions').upsert(updates);
    if (upsertError) {
      console.error("Error upserting points_won:", upsertError);
      throw new Error("No se pudieron repartir los puntos. Verifica los permisos RLS.");
    }
  }
}

export async function updateLiveScore(matchId: number, resultA: number, resultB: number, winnerId: number | null = null) {
  const supabase = await checkAdmin();
  const { data: match, error } = await supabase
    .from('matches')
    .update({ result_a: resultA, result_b: resultB, winner_id: winnerId, is_locked: true })
    .eq('id', matchId)
    .select()
    .single();

  if (error) throw error;

  if (match) {
    await updatePredictionsPoints(supabase, matchId, match);
  }

  revalidatePath('/'); 
  revalidatePath('/admin');
  revalidatePath('/ranking');
}

export async function finalizeMatch(matchId: number, resultA: number, resultB: number, winnerId: number | null = null) {
  const supabase = await checkAdmin();
  const { data: match, error } = await supabase
    .from('matches')
    .update({ result_a: resultA, result_b: resultB, winner_id: winnerId, is_locked: true, is_finished: true })
    .eq('id', matchId)
    .select()
    .single();

  if (error) throw error;

  if (match) {
    await updatePredictionsPoints(supabase, matchId, match);
  }

  revalidatePath('/'); 
  revalidatePath('/ranking'); 
  revalidatePath('/admin'); 
  revalidatePath('/groups');
}

export async function resetMatch(matchId: number) {
  const supabase = await checkAdmin();
  // 1. Resetear el partido a su estado inicial
  const { error: matchError } = await supabase.from('matches').update({ 
    result_a: null, 
    result_b: null, 
    winner_id: null,
    is_locked: false, 
    is_finished: false 
  }).eq('id', matchId);

  if (matchError) throw matchError;

  // 2. Limpiar los puntos de todas las predicciones de este partido
  const { error: predError } = await supabase.from('predictions').update({ points_won: null }).eq('match_id', matchId);
  
  if (predError) throw predError;

  // 3. Revalidar todas las rutas posibles para que el cambio sea instantáneo
  revalidatePath('/'); 
  revalidatePath('/ranking'); 
  revalidatePath('/admin'); 
  revalidatePath('/groups');
  revalidatePath('/groups/[id]', 'page');
}

export async function toggleMatchLock(matchId: number, isLocked: boolean) {
  const supabase = await checkAdmin();
  const { error } = await supabase.from('matches').update({ is_locked: isLocked }).eq('id', matchId);
  if (error) throw error;
  revalidatePath('/'); revalidatePath('/admin');
}
