import { NextRequest, NextResponse } from "next/server";
import { syncFifaMatches } from "@/lib/fifa-sync";
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

  const force = request.nextUrl.searchParams.get("force") === "1";
  const result = await syncFifaMatches({ force });

  if (result.updated > 0) {
    revalidateAfterMatchUpdate();
  }

  const status = result.ok ? 200 : result.skipped ? 200 : 500;
  return NextResponse.json(result, { status });
}
