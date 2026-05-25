import { createClient } from "@/utils/supabase/server";
import { createServiceRoleClient } from "@/utils/supabase/admin";
import { Prediction } from "@/types";

export async function assertPoolMember(poolId: string, userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("pool_members")
    .select("user_id")
    .eq("pool_id", poolId)
    .eq("user_id", userId)
    .maybeSingle();

  if (!data) throw new Error("No eres miembro de esta liga");
}

export async function getPoolMemberIds(poolId: string): Promise<string[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("pool_members")
    .select("user_id")
    .eq("pool_id", poolId);
  return data?.map((m) => m.user_id) ?? [];
}

/** Lee predicciones de todos los miembros de una liga (bypass RLS tras validar membresía). */
export async function fetchPoolMemberPredictions(
  poolId: string,
  callerUserId: string,
  memberIds?: string[]
): Promise<Prediction[]> {
  await assertPoolMember(poolId, callerUserId);

  const ids = memberIds ?? (await getPoolMemberIds(poolId));
  if (ids.length === 0) return [];

  const admin = createServiceRoleClient();
  const { data, error } = await admin
    .from("predictions")
    .select("*")
    .in("user_id", ids);

  if (error) throw error;
  return (data ?? []) as Prediction[];
}

export type PoolMatchPredictionRow = {
  user_id: string;
  nickname: string;
  predicted_a: number | null;
  predicted_b: number | null;
  points_won: number | null;
  phaseComplete: boolean;
};

export async function fetchPoolMatchPredictionsForMembers(
  poolId: string,
  callerUserId: string,
  matchId: number,
  memberProfiles: { id: string; nickname: string }[],
  phaseCompleteByUser: Record<string, boolean>
): Promise<PoolMatchPredictionRow[]> {
  await assertPoolMember(poolId, callerUserId);

  const memberIds = memberProfiles.map((m) => m.id);
  if (memberIds.length === 0) return [];

  const admin = createServiceRoleClient();
  const { data: preds, error } = await admin
    .from("predictions")
    .select("predicted_a, predicted_b, points_won, user_id")
    .eq("match_id", matchId)
    .in("user_id", memberIds);

  if (error) throw error;

  const predByUser = new Map(
    (preds ?? []).map((p) => [p.user_id, p])
  );

  return memberProfiles
    .map((member) => {
      const p = predByUser.get(member.id);
      return {
        user_id: member.id,
        nickname: member.nickname,
        predicted_a: p?.predicted_a ?? null,
        predicted_b: p?.predicted_b ?? null,
        points_won: p?.points_won ?? null,
        phaseComplete: phaseCompleteByUser[member.id] ?? false,
      };
    })
    .sort((a, b) => {
      const aHas = a.predicted_a != null && a.predicted_b != null;
      const bHas = b.predicted_a != null && b.predicted_b != null;
      if (aHas !== bHas) return aHas ? -1 : 1;
      if ((b.points_won ?? 0) !== (a.points_won ?? 0)) {
        return (b.points_won ?? 0) - (a.points_won ?? 0);
      }
      return a.nickname.localeCompare(b.nickname);
    });
}
