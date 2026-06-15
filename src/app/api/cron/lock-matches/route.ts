import { NextRequest, NextResponse } from "next/server";
import { runScheduledMatchLocksSync } from "@/lib/match-sync";
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

  const supabase = createServiceRoleClient();
  const result = await runScheduledMatchLocksSync(supabase);

  if (result.locked > 0 || result.started > 0) {
    revalidateAfterMatchUpdate();
  }

  const status = result.ok ? 200 : 500;
  return NextResponse.json(result, { status });
}
