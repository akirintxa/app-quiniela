import type { SupabaseClient } from "@supabase/supabase-js";
import { MATCH_TIMEZONE } from "@/lib/match-datetime";
import { isAutoScoreSyncEnabled } from "@/lib/score-sync";

export type MatchSyncStatus = {
  lastSyncedAt: string | null;
  autoSyncEnabled: boolean;
  formattedAt: string | null;
  relativeLabel: string | null;
};

function formatRelativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  if (diffMs < 0) return "ahora mismo";

  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return "ahora mismo";
  if (diffMin < 60) return `hace ${diffMin} min`;

  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `hace ${diffH} h`;

  const diffD = Math.floor(diffH / 24);
  return `hace ${diffD} d`;
}

function formatAbsoluteTime(iso: string): string {
  return new Date(iso).toLocaleString("es-VE", {
    timeZone: MATCH_TIMEZONE,
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export async function getMatchSyncStatus(
  supabase: SupabaseClient
): Promise<MatchSyncStatus> {
  const autoSyncEnabled = isAutoScoreSyncEnabled();

  const { data } = await supabase
    .from("matches")
    .select("last_synced_at")
    .not("last_synced_at", "is", null)
    .order("last_synced_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const lastSyncedAt = data?.last_synced_at ?? null;

  return {
    lastSyncedAt,
    autoSyncEnabled,
    formattedAt: lastSyncedAt ? formatAbsoluteTime(lastSyncedAt) : null,
    relativeLabel: lastSyncedAt ? formatRelativeTime(lastSyncedAt) : null,
  };
}
