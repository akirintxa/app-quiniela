import { createClient } from "@/utils/supabase/server";
import { Match, Prediction } from "@/types";
import MatchCard from "@/components/MatchCard";
import CopyInviteCode from "@/components/CopyInviteCode";
import LeaveGroupButton from "@/components/LeaveGroupButton";
import DeletePoolButton from "@/components/DeletePoolButton";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

export default async function GroupDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ group?: string; view?: string; view_user?: string }>;
}) {
  const supabase = await createClient();
  const { id: poolId } = await params;
  const resolvedSearchParams = await searchParams;
  const selectedGroup = resolvedSearchParams.group || "A";
  const view = resolvedSearchParams.view || "groups";
  const viewUserId = resolvedSearchParams.view_user;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: pool, error: poolError } = await supabase.from('pools').select('*').eq('id', poolId).single();
  if (poolError || !pool) notFound();

  const { data: membership } = await supabase.from('pool_members').select('*').eq('pool_id', poolId).eq('user_id', user.id).single();
  if (!membership) redirect('/groups?error=not-a-member');

  // Permissions
  const isCreator = pool.creator_id === user.id;

  // 1. Fetch Members & Profiles
  const { data: membersData } = await supabase.from('pool_members').select('user_id').eq('pool_id', poolId);
  const memberIds = membersData?.map(m => m.user_id) || [];
  const { data: profilesData } = await supabase.from('profiles').select('id, nickname, avatar_url, teams:favorite_team_id (iso_code)').in('id', memberIds);
  const { data: predictionsData } = await supabase.from('predictions').select('user_id, points_won, match_id').in('user_id', memberIds);

  // 2. Trend Logic
  const { data: finishedMatches } = await supabase.from('matches').select('id').eq('is_finished', true).order('start_time', { ascending: false });
  const lastMatchId = finishedMatches?.[0]?.id;

  const userMap: Record<string, any> = {};
  const currentScores: Record<string, number> = {};
  const previousScores: Record<string, number> = {};
  memberIds.forEach(id => { currentScores[id] = 0; previousScores[id] = 0; });

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

  // 3. History modal
  let userHistory: any[] = [];
  let historyProfile = viewUserId ? userMap[viewUserId] : null;
  if (viewUserId && historyProfile) {
    const { data: hMatches } = await supabase.from('matches').select('*, team_a:teams!team_a_id(name), team_b:teams!team_b_id(name)').not('result_a', 'is', null).order('start_time', { ascending: true });
    const { data: hPreds } = await supabase.from('predictions').select('*').eq('user_id', viewUserId);
    let cumulative = 0;
    userHistory = (hMatches || []).map(m => {
      const p = hPreds?.find(pr => pr.match_id === m.id);
      const pts = p?.points_won || 0;
      cumulative += pts;
      return { match: `${(m.team_a as any).name.substring(0,3).toUpperCase()} vs ${(m.team_b as any).name.substring(0,3).toUpperCase()}`, pred: p ? `${p.predicted_a}-${p.predicted_b}` : '-', res: `${m.result_a}-${m.result_b}`, pts, total: cumulative };
    }).reverse();
  }

  // 4. Matches Logic
  let mQuery = supabase.from("matches").select(`*, team_a:teams!team_a_id(*), team_b:teams!team_b_id(*)`);
  if (view === "today") mQuery = mQuery.order("is_finished", { ascending: true }).order("start_time", { ascending: true }).limit(20);
  else mQuery = mQuery.eq("group_id", selectedGroup).eq("stage", "group").order("is_finished", { ascending: true }).order("start_time", { ascending: true });
  const { data: matches } = await mQuery;

  const { data: myPredictions } = await supabase.from('predictions').select('*').eq('user_id', user.id);
  const groups = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"];

  const getFlagUrl = (iso: string) => {
    if (!iso) return null;
    const cleanIso = iso.toLowerCase();
    const special: Record<string, string> = { 'gb-sct': 'gb-sct', 'gb-eng': 'gb-eng', 'gb-wls': 'gb-wls' };
    return `https://flagcdn.com/w40/${special[cleanIso] || cleanIso}.png`;
  };

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 font-sans text-gray-900 dark:text-zinc-100 relative">
      {viewUserId && historyProfile && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-xl max-h-[85vh] rounded-[3rem] shadow-2xl overflow-hidden flex flex-col border border-gray-100 dark:border-zinc-800">
            <div className="p-6 sm:p-8 border-b border-gray-50 dark:border-zinc-800 flex justify-between items-center bg-gray-50/50 dark:bg-zinc-800/50">
              <div className="flex items-center gap-4">
                <img src={historyProfile.avatar} alt="av" className="w-12 h-12 rounded-2xl bg-white dark:bg-zinc-800 border-2 border-blue-500 shadow-lg" />
                <div><h3 className="font-black text-xl uppercase tracking-tighter">{historyProfile.nickname}</h3><p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Resumen del Grupo</p></div>
              </div>
              <Link href={`/groups/${poolId}?view=${view}${selectedGroup ? `&group=${selectedGroup}` : ''}`} className="w-10 h-10 flex items-center justify-center bg-white dark:bg-zinc-800 rounded-full shadow-sm hover:scale-110 transition-transform">
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
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto">
        <nav className="mb-10 flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center gap-6">
            <Link href="/groups" className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest flex items-center gap-2 hover:translate-x-[-4px] transition-all">← Mis Grupos</Link>
            <div className="hidden sm:block w-px h-4 bg-gray-100 dark:bg-zinc-800"></div>
            <LeaveGroupButton poolId={Number(poolId)} poolName={pool.name} />
          </div>
          <CopyInviteCode code={pool.invite_code} />
        </nav>

        <header className="mb-16">
          <h1 className="text-3xl sm:text-6xl font-black uppercase tracking-tighter leading-none">{pool.name}</h1>
          <p className="text-gray-400 font-bold uppercase text-[10px] tracking-[0.4em] mt-4">Competición Privada • {memberIds.length} Jugadores</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-4 space-y-8">
            <div className="sticky top-24">
              <h2 className="text-xs font-black uppercase tracking-[0.3em] text-gray-400 mb-6 flex items-center gap-4">Ranking <div className="h-px flex-1 bg-gray-100 dark:bg-zinc-900"></div></h2>
              <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] shadow-2xl border border-gray-100 dark:border-zinc-800 overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <tbody className="divide-y divide-gray-50 dark:divide-zinc-800">
                    {sortedRanking.map((member, index) => (
                      <tr key={index} className="group">
                        <td className="p-0">
                          <Link href={`/groups/${poolId}?view=${view}&group=${selectedGroup}&view_user=${member.id}`} className={`flex items-center w-full px-4 py-4 transition-all ${member.isMe ? 'bg-blue-600 text-white' : 'hover:bg-gray-50/50 dark:hover:bg-zinc-800/30'}`}>
                            <div className="w-10 text-center flex-shrink-0 flex flex-col items-center">
                              <span className="text-[10px] font-black">{index + 1}</span>
                              <div className="h-3 flex items-center">
                                {member.trend === 'up' && <span className="text-[8px] text-green-500 animate-bounce">▲</span>}
                                {member.trend === 'down' && <span className="text-[8px] text-red-500">▼</span>}
                                {member.trend === 'same' && <span className="w-1 h-1 bg-gray-300 rounded-full"></span>}
                              </div>
                            </div>
                            <div className="flex-1 flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-xl overflow-hidden border ${member.isMe ? 'border-white/30' : 'border-gray-100'}`}><img src={member.avatar} alt="av" className="w-full h-full object-cover" /></div>
                              <div className="flex flex-col">
                                <div className="flex items-center gap-1.5"><span className="font-black text-xs uppercase truncate max-w-[100px]">{member.nickname}</span>{member.flag && <img src={getFlagUrl(member.flag) || ""} alt="f" className="w-3 h-2 rounded-[1px]" />}</div>
                                <span className={`text-[7px] font-black uppercase tracking-widest ${member.isMe ? 'text-blue-200' : 'text-gray-400'}`}>Ver Historial</span>
                              </div>
                            </div>
                            <div className="px-4 text-right font-black text-lg tracking-tighter">{member.points}</div>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="lg:col-span-8 space-y-10">
            <div className="flex flex-col gap-8">
              <div className="flex p-1.5 bg-gray-100 dark:bg-zinc-900 rounded-2xl w-fit">
                <Link href={`/groups/${poolId}?view=today`} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${view === 'today' ? 'bg-white dark:bg-zinc-800 text-blue-600 shadow-md scale-105' : 'text-gray-400'}`}>Próximos</Link>
                <Link href={`/groups/${poolId}?view=groups&group=${selectedGroup}`} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${view === 'groups' ? 'bg-white dark:bg-zinc-800 text-blue-600 shadow-md scale-105' : 'text-gray-400'}`}>Grupos</Link>
              </div>
              {view === 'groups' && (
                <div className="flex flex-wrap gap-2 animate-in fade-in slide-in-from-top-2">
                  {groups.map(g => (
                    <Link key={g} href={`/groups/${poolId}?view=groups&group=${g}`} className={`w-10 h-10 flex items-center justify-center rounded-xl text-xs font-black transition-all ${selectedGroup === g ? 'bg-blue-600 text-white shadow-lg' : 'bg-white dark:bg-zinc-900 text-gray-400 border border-gray-100 dark:border-zinc-800'}`}>{g}</Link>
                  ))}
                </div>
              )}
            </div>
            <div className="grid grid-cols-1 gap-8">
              {matches?.map((match: Match) => {
                const prediction = myPredictions?.find(p => p.match_id === match.id);
                return <MatchCard key={match.id} match={match} userId={user.id} initialPrediction={prediction} poolId={poolId} />;
              })}
            </div>

            {isCreator && (
              <DeletePoolButton poolId={Number(poolId)} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
