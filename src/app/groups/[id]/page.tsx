import { createClient } from "@/utils/supabase/server";
import { Match, Prediction, Team } from "@/types";
import MatchCard from "@/components/MatchCard";
import MatchHistoryList from "@/components/MatchHistoryList";
import MemberBadge from "@/components/MemberBadge";
import ScoringRulesButton from "@/components/ScoringRulesButton";
import RealtimeRankingListener from "@/components/RealtimeRankingListener";
import CopyInviteCode from "@/components/CopyInviteCode";
import ShareLeagueQR from "@/components/ShareLeagueQR";
import LeaveGroupButton from "@/components/LeaveGroupButton";
import DeletePoolButton from "@/components/DeletePoolButton";
import LeagueAdminPanel from "@/components/LeagueAdminPanel";
import {
  buildKnockoutHistoryLabels,
  buildMatchHistoryRows,
  type MatchHistoryRow,
} from "@/lib/match-history";
import { resolveKnockoutTeamsForLeague } from "@/lib/knockout-ui";
import { getFavoriteTeamFlagUrl, loadFavoriteTeamsByIds } from "@/lib/profile";
import { getTotalPointsWithFavoriteBonus } from "@/lib/favorite-bonus";
import {
  buildPlayerStandings,
  sortStandingsByTotal,
  getCompetitionRankAtIndex,
} from "@/lib/global-ranking";
import { fetchPoolMemberPredictions } from "@/lib/pool-predictions-server";
import {
  buildPhaseCompletionByUser,
  getPhaseMatchIds,
  type PhaseContext,
} from "@/lib/phase-completion";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

function poolHref(poolId: string, params?: { view_user?: string }) {
  if (!params?.view_user) return `/groups/${poolId}`;
  return `/groups/${poolId}?view_user=${params.view_user}`;
}

