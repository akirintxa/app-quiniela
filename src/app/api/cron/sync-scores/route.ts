import { NextRequest, NextResponse } from "next/server";
import { runExternalScoreSync } from "@/lib/score-sync";
import { createServiceRoleClient } from "@/utils/supabase/admin";
import { revalidateAfterMatchUpdate } from "@/lib/revalidate-app";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;

  const authHeader = request.headers.get("authorization");
  return authHeader === `Bearer ${secret}`;
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = createServiceRoleClient();
    const result = await runExternalScoreSync(supabase);

    if (
      result.started > 0 ||
      result.updated > 0 ||
      result.finalized > 0
    ) {
      revalidateAfterMatchUpdate();
    }

    const status = result.ok ? 200 : 500;
    return NextResponse.json(result, { status });
  } catch (e) {
    return NextResponse.json(
      {
        ok: false,
        error: e instanceof Error ? e.message : "Error al sincronizar marcadores",
      },
      { status: 500 }
    );
  }
}
