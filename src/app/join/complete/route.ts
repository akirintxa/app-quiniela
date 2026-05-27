import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import {
  consumePendingPoolInvite,
  joinResultRedirectPath,
} from "@/lib/pool-invite";

/** Tras login o confirmación de email: procesa invitación pendiente en cookie. */
export async function GET(request: Request) {
  const origin = new URL(request.url).origin;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(`${origin}/login?next=/join/complete`);
  }

  const result = await consumePendingPoolInvite(supabase, user.id);

  if (!result) {
    return NextResponse.redirect(`${origin}/`);
  }

  revalidatePath("/groups");
  if (result.ok) {
    revalidatePath(`/groups/${result.poolId}`);
  }

  return NextResponse.redirect(`${origin}${joinResultRedirectPath(result)}`);
}
