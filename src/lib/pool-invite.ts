import type { SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { getJoinUrl, normalizeInviteCode } from "@/lib/join-url";

export { getJoinUrl, normalizeInviteCode };

export const PENDING_POOL_INVITE_COOKIE = "pending_pool_invite";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export type JoinPoolResult =
  | { ok: true; poolId: number; alreadyMember: boolean }
  | { ok: false; error: "invalid_code" | "join_failed" | "not_authenticated" };

export type PoolInvitePreview = {
  id: number;
  name: string;
  invite_code: string;
};

export async function setPendingPoolInviteCookie(code: string) {
  const jar = await cookies();
  const isProd = process.env.NODE_ENV === "production";
  jar.set(PENDING_POOL_INVITE_COOKIE, normalizeInviteCode(code), {
    httpOnly: true,
    sameSite: "lax",
    secure: isProd,
    maxAge: COOKIE_MAX_AGE,
    path: "/",
  });
}

export async function getPendingPoolInviteCode(): Promise<string | null> {
  const jar = await cookies();
  const value = jar.get(PENDING_POOL_INVITE_COOKIE)?.value;
  return value ? normalizeInviteCode(value) : null;
}

export async function clearPendingPoolInviteCookie() {
  const jar = await cookies();
  jar.delete(PENDING_POOL_INVITE_COOKIE);
}

export async function findPoolByInviteCode(
  supabase: SupabaseClient,
  rawCode: string
): Promise<PoolInvitePreview | null> {
  const code = normalizeInviteCode(rawCode);
  if (!code) return null;

  const { data, error } = await supabase
    .from("pools")
    .select("id, name, invite_code")
    .eq("invite_code", code)
    .maybeSingle();

  if (error || !data) return null;
  return data as PoolInvitePreview;
}

export async function joinPoolByInviteCode(
  supabase: SupabaseClient,
  userId: string,
  rawCode: string
): Promise<JoinPoolResult> {
  const pool = await findPoolByInviteCode(supabase, rawCode);
  if (!pool) return { ok: false, error: "invalid_code" };

  const { data: existingMember } = await supabase
    .from("pool_members")
    .select("pool_id")
    .eq("pool_id", pool.id)
    .eq("user_id", userId)
    .maybeSingle();

  if (existingMember) {
    return { ok: true, poolId: pool.id, alreadyMember: true };
  }

  const { error: joinError } = await supabase.from("pool_members").upsert({
    pool_id: pool.id,
    user_id: userId,
  });

  if (joinError) {
    console.error("joinPoolByInviteCode:", joinError.message);
    return { ok: false, error: "join_failed" };
  }

  return { ok: true, poolId: pool.id, alreadyMember: false };
}

/** Lee cookie pendiente, une al usuario y limpia la cookie. */
export async function consumePendingPoolInvite(
  supabase: SupabaseClient,
  userId: string
): Promise<JoinPoolResult | null> {
  const code = await getPendingPoolInviteCode();
  if (!code) return null;

  const result = await joinPoolByInviteCode(supabase, userId, code);
  await clearPendingPoolInviteCookie();
  return result;
}

export function joinResultRedirectPath(result: JoinPoolResult): string {
  if (!result.ok) {
    if (result.error === "invalid_code") return "/groups?error=invalid_code";
    if (result.error === "join_failed") return "/groups?error=join_failed";
    return "/login";
  }
  if (result.alreadyMember) {
    return `/groups/${result.poolId}?error=already_member`;
  }
  return `/groups/${result.poolId}?message=joined`;
}
