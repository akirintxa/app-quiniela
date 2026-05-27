import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import {
  consumePendingPoolInvite,
  getPendingPoolInviteCode,
  joinResultRedirectPath,
} from "@/lib/pool-invite";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  let next = requestUrl.searchParams.get("next") ?? "/";
  const origin = requestUrl.origin;

  if (!code) {
    return NextResponse.redirect(`${origin}/login?message=Could not login with email link`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(`${origin}/login?message=Could not login with email link`);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const pendingCode = await getPendingPoolInviteCode();
    if (pendingCode) {
      const result = await consumePendingPoolInvite(supabase, user.id);
      if (result) {
        revalidatePath("/groups");
        if (result.ok) revalidatePath(`/groups/${result.poolId}`);
        return NextResponse.redirect(`${origin}${joinResultRedirectPath(result)}`);
      }
    }

    if (next === "/join/complete") {
      return NextResponse.redirect(`${origin}/join/complete`);
    }
  }

  if (!next.startsWith("/")) {
    next = "/";
  }

  return NextResponse.redirect(`${origin}${next}`);
}
