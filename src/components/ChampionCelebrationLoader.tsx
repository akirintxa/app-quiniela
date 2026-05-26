import { createClient } from "@/utils/supabase/server";
import ChampionCelebration from "./ChampionCelebration";
import { loadFavoriteBonusContext } from "@/lib/favorite-bonus-server";
import {
  favoriteTeamIsWorldCupChampion,
  isWorldCupTournamentComplete,
} from "@/lib/favorite-bonus";
import { fetchProfileFields, getFavoriteTeamFlagUrl } from "@/lib/profile";

export default async function ChampionCelebrationLoader() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const profile = await fetchProfileFields(supabase, user.id);
  if (!profile?.favorite_team_id || !profile.favoriteTeam) return null;

  const ctx = await loadFavoriteBonusContext(supabase);
  if (!isWorldCupTournamentComplete(ctx.knockoutMatches)) return null;
  if (
    !favoriteTeamIsWorldCupChampion(profile.favorite_team_id, {
      groupMatches: ctx.groupMatches,
      knockoutMatches: ctx.knockoutMatches,
      allTeams: ctx.allTeams,
    })
  ) {
    return null;
  }

  const flagUrl = getFavoriteTeamFlagUrl(profile.favoriteTeam, 80);

  return (
    <ChampionCelebration
      userId={user.id}
      teamName={profile.favoriteTeam.name}
      flagUrl={flagUrl}
    />
  );
}
