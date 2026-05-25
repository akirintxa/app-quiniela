import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import RealtimeRankingListener from "@/components/RealtimeRankingListener";
import RankingTabsHandler from "@/components/RankingTabsHandler";
import ShareRankingButton from "@/components/ShareRankingButton";
import MemberBadge from "@/components/MemberBadge";
import ScoringRulesButton from "@/components/ScoringRulesButton";
import { getFavoriteTeamFlagUrl, loadFavoriteTeamsByIds } from "@/lib/profile";
import { getFavoriteBonusesForUsers } from "@/lib/favorite-bonus-server";
import { getTotalPointsWithFavoriteBonus } from "@/lib/favorite-bonus";
import {
  formatPointsBreakdown,
  getPointsBreakdown,
} from "@/lib/points";
import { Match, Prediction } from "@/types";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Q26 - La Quiniela",
};

export default async function RankingPage({
  searchParams,
}: {
  searchParams: Promise<{ pool?: string; view_user?: string; view?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const resolvedSearchParams = await searchParams;
  const selectedPoolId = resolvedSearchParams.pool;
  const viewUserId = resolvedSearchParams.view_user;
  const currentView = resolvedSearchParams.view || "players";

  // 1. Fetch user's pools
  const { data: myPools } = await supabase
    .from('pool_members')
    .select('pool_id, pools (name)')
    .eq('user_id', user.id);

  const selectedPoolData = myPools?.find(p => String(p.pool_id) === selectedPoolId);
  const selectedPoolName = (selectedPoolData?.pools as any)?.name;

  // --- LOGIC FOR PLAYERS RANKING ---
  let sortedRanking: any[] = [];
  let userMap: Record<string, any> = {};
  
  if (currentView === "players") {
    // 1. Obtener todos los perfiles registrados con su equipo favorito (iso_code)
    const { data: profiles, error: pError } = await supabase
      .from('profiles')
      .select('id, nickname, favorite_team_id');

    if (pError) console.error("Error fetching profiles:", pError);

    const favoriteIds =
      profiles?.map((p) => p.favorite_team_id).filter((id): id is number => id != null) ||
      [];
    const teamsById = await loadFavoriteTeamsByIds(supabase, favoriteIds);

    if (profiles) {
      let filteredProfiles = profiles;

      // 2. Si estamos en una liga, filtramos los perfiles
      if (selectedPoolId && selectedPoolId !== 'all') {
        const { data: members } = await supabase.from('pool_members').select('user_id').eq('pool_id', Number(selectedPoolId));
        if (members) {
          const memberIds = members.map(m => m.user_id);
          filteredProfiles = profiles.filter(p => memberIds.includes(p.id));
        }
      }

      const targetIds = filteredProfiles.map(p => p.id);

      const favoriteBonuses = await getFavoriteBonusesForUsers(
        supabase,
        filteredProfiles.map((p) => ({
          id: p.id,
          favorite_team_id: p.favorite_team_id,
        }))
      );

      // 3. Obtener puntos acumulados de forma segura
      const { data: predictionsData } = await supabase
        .from('predictions')
        .select('user_id, points_won, match_id')
        .in('user_id', targetIds);

      const { data: finishedMatches } = await supabase.from('matches').select('id').eq('is_finished', true).order('start_time', { ascending: false });
      const lastMatchId = finishedMatches?.[0]?.id;

      const currentScores: Record<string, number> = {};
      const previousScores: Record<string, number> = {};
      targetIds.forEach(id => { currentScores[id] = 0; previousScores[id] = 0; });

      predictionsData?.forEach(p => {
        if (currentScores[p.user_id] !== undefined) {
          currentScores[p.user_id] += p.points_won || 0;
          if (p.match_id !== lastMatchId && finishedMatches?.some(m => m.id === p.match_id)) {
            previousScores[p.user_id] += p.points_won || 0;
          }
        }
      });

      const currentRanked = Object.keys(currentScores).map(id => ({ id, points: currentScores[id] })).sort((a, b) => b.points - a.points);
      const previousRanked = Object.keys(previousScores).map(id => ({ id, points: previousScores[id] })).sort((a, b) => b.points - a.points);

      filteredProfiles.forEach(p => {
        const curPos = currentRanked.findIndex(r => r.id === p.id);
        const prePos = previousRanked.findIndex(r => r.id === p.id);
        let trend = 'same';
        if (lastMatchId) {
          if (curPos < prePos) trend = 'up';
          else if (curPos > prePos) trend = 'down';
        }
        const favTeam = p.favorite_team_id ? teamsById.get(p.favorite_team_id) : null;
        const matchPts = currentScores[p.id] || 0;
        const bonus = favoriteBonuses[p.id]?.total ?? 0;
        userMap[p.id] = {
          id: p.id,
          nickname: p.nickname || 'Usuario',
          flagUrl: getFavoriteTeamFlagUrl(favTeam ?? null, 40),
          matchPoints: matchPts,
          bonusPoints: bonus,
          points: getTotalPointsWithFavoriteBonus(matchPts, favoriteBonuses[p.id] ?? { total: 0, awards: [] }),
          bonusAwards: favoriteBonuses[p.id]?.awards ?? [],
          trend,
          isMe: p.id === user.id,
        };
      });

      sortedRanking = Object.values(userMap).sort((a, b) => b.points - a.points);
    }
  }

  // --- LOGIC FOR LEAGUES RANKING ---
  let leagueRanking: any[] = [];
  if (currentView === "leagues") {
    const { data: allPools } = await supabase.from('pools').select('id, name');
    const { data: allMembers } = await supabase.from('pool_members').select('pool_id, user_id');
    const { data: allPredictions } = await supabase.from('predictions').select('user_id, points_won');

    const userPoints: Record<string, number> = {};
    allPredictions?.forEach(p => { userPoints[p.user_id] = (userPoints[p.user_id] || 0) + (p.points_won || 0); });

    const leagueMap: Record<number, { name: string, totalPoints: number, members: number }> = {};
    allPools?.forEach(p => { leagueMap[p.id] = { name: p.name, totalPoints: 0, members: 0 }; });

    allMembers?.forEach(m => {
      if (leagueMap[m.pool_id]) {
        leagueMap[m.pool_id].members++;
        leagueMap[m.pool_id].totalPoints += (userPoints[m.user_id] || 0);
      }
    });

    leagueRanking = Object.values(leagueMap)
      .filter(l => l.members >= 1)
      .map(l => ({ ...l, average: Math.round((l.totalPoints / l.members) * 10) / 10 }))
      .sort((a, b) => b.average - a.average);
  }

  // --- HISTORY MODAL ---
  let userHistory: any[] = [];
  let historyProfile = (viewUserId && userMap[viewUserId]) ? userMap[viewUserId] : null;
  if (viewUserId && historyProfile) {
    const { data: matches } = await supabase
      .from('matches')
      .select('*, team_a:teams!team_a_id(name), team_b:teams!team_b_id(name)')
      .not('result_a', 'is', null)
      .order('start_time', { ascending: true });
    const { data: preds } = await supabase
      .from('predictions')
      .select('*')
      .eq('user_id', viewUserId);
    let cumulative = 0;
    userHistory = (matches || [])
      .map((m) => {
        const p = preds?.find((pr) => pr.match_id === m.id);
        const pts = p?.points_won || 0;
        cumulative += pts;
        const breakdown =
          p && m.result_a != null
            ? formatPointsBreakdown(
                getPointsBreakdown(p as Prediction, m as Match)
              )
            : '';
        return {
          match: `${(m.team_a as { name: string }).name.substring(0, 3).toUpperCase()} vs ${(m.team_b as { name: string }).name.substring(0, 3).toUpperCase()}`,
          pred: p ? `${p.predicted_a}-${p.predicted_b}` : '-',
          res: `${m.result_a}-${m.result_b}`,
          pts,
          breakdown,
          total: cumulative,
        };
      })
      .reverse();
  }

  return (
    <div className="py-10 px-4 sm:px-6 lg:px-8 font-sans">
      <Suspense fallback={null}><RankingTabsHandler /></Suspense>
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
                    Resumen de partidos
                  </p>
                </div>
              </div>
              <Link href={selectedPoolId ? `/ranking?pool=${selectedPoolId}&view=players` : '/ranking?pool=all&view=players'} className="w-10 h-10 flex items-center justify-center bg-white dark:bg-zinc-800 rounded-full shadow-sm hover:scale-110 transition-transform">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </Link>
            </div>
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              <div className="space-y-3">
                {userHistory.map((h, i) => (
                  <div key={i} className="flex items-center justify-between bg-gray-50 dark:bg-zinc-800/40 p-4 rounded-2xl border border-gray-100 dark:border-zinc-800/50">
                    <div className="flex flex-col min-w-0">
                      <span className="text-[10px] font-black uppercase text-gray-400 mb-1">{h.match}</span>
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-xs font-bold text-gray-500 italic">
                          Pred: <span className="text-gray-900 dark:text-white not-italic">{h.pred}</span>
                        </span>
                        <span className="w-px h-3 bg-gray-200" />
                        <span className="text-xs font-bold text-gray-500 italic">
                          Res: <span className="text-blue-600 not-italic">{h.res}</span>
                        </span>
                      </div>
                      {h.breakdown && (
                        <span className="text-[8px] font-bold text-gray-400 uppercase mt-1 tracking-wider">
                          {h.breakdown}
                        </span>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-black text-lg tracking-tighter leading-none">
                        {h.total} <span className="text-[10px] text-gray-400">PTS</span>
                      </div>
                      <span
                        className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                          h.pts > 0
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-400'
                        }`}
                      >
                        +{h.pts}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto">
        <header className="mb-10 flex flex-col sm:flex-row justify-between items-center gap-6 text-center sm:text-left">
          <div>
            <div className="flex items-center justify-center sm:justify-start gap-3 mb-2">
              <span className="bg-blue-600 text-white px-2 py-0.5 text-[10px] font-black rounded uppercase tracking-widest">MUNDIAL 2026</span>
              <h2 className="text-[10px] text-gray-400 font-black uppercase tracking-[0.3em]">Hall of Fame</h2>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tighter text-gray-900 dark:text-white uppercase leading-none">RANKING <span className="text-blue-600">LIVE</span></h1>
          </div>
          <ShareRankingButton poolName={selectedPoolName} />
        </header>

        <div className="flex gap-4 mb-8 justify-center sm:justify-start">
          <Link href={`/ranking?view=players${selectedPoolId ? `&pool=${selectedPoolId}` : '&pool=all'}`} className={`text-[10px] font-black uppercase tracking-widest pb-2 border-b-4 transition-all ${currentView === 'players' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-400'}`}>Jugadores</Link>
          <Link href="/ranking?view=leagues" className={`text-[10px] font-black uppercase tracking-widest pb-2 border-b-4 transition-all ${currentView === 'leagues' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-400'}`}>Ligas</Link>
        </div>

        {currentView === 'players' && (
          <div className="flex flex-wrap gap-2 mb-8 p-1.5 bg-gray-100 dark:bg-zinc-900 rounded-2xl w-full sm:w-fit overflow-x-auto no-scrollbar">
            <Link href="/ranking?pool=all&view=players" className={`flex-1 sm:flex-none text-center px-6 py-2.5 rounded-xl text-[9px] font-black uppercase transition-all ${(!selectedPoolId || selectedPoolId === 'all') ? 'bg-white dark:bg-zinc-800 text-blue-600 shadow-sm' : 'text-gray-400'}`}>Global</Link>
            {myPools?.map(p => (
              <Link key={p.pool_id} href={`/ranking?pool=${p.pool_id}&view=players`} className={`flex-1 sm:flex-none text-center px-6 py-2.5 rounded-xl text-[9px] font-black uppercase transition-all ${selectedPoolId === String(p.pool_id) ? 'bg-white dark:bg-zinc-800 text-blue-600 shadow-sm' : 'text-gray-400'}`}>{(p.pools as any)?.name}</Link>
            ))}
          </div>
        )}

        {currentView === 'players' ? (
          <>
            <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] shadow-2xl border border-gray-100 dark:border-zinc-800 overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 dark:bg-zinc-800/50">
                    <th className="px-6 py-4 text-[9px] font-black uppercase text-gray-400 w-16 text-center">Pos</th>
                    <th className="px-6 py-4 text-[9px] font-black uppercase text-gray-400">Jugador</th>
                    <th className="px-6 py-4 text-[9px] font-black uppercase text-gray-400 text-right">
                      <span className="inline-flex items-center justify-end gap-2">
                        Pts
                        <ScoringRulesButton size="sm" />
                      </span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-zinc-800">
                  {sortedRanking.map((member, index) => (
                    <tr key={index}>
                      <td className="p-0" colSpan={3}>
                        <Link href={selectedPoolId ? `/ranking?pool=${selectedPoolId}&view=players&view_user=${member.id}` : `/ranking?pool=all&view=players&view_user=${member.id}`} className={`flex items-center w-full px-6 py-5 transition-all group ${member.isMe ? 'bg-blue-600 text-white' : 'hover:bg-gray-50/50 dark:hover:bg-zinc-800/30'}`}>
                          <div className="w-16 text-center flex-shrink-0 flex flex-col items-center">
                            <span className={`w-8 h-8 inline-flex items-center justify-center rounded-xl text-[10px] font-black ${index === 0 && !member.isMe ? 'bg-yellow-400 text-yellow-950' : member.isMe ? 'bg-white/20' : 'bg-gray-50 dark:bg-zinc-800 text-gray-400'}`}>{index + 1}</span>
                            <div className="mt-1 flex items-center justify-center h-4">
                              {member.trend === 'up' && <div className="flex flex-col items-center animate-in slide-in-from-bottom-1 duration-500"><span className="text-[12px] text-green-500 leading-none">▲</span></div>}
                              {member.trend === 'down' && <div className="flex flex-col items-center animate-in slide-in-from-top-1 duration-500"><span className="text-[12px] text-red-500 leading-none">▼</span></div>}
                              {member.trend === 'same' && <span className="w-1 h-1 bg-gray-300 rounded-full"></span>}
                            </div>
                          </div>
                          <div className="flex-1 flex items-center gap-4 min-w-0">
                            <MemberBadge
                              flagUrl={member.flagUrl}
                              nickname={member.nickname}
                              inverted={member.isMe}
                            />
                            <div className="flex flex-col min-w-0">
                              <span className="font-black text-sm uppercase tracking-tighter truncate">
                                {member.nickname}
                              </span>
                              <span
                                className={`text-[8px] font-black uppercase tracking-widest ${
                                  member.isMe
                                    ? 'opacity-60'
                                    : 'text-gray-400 group-hover:text-blue-500'
                                }`}
                              >
                                Ver historial
                              </span>
                            </div>
                          </div>
                          <div className="px-6 text-right shrink-0 font-black text-xl tracking-tighter">
                            {member.points}
                          </div>
                        </Link>
                      </td>
                    </tr>
                  ))}
                  {sortedRanking.length === 0 && (
                    <tr>
                      <td colSpan={3} className="px-8 py-20 text-center text-gray-400 text-xs font-black uppercase tracking-widest opacity-50 italic">
                        No hay jugadores registrados en esta vista aún
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] shadow-2xl border border-gray-100 dark:border-zinc-800 overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-zinc-800/50">
                  <th className="px-6 py-4 text-[9px] font-black uppercase text-gray-400 w-16 text-center">Pos</th>
                  <th className="px-6 py-4 text-[9px] font-black uppercase text-gray-400">Liga Privada</th>
                  <th className="px-6 py-4 text-[9px] font-black uppercase text-gray-400 text-center">Jugs</th>
                  <th className="px-6 py-4 text-[9px] font-black uppercase text-gray-400 text-right">Promedio</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-zinc-800">
                {leagueRanking.map((league, index) => (
                  <tr key={index} className="hover:bg-gray-50/50 dark:hover:bg-zinc-800/30 transition-all">
                    <td className="px-6 py-6 w-16 text-center">
                      <span className={`w-8 h-8 inline-flex items-center justify-center rounded-xl text-[10px] font-black ${index === 0 ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'bg-gray-50 dark:bg-zinc-800 text-gray-400'}`}>{index + 1}</span>
                    </td>
                    <td className="py-6">
                      <span className="font-black text-sm uppercase tracking-tighter text-gray-900 dark:text-white">{league.name}</span>
                    </td>
                    <td className="py-6 text-center">
                      <span className="text-[10px] font-black bg-gray-100 dark:bg-zinc-800 text-gray-500 px-2 py-1 rounded-md uppercase tracking-widest">{league.members}</span>
                    </td>
                    <td className="px-6 py-6 text-right">
                      <div className="font-black text-xl tracking-tighter text-blue-600">{league.average} <span className="text-[10px] text-gray-400">PTS</span></div>
                    </td>
                  </tr>
                ))}
                {leagueRanking.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-8 py-20 text-center text-gray-400 text-xs font-black uppercase tracking-widest opacity-50 italic">No hay ligas con suficientes miembros aún</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
