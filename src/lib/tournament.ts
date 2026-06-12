import type { SupabaseClient } from "@supabase/supabase-js";

/** Hay al menos un partido con resultado oficial. */
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

/**
 * Bloquea cambio de equipo favorito cuando cada selección de fase de grupos
 * ya disputó al menos un partido con resultado oficial.
 */
export async function isFavoriteTeamChangeLocked(
  supabase: SupabaseClient
): Promise<boolean> {
  const { data: groupMatches, error: groupError } = await supabase
    .from("matches")
    .select("team_a_id, team_b_id")
    .eq("stage", "group");

  if (groupError) {
    console.error("isFavoriteTeamChangeLocked group:", groupError.message);
    return false;
  }

  const allTeams = new Set<number>();
  for (const m of groupMatches ?? []) {
    if (m.team_a_id != null) allTeams.add(m.team_a_id);
    if (m.team_b_id != null) allTeams.add(m.team_b_id);
  }

  if (allTeams.size === 0) return false;

  const { data: playedMatches, error: playedError } = await supabase
    .from("matches")
    .select("team_a_id, team_b_id")
    .or("is_finished.eq.true,result_a.not.is.null");

  if (playedError) {
    console.error("isFavoriteTeamChangeLocked played:", playedError.message);
    return false;
  }

  const teamsWithResult = new Set<number>();
  for (const m of playedMatches ?? []) {
    if (m.team_a_id != null) teamsWithResult.add(m.team_a_id);
    if (m.team_b_id != null) teamsWithResult.add(m.team_b_id);
  }

  for (const teamId of allTeams) {
    if (!teamsWithResult.has(teamId)) return false;
  }

  return true;
}
