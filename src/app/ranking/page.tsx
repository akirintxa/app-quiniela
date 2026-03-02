import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import RealtimeRankingListener from "@/components/RealtimeRankingListener";
import RankingTabsHandler from "@/components/RankingTabsHandler";
import ShareRankingButton from "@/components/ShareRankingButton";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Q26 - Quiniela",
};

export default async function RankingPage({
  searchParams,
}: {
  searchParams: Promise<{ pool?: string; view_user?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const resolvedSearchParams = await searchParams;
  const selectedPoolId = resolvedSearchParams.pool;
  const viewUserId = resolvedSearchParams.view_user;

  // 1. Fetch user's pools
  const { data: myPools } = await supabase
    .from('pool_members')
    .select('pool_id, pools (name)')
    .eq('user_id', user.id);

  const selectedPoolData = myPools?.find(p => String(p.pool_id) === selectedPoolId);
  const selectedPoolName = (selectedPoolData?.pools as any)?.name;

  // 2. Fetch Players
  let targetUserIds: string[] = [];
  if (selectedPoolId) {
    const { data: members } = await supabase.from('pool_members').select('user_id').eq('pool_id', Number(selectedPoolId));
    if (members) targetUserIds = members.map(m => m.user_id);
  } else {
    const { data: allProfiles } = await supabase.from('profiles').select('id');
    if (allProfiles) targetUserIds = allProfiles.map(p => p.id);
  }

  // 3. Fetch Matches and Predictions
  const { data: finishedMatches } = await supabase.from('matches').select('id').eq('is_finished', true).order('start_time', { ascending: false });
  const lastMatchId = finishedMatches?.[0]?.id;

  const { data: profilesData } = await supabase.from('profiles').select('id, nickname, avatar_url, teams:favorite_team_id (iso_code)').in('id', targetUserIds);
  const { data: predictionsData } = await supabase.from('predictions').select('user_id, points_won, match_id').in('user_id', targetUserIds);

  // 4. Calculate Trends
  const currentScores: Record<string, number> = {};
  const previousScores: Record<string, number> = {};
  targetUserIds.forEach(id => { currentScores[id] = 0; previousScores[id] = 0; });

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

  const userMap: Record<string, any> = {};
  profilesData?.forEach(p => {
    const curPos = currentRanked.findIndex(r => r.id === p.id);
    const prePos = previousRanked.findIndex(r => r.id === p.id);
    let trend = 'same';
    if (lastMatchId) {
      if (curPos < prePos) trend = 'up';
      else if (curPos > prePos) trend = 'down';
    }
    userMap[p.id] = { id: p.id, nickname: p.nickname || 'Usuario', avatar: p.avatar_url || `https://api.dicebear.com/7.x/identicon/svg?seed=${p.id}`, flag: (p.teams as any)?.iso_code, points: currentScores[p.id], trend, isMe: p.id === user.id };
  });

  const sortedRanking = Object.values(userMap).sort((a, b) => b.points - a.points);

  // 5. History logic
  let userHistory: any[] = [];
  let historyProfile = viewUserId ? userMap[viewUserId] : null;
  if (viewUserId && historyProfile) {
    const { data: matches } = await supabase.from('matches').select('*, team_a:teams!team_a_id(name), team_b:teams!team_b_id(name)').not('result_a', 'is', null).order('start_time', { ascending: true });
    const { data: preds } = await supabase.from('predictions').select('*').eq('user_id', viewUserId);
    let cumulative = 0;
    userHistory = (matches || []).map(m => {
      const p = preds?.find(pr => pr.match_id === m.id);
      const pts = p?.points_won || 0;
      cumulative += pts;
      return { match: `${(m.team_a as any).name.substring(0,3).toUpperCase()} vs ${(m.team_b as any).name.substring(0,3).toUpperCase()}`, pred: p ? `${p.predicted_a}-${p.predicted_b}` : '-', res: `${m.result_a}-${m.result_b}`, pts, total: cumulative };
    }).reverse();
  }

  const getFlagUrl = (iso: string) => {
    if (!iso) return null;
    const cleanIso = iso.toLowerCase();
    const special: Record<string, string> = { 'gb-sct': 'gb-sct', 'gb-eng': 'gb-eng', 'gb-wls': 'gb-wls' };
    return `https://flagcdn.com/w40/${special[cleanIso] || cleanIso}.png`;
  };

  return (
    <div className="py-10 px-4 sm:px-6 lg:px-8 font-sans">
      <Suspense fallback={null}><RankingTabsHandler /></Suspense>
      <RealtimeRankingListener />

      {viewUserId && historyProfile && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-xl max-h-[85vh] rounded-[3rem] shadow-2xl overflow-hidden flex flex-col border border-gray-100 dark:border-zinc-800">
            <div className="p-6 sm:p-8 border-b border-gray-50 dark:border-zinc-800 flex justify-between items-center bg-gray-50/50 dark:bg-zinc-800/50">
              <div className="flex items-center gap-4">
                <img src={historyProfile.avatar} alt="av" className="w-12 h-12 rounded-2xl bg-white dark:bg-zinc-800 border-2 border-blue-500 shadow-lg" />
                <div><h3 className="font-black text-xl uppercase tracking-tighter">{historyProfile.nickname}</h3><p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Resumen de Jornadas</p></div>
              </div>
              <Link href={selectedPoolId ? `/ranking?pool=${selectedPoolId}` : '/ranking'} className="w-10 h-10 flex items-center justify-center bg-white dark:bg-zinc-800 rounded-full shadow-sm hover:scale-110 transition-transform">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </Link>
            </div>
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              <div className="space-y-3">
                {userHistory.map((h, i) => (
                  <div key={i} className="flex items-center justify-between bg-gray-50 dark:bg-zinc-800/40 p-4 rounded-2xl border border-gray-100 dark:border-zinc-800/50">
                    <div className="flex flex-col"><span className="text-[10px] font-black uppercase text-gray-400 mb-1">{h.match}</span><div className="flex items-center gap-3"><span className="text-xs font-bold text-gray-500 italic">Pred: <span className="text-gray-900 dark:text-white not-italic">{h.pred}</span></span><span className="w-px h-3 bg-gray-200"></span><span className="text-xs font-bold text-gray-500 italic">Res: <span className="text-blue-600 not-italic">{h.res}</span></span></div></div>
                    <div className="text-right"><div className="font-black text-lg tracking-tighter leading-none">{h.total} <span className="text-[10px] text-gray-400">PTS</span></div><span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${h.pts > 0 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>+{h.pts}</span></div>
                  </div>
                ))}
                {userHistory.length === 0 && <p className="text-center py-10 text-xs font-black text-gray-300 uppercase italic">No hay partidos finalizados aún</p>}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto">
        <header className="mb-10 flex flex-col sm:flex-row justify-between items-center gap-6 text-center sm:text-left">
          <div>
            <div className="flex items-center justify-center sm:justify-start gap-3 mb-2">
              <span className="bg-blue-600 text-white px-2 py-0.5 text-[10px] font-black rounded uppercase tracking-widest">Competición</span>
              <h2 className="text-[10px] text-gray-400 font-black uppercase tracking-[0.3em]">Hall of Fame</h2>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tighter text-gray-900 dark:text-white uppercase leading-none">RANKING <span className="text-blue-600">LIVE</span></h1>
          </div>
          <ShareRankingButton poolName={selectedPoolName} />
        </header>

        <div className="flex flex-wrap gap-2 mb-8 p-1.5 bg-gray-100 dark:bg-zinc-900 rounded-2xl w-full sm:w-fit overflow-x-auto no-scrollbar">
          <Link href="/ranking" className={`flex-1 sm:flex-none text-center px-6 py-2.5 rounded-xl text-[9px] font-black uppercase transition-all ${!selectedPoolId ? 'bg-white dark:bg-zinc-800 text-blue-600 shadow-sm' : 'text-gray-400'}`}>Global</Link>
          {myPools?.map(p => (
            <Link key={p.pool_id} href={`/ranking?pool=${p.pool_id}`} className={`flex-1 sm:flex-none text-center px-6 py-2.5 rounded-xl text-[9px] font-black uppercase transition-all ${selectedPoolId === String(p.pool_id) ? 'bg-white dark:bg-zinc-800 text-blue-600 shadow-sm' : 'text-gray-400'}`}>{(p.pools as any)?.name}</Link>
          ))}
        </div>

        <div className="mb-8 grid grid-cols-3 gap-2">
          {[['+2', 'Ganador'], ['+1', 'Dif.'], ['+1', 'Goles']].map(([v, t], idx) => (
            <div key={idx} className="bg-white dark:bg-zinc-900 p-3 rounded-2xl border border-gray-100 dark:border-zinc-800 text-center">
              <span className="text-xs font-black text-blue-600 block">{v}</span>
              <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">{t}</span>
            </div>
          ))}
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] shadow-2xl border border-gray-100 dark:border-zinc-800 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-zinc-800/50">
                <th className="px-6 py-4 text-[9px] font-black uppercase text-gray-400 w-16 text-center">Pos</th>
                <th className="px-6 py-4 text-[9px] font-black uppercase text-gray-400">Jugador</th>
                <th className="px-6 py-4 text-[9px] font-black uppercase text-gray-400 text-right">Pts</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-zinc-800">
              {sortedRanking.map((member, index) => (
                <tr key={index}>
                  <td className="p-0" colSpan={3}>
                    <Link href={selectedPoolId ? `/ranking?pool=${selectedPoolId}&view_user=${member.id}` : `/ranking?view_user=${member.id}`} className={`flex items-center w-full px-6 py-5 transition-all group ${member.isMe ? 'bg-blue-600 text-white' : 'hover:bg-gray-50/50 dark:hover:bg-zinc-800/30'}`}>
                      <div className="w-16 text-center flex-shrink-0 flex flex-col items-center">
                        <span className={`w-8 h-8 inline-flex items-center justify-center rounded-xl text-[10px] font-black ${index === 0 && !member.isMe ? 'bg-yellow-400 text-yellow-950' : member.isMe ? 'bg-white/20' : 'bg-gray-50 dark:bg-zinc-800 text-gray-400'}`}>{index + 1}</span>
                        <div className="mt-1 flex items-center justify-center h-4">
                          {member.trend === 'up' && <div className="flex flex-col items-center animate-in slide-in-from-bottom-1 duration-500"><span className="text-[12px] text-green-500 leading-none">▲</span></div>}
                          {member.trend === 'down' && <div className="flex flex-col items-center animate-in slide-in-from-top-1 duration-500"><span className="text-[12px] text-red-500 leading-none">▼</span></div>}
                          {member.trend === 'same' && <span className="w-1 h-1 bg-gray-300 rounded-full"></span>}
                        </div>
                      </div>
                      <div className="flex-1 flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl overflow-hidden border-2 ${member.isMe ? 'border-white/30' : 'border-gray-100'}`}><img src={member.avatar} alt="av" className="w-full h-full object-cover" /></div>
                        <div className="flex flex-col"><div className="flex items-center gap-2"><span className="font-black text-sm uppercase tracking-tighter">{member.nickname}</span>{member.flag && <img src={getFlagUrl(member.flag) || ""} alt="f" className="w-4 h-3 rounded-[2px] shadow-sm" />}</div><span className={`text-[8px] font-black uppercase tracking-widest ${member.isMe ? 'opacity-60' : 'text-gray-400 group-hover:text-blue-500'}`}>Ver Historial</span></div>
                      </div>
                      <div className="px-6 text-right font-black text-xl tracking-tighter">{member.points}</div>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
