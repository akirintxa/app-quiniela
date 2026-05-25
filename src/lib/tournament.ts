import type { SupabaseClient } from "@supabase/supabase-js";

/** Hay al menos un partido con resultado oficial → torneo iniciado (bloquea cambio de favorito). */
export async function isTournamentStarted(
  supabase: SupabaseClient
): Promise<boolean> {
  const { count, error } = await supabase
    .from("matches")
    .select("id", { count: "exact", head: true })
    .or("is_finished.eq.true,result_a.not.is.null");

  if (error) {
    console.error("isTournamentStarted:", error.message);
    return false;
  }
  return (count ?? 0) > 0;
}