export default async function GroupDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ view_user?: string; message?: string }>;
}) {
  const supabase = await createClient();
  const { id: poolId } = await params;
  const resolvedSearchParams = await searchParams;
  const viewUserId = resolvedSearchParams.view_user;
  const joinedMessage = resolvedSearchParams.message === "joined";

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: pool, error: poolError } = await supabase
    .from("pools")
    .select("*")
    .eq("id", poolId)
    .single();
  if (poolError || !pool) notFound();

  const { data: membership } = await supabase
    .from("pool_members")
    .select("*")
    .eq("pool_id", poolId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!membership) redirect("/groups?error=not-a-member");

  const isCreator = pool.creator_id === user.id;
  const isAdmin = isCreator || membership.role === "admin";

  const { data: membersData } = await supabase
    .from("pool_members")
    .select("user_id")
    .eq("pool_id", poolId);
  const memberIds = membersData?.map((m) => m.user_id) || [];

  const { data: profilesData } =
    memberIds.length > 0
      ? await supabase
          .from("profiles")
          .select("id, nickname, favorite_team_id")
          .in("id", memberIds)
      : { data: [] as { id: string; nickname: string | null; favorite_team_id: number | null }[] };

  const profileById = new Map(
    (profilesData ?? []).map((p) => [p.id, p])
  );

  const favoriteTeamIds =
    (profilesData ?? [])
      .map((p) => p.favorite_team_id)
      .filter((id): id is number => id != null) || [];
  const teamsById = await loadFavoriteTeamsByIds(supabase, favoriteTeamIds);

  let poolPredictions: Prediction[] = [];
  try {
    poolPredictions = await fetchPoolMemberPredictions(
      poolId,
      user.id,
      memberIds
    );
  } catch (err) {
    console.error("fetchPoolMemberPredictions:", err);
    const { data: ownPreds } = await supabase
      .from("predictions")
      .select("*")
      .eq("user_id", user.id);
    poolPredictions = (ownPreds ?? []) as Prediction[];
  }

  const profileRows = memberIds.map((id) => ({
    id,
    favorite_team_id: profileById.get(id)?.favorite_team_id ?? null,
  }));

  const standings = sortStandingsByTotal(
    await buildPlayerStandings(
      supabase,
      profileRows,
      poolPredictions.map((p) => ({
        user_id: p.user_id,
        points_won: p.points_won,
      }))
    )
  );

  const { data: finishedMatches } = await supabase
    .from("matches")
    .select("id")
    .eq("is_finished", true)
    .order("start_time", { ascending: false });
  const lastMatchId = finishedMatches?.[0]?.id;

  const previousMatchPoints: Record<string, number> = {};
  memberIds.forEach((id) => {
    previousMatchPoints[id] = 0;
  });

  poolPredictions.forEach((p) => {
    if (previousMatchPoints[p.user_id] !== undefined) {
      if (
        p.match_id !== lastMatchId &&
        finishedMatches?.some((m) => m.id === p.match_id)
      ) {
        previousMatchPoints[p.user_id] += p.points_won || 0;
      }
    }
  });

  const standingByUser = new Map(standings.map((s) => [s.userId, s]));

  const previousRanked = profileRows
    .map((p) => {
      const st = standingByUser.get(p.id);
      const bonus = st?.bonusPoints ?? 0;
      return {
        id: p.id,
        points: getTotalPointsWithFavoriteBonus(previousMatchPoints[p.id] ?? 0, {
          total: bonus,
          awards: [],
        }),
      };
    })
    .sort((a, b) => b.points - a.points);

  const userMap: Record<
    string,
    {
      id: string;
      nickname: string;
      flagUrl: string | null;
      points: number;
      bonusPoints: number;
      trend: string;
      isMe: boolean;
    }
  > = {};

  profilesData?.forEach((p) => {
    const st = standingByUser.get(p.id);
    const curPos = standings.findIndex((s) => s.userId === p.id);
    const prePos = previousRanked.findIndex((r) => r.id === p.id);
    let trend = "same";
    if (lastMatchId) {
      if (curPos < prePos) trend = "up";
      else if (curPos > prePos) trend = "down";
    }
    const favTeam = p.favorite_team_id ? teamsById.get(p.favorite_team_id) : null;
    userMap[p.id] = {
      id: p.id,
      nickname: p.nickname || "Usuario",
      flagUrl: getFavoriteTeamFlagUrl(favTeam ?? null, 40),
      bonusPoints: st?.bonusPoints ?? 0,
      points: st?.totalPoints ?? 0,
      trend,
      isMe: p.id === user.id,
    };
  });

  memberIds.forEach((id) => {
    if (userMap[id]) return;
    const st = standingByUser.get(id);
    userMap[id] = {
      id,
      nickname: profileById.get(id)?.nickname || "Usuario",
      flagUrl: null,
      bonusPoints: st?.bonusPoints ?? 0,
      points: st?.totalPoints ?? 0,
      trend: "same",
      isMe: id === user.id,
    };
  });

  const sortedRanking = Object.values(userMap)
    .sort((a, b) => b.points - a.points)
    .map((member, index, arr) => ({
      ...member,
      rank: getCompetitionRankAtIndex(arr, index),
    }));

  let userHistory: MatchHistoryRow[] = [];
  const historyProfile = viewUserId ? userMap[viewUserId] : null;

  const { data: allTeams } = await supabase.from("teams").select("*");
  const { data: allGroupMatches } = await supabase
    .from("matches")
    .select("*, team_a:teams!team_a_id(*), team_b:teams!team_b_id(*)")
    .eq("stage", "group");
  const { data: allKnockoutMatches } = await supabase
    .from("matches")
    .select("*, team_a:teams!team_a_id(*), team_b:teams!team_b_id(*)")
    .neq("stage", "group");

  const { data: myPredictions } = await supabase
    .from("predictions")
    .select("*")
    .eq("user_id", user.id);

  if (viewUserId && historyProfile && allGroupMatches && allTeams) {
    const { data: hMatches } = await supabase
      .from("matches")
      .select("*, team_a:teams!team_a_id(*), team_b:teams!team_b_id(*)")
      .not("result_a", "is", null)
      .order("start_time", { ascending: true });
    const finishedKnockout = ((hMatches ?? []) as Match[]).filter(
      (m) => m.stage !== "group"
    );
    const knockoutLabels = buildKnockoutHistoryLabels(
      finishedKnockout,
      allGroupMatches as Match[],
      allTeams as Team[]
    );
    const hPreds = poolPredictions.filter((p) => p.user_id === viewUserId);
    const viewUserProfile = profileById.get(viewUserId);
    const favoriteTeamId = viewUserProfile?.favorite_team_id ?? null;
    const favoriteTeamName = favoriteTeamId
      ? teamsById.get(favoriteTeamId)?.name ?? null
      : null;
    userHistory = buildMatchHistoryRows({
      finishedMatches: (hMatches ?? []) as Match[],
      predictions: hPreds,
      knockoutLabels,
      favoriteTeamId,
      allGroupMatches: allGroupMatches as Match[],
      allKnockoutMatches: (allKnockoutMatches ?? []) as Match[],
      allTeams: (allTeams ?? []) as Team[],
      favoriteTeamName,
    });
  }

  const { data: upcomingRaw } = await supabase
    .from("matches")
    .select(`*, team_a:teams!team_a_id(*), team_b:teams!team_b_id(*)`)
    .eq("is_finished", false)
    .order("start_time", { ascending: true })
    .limit(40);

  let matches: Match[] = (upcomingRaw ?? []) as Match[];

  if (matches.length > 0 && allGroupMatches && allTeams) {
    const groupStageMatches = matches.filter((m) => m.stage === "group");
    const knockoutStageMatches = matches.filter((m) => m.stage !== "group");
    if (knockoutStageMatches.length > 0) {
      // Resolver el bracket con TODOS los KO (incl. ya cerrados): octavos/cuartos
      // referencian ganadores de dieciseisavos vía matchMap; si solo pasamos próximos,
      // no hay partidos previos y los nombres quedan vacíos.
      const upcomingKoIds = new Set(knockoutStageMatches.map((m) => m.id));
      const fullKnockout = ((allKnockoutMatches ?? []) as Match[]).length
        ? ((allKnockoutMatches ?? []) as Match[])
        : knockoutStageMatches;
      const resolvedAll = resolveKnockoutTeamsForLeague(
        fullKnockout,
        allGroupMatches as Match[],
        allTeams as Team[],
        (myPredictions || []) as Prediction[]
      );
      const resolvedKo = resolvedAll.filter((m) => upcomingKoIds.has(m.id));
      matches = [...groupStageMatches, ...resolvedKo].sort(
        (a, b) =>
          new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
      );
    }
  }

  const poolMembers = memberIds.map((id) => ({
    id,
    nickname: profileById.get(id)?.nickname || "Usuario",
  }));

  const allMatchesForPhase = [
    ...((allGroupMatches ?? []) as Match[]),
    ...((allKnockoutMatches ?? []) as Match[]),
  ];

  const phaseCompleteCache = new Map<string, Record<string, boolean>>();

  function phaseCompleteForMatch(match: Match): Record<string, boolean> {
    const cacheKey =
      match.stage === "group"
        ? `group:${match.group_id}`
        : `knockout:${match.stage}`;
    if (phaseCompleteCache.has(cacheKey)) {
      return phaseCompleteCache.get(cacheKey)!;
    }
    const ctx: PhaseContext =
      match.stage === "group"
        ? { view: "groups", groupId: match.group_id! }
        : { view: "knockout", stage: match.stage };
    const phaseMatchIds = getPhaseMatchIds(allMatchesForPhase, ctx);
    const phaseMatches = allMatchesForPhase.filter((m) =>
      phaseMatchIds.includes(m.id)
    );
    const byUser = buildPhaseCompletionByUser(
      memberIds,
      poolPredictions,
      phaseMatchIds,
      phaseMatches
    );
    phaseCompleteCache.set(cacheKey, byUser);
    return byUser;
  }

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 font-sans text-gray-900 dark:text-zinc-100 relative">
      <RealtimeRankingListener />

      {viewUserId && historyProfile && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-xl max-h-[85vh] rounded-[3rem] shadow-2xl overflow-hidden flex flex-col border border-gray-100 dark:border-zinc-800">
            <div className="p-6 sm:p-8 border-b border-gray-50 dark:border-zinc-800 flex justify-between items-center bg-gray-50/50 dark:bg-zinc-800/50">
              <div className="flex items-center gap-4">
                <MemberBadge
                  flagUrl={historyProfile.flagUrl}
                  nickname={historyProfile.nickname}
                  size="md"
                />
                <div>
                  <h3 className="font-black text-xl uppercase tracking-tighter">
                    {historyProfile.nickname}
                  </h3>
                  <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">
                    Resumen de la Liga
                  </p>
                </div>
              </div>
              <Link
                href={poolHref(poolId)}
                className="w-10 h-10 flex items-center justify-center bg-white dark:bg-zinc-800 rounded-full shadow-sm hover:scale-110 transition-transform"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </Link>
            </div>
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              <MatchHistoryList rows={userHistory} />
            </div>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto">
        <nav className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <Link
            href="/groups"
            className="inline-flex items-center gap-3 min-h-11 w-fit max-w-full px-1 -ml-1 rounded-xl text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest hover:bg-blue-50/80 dark:hover:bg-blue-950/30 active:scale-[0.98] transition-all"
          >
            <span
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-950/50"
              aria-hidden
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m15 18-6-6 6-6" />
              </svg>
            </span>
            Mis Ligas
          </Link>
          <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center sm:gap-2 sm:shrink-0">
            <CopyInviteCode
              code={pool.invite_code}
              className="w-full sm:w-auto"
            />
            <ShareLeagueQR
              inviteCode={pool.invite_code}
              poolName={pool.name}
              className="sm:w-auto"
            />
          </div>
        </nav>

        {joinedMessage && (
          <div className="mb-6 rounded-2xl border border-green-200 bg-green-50 dark:bg-green-950/30 dark:border-green-900 px-5 py-3 text-center">
            <p className="text-[10px] font-black uppercase tracking-widest text-green-600">
              Te has unido a la liga
            </p>
          </div>
        )}

        <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-3xl sm:text-6xl font-black uppercase tracking-tighter leading-none">
              {pool.name}
            </h1>
            <p className="text-gray-400 font-bold uppercase text-[10px] tracking-[0.4em] mt-4">
              Competición Privada • {memberIds.length} Jugadores
            </p>
          </div>
          <div className="flex items-center gap-3 justify-start md:justify-end">
            <LeagueAdminPanel
              poolId={Number(poolId)}
              poolName={pool.name}
              isAdmin={isAdmin}
              myUserId={user.id}
              creatorId={pool.creator_id}
              members={poolMembers}
            />
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-4 space-y-8">
            <div className="sticky top-24">
              <h2 className="text-xs font-black uppercase tracking-[0.3em] text-gray-400 mb-2 flex items-center gap-3">
                <span className="flex items-center gap-2 shrink-0">
                  Ranking
                  <ScoringRulesButton size="sm" />
                </span>
                <div className="h-px flex-1 bg-gray-100 dark:bg-zinc-900" />
              </h2>
              <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] shadow-2xl border border-gray-100 dark:border-zinc-800 overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <tbody className="divide-y divide-gray-50 dark:divide-zinc-800">
                    {sortedRanking.map((member) => (
                      <tr key={member.id} className="group">
                        <td className="p-0">
                          <Link
                            href={poolHref(poolId, { view_user: member.id })}
                            className={`flex items-center w-full px-4 py-4 transition-all ${
                              member.isMe
                                ? "bg-blue-600 text-white"
                                : "hover:bg-gray-50/50 dark:hover:bg-zinc-800/30"
                            }`}
                          >
                            <div className="w-10 text-center flex-shrink-0 flex flex-col items-center">
                              <span className="text-[10px] font-black">{member.rank}</span>
                              <div className="h-3 flex items-center">
                                {member.trend === "up" && (
                                  <span className="text-[8px] text-green-500 animate-bounce">
                                    ▲
                                  </span>
                                )}
                                {member.trend === "down" && (
                                  <span className="text-[8px] text-red-500">▼</span>
                                )}
                                {member.trend === "same" && (
                                  <span className="w-1 h-1 bg-gray-300 rounded-full" />
                                )}
                              </div>
                            </div>
                            <div className="flex-1 flex items-center gap-3 min-w-0">
                              <MemberBadge
                                flagUrl={member.flagUrl}
                                nickname={member.nickname}
                                inverted={member.isMe}
                              />
                              <div className="flex flex-col min-w-0">
                                <span className="font-black text-xs uppercase truncate">
                                  {member.nickname}
                                </span>
                                <span
                                  className={`text-[7px] font-black uppercase tracking-widest ${
                                    member.isMe ? "text-blue-200" : "text-gray-400"
                                  }`}
                                >
                                  Ver historial
                                </span>
                              </div>
                            </div>
                            <div className="px-3 sm:px-4 text-right shrink-0 font-black text-base sm:text-lg tracking-tighter tabular-nums min-w-[3.25rem] sm:min-w-[4rem]">
                              {member.points}
                            </div>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="lg:col-span-8 space-y-8">
            <h2 className="text-xs font-black uppercase tracking-[0.3em] text-gray-400">
              Próximos partidos
            </h2>

            {matches.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 sm:gap-6">
                {matches.map((match) => {
                  const prediction = myPredictions?.find((p) => p.match_id === match.id);
                  return (
                    <MatchCard
                      key={match.id}
                      match={match}
                      userId={user.id}
                      initialPrediction={prediction}
                      poolId={poolId}
                      poolMembers={poolMembers}
                      phaseCompleteByUser={phaseCompleteForMatch(match)}
                    />
                  );
                })}
              </div>
            ) : (
              <div className="py-16 text-center rounded-[2rem] border border-dashed border-gray-200 dark:border-zinc-800">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                  No hay partidos próximos
                </p>
              </div>
            )}

            {isCreator && <DeletePoolButton poolId={Number(poolId)} />}
          </div>
        </div>

        {!isCreator && (
          <section
            className="mt-16 sm:mt-20 pt-8 sm:pt-10 border-t border-gray-100 dark:border-zinc-800"
            aria-label="Salir de la liga"
          >
            <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left sm:gap-8">
              <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 leading-relaxed max-w-md">
                Si abandonas la liga dejarás de ver el ranking y las predicciones del
                grupo.
              </p>
              <LeaveGroupButton
                poolId={Number(poolId)}
                poolName={pool.name}
                className="w-full sm:w-auto"
              />
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
