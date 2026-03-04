'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/utils/supabase/server';
import { calculatePoints } from '@/lib/points';
import { Match, Prediction } from '@/types';

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

// USER: Save a prediction
export async function savePrediction(matchId: number, scoreA: number, scoreB: number, winnerId?: number | null) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Debes iniciar sesión');

  const { data: match } = await supabase.from('matches').select('is_locked, is_finished, start_time, team_a_id, team_b_id').eq('id', matchId).single();
  if (!match) throw new Error('Partido no encontrado');
  
  if (match.is_finished || (match.is_locked && new Date() > new Date(match.start_time))) {
    throw new Error('Cerrado');
  }

  const { data, error } = await supabase
    .from('predictions')
    .upsert({
      user_id: user.id,
      match_id: matchId,
      predicted_a: scoreA,
      predicted_b: scoreB,
      predicted_winner_id: winnerId || (scoreA > scoreB ? match.team_a_id : match.team_b_id)
    }, { onConflict: 'user_id,match_id' })
    .select();

  if (error) throw error;
  revalidatePath('/');
  revalidatePath('/groups');
  return data;
}

// USER: Randomize Group Predictions
export async function randomizeGroupPredictions(groupId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { data: matches } = await supabase
    .from('matches')
    .select('*')
    .eq('group_id', groupId)
    .eq('is_finished', false)
    .eq('is_locked', false);

  if (!matches || matches.length === 0) return;

  const predictions = matches.map(match => {
    const scoreA = Math.floor(Math.random() * 4);
    const scoreB = Math.floor(Math.random() * 4);
    let winnerId = null;
    if (match.stage !== 'group' && scoreA === scoreB) {
      winnerId = Math.random() > 0.5 ? match.team_a_id : match.team_b_id;
    } else {
      winnerId = scoreA > scoreB ? match.team_a_id : (scoreB > scoreA ? match.team_b_id : null);
    }
    return {
      user_id: user.id,
      match_id: match.id,
      predicted_a: scoreA,
      predicted_b: scoreB,
      predicted_winner_id: winnerId
    };
  });

  await supabase.from('predictions').upsert(predictions, { onConflict: 'user_id,match_id' });
  revalidatePath('/');
  revalidatePath('/groups');
}

// USER: Create Pool
export async function createPool(formData: FormData) {
  const name = formData.get('name') as string;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
  const { data: pool } = await supabase.from('pools').insert({ name, creator_id: user.id, invite_code: inviteCode }).select().single();
  if (pool) await supabase.from('pool_members').insert({ pool_id: pool.id, user_id: user.id, role: 'admin' });
  revalidatePath('/groups');
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

// USER: Update Profile
export async function updateProfile(formData: FormData) {
  const nickname = formData.get('nickname') as string;
  const avatarUrl = formData.get('avatar_url') as string;
  const favoriteTeamId = formData.get('favorite_team_id') as string;

  if (!nickname) return { error: 'El apodo es obligatorio' };
  
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return { error: 'No autorizado' };

  // 1. Update Auth Metadata
  const { error: authError } = await supabase.auth.updateUser({ 
    data: { 
      nickname: nickname,
      avatar_url: avatarUrl
    } 
  });
  
  if (authError) return { error: 'Error al actualizar metadatos' };

  // 2. Update Public Profiles Table
  const { error: profileError } = await supabase
    .from('profiles')
    .upsert({ 
      id: user.id, 
      nickname: nickname,
      avatar_url: avatarUrl,
      favorite_team_id: favoriteTeamId ? Number(favoriteTeamId) : null
    });

  if (profileError) return { error: 'Error al actualizar perfil público' };

  revalidatePath('/');
  revalidatePath('/profile');
  revalidatePath('/ranking');
  
  return { success: true };
}

// ADMIN Actions
async function updatePredictionsPoints(supabase: any, matchId: number, matchData: any) {
  const { data: predictions } = await supabase.from('predictions').select('*').eq('match_id', matchId);
  if (predictions && predictions.length > 0) {
    const updates = predictions.map((pred: any) => ({
      id: pred.id, 
      user_id: pred.user_id, 
      match_id: pred.match_id,
      points_won: calculatePoints(pred, matchData as Match)
    }));
    await supabase.from('predictions').upsert(updates);
  }
}

export async function updateLiveScore(matchId: number, resultA: number, resultB: number) {
  const supabase = await checkAdmin();
  const { data: match } = await supabase
    .from('matches')
    .update({ result_a: resultA, result_b: resultB, is_locked: true })
    .eq('id', matchId)
    .select()
    .single();

  if (match) {
    await updatePredictionsPoints(supabase, matchId, match);
  }

  revalidatePath('/'); 
  revalidatePath('/admin');
  revalidatePath('/ranking');
}

export async function finalizeMatch(matchId: number, resultA: number, resultB: number) {
  const supabase = await checkAdmin();
  const { data: match } = await supabase
    .from('matches')
    .update({ result_a: resultA, result_b: resultB, is_locked: true, is_finished: true })
    .eq('id', matchId)
    .select()
    .single();

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
  await supabase.from('matches').update({ result_a: null, result_b: null, is_locked: false, is_finished: false }).eq('id', matchId);
  await supabase.from('predictions').update({ points_won: null }).eq('match_id', matchId);
  revalidatePath('/'); revalidatePath('/ranking'); revalidatePath('/admin'); revalidatePath('/groups');
}

export async function toggleMatchLock(matchId: number, isLocked: boolean) {
  const supabase = await checkAdmin();
  await supabase.from('matches').update({ is_locked: isLocked }).eq('id', matchId);
  revalidatePath('/'); revalidatePath('/admin');
}
