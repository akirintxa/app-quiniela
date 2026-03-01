import { createClient } from "@/utils/supabase/server";
import { Match, Prediction } from "@/types";
import MatchCard from "@/components/MatchCard";
import CopyInviteCode from "@/components/CopyInviteCode";
import LeaveGroupButton from "@/components/LeaveGroupButton";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

export default async function GroupDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ group?: string; view?: string }>;
}) {
  const supabase = await createClient();
  const { id: poolId } = await params;
  const resolvedSearchParams = await searchParams;
  const selectedGroup = resolvedSearchParams.group || "A";
  const view = resolvedSearchParams.view || "groups";

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: pool, error: poolError } = await supabase
    .from('pools')
    .select('*')
    .eq('id', poolId)
    .single();

  if (poolError || !pool) notFound();

  const { data: membership } = await supabase
    .from('pool_members')
    .select('*')
    .eq('pool_id', poolId)
    .eq('user_id', user.id)
    .single();

  if (!membership) redirect('/groups?error=not-a-member');

  // 1. Fetch Members directly
  const { data: membersData } = await supabase
    .from('pool_members')
    .select('user_id')
    .eq('pool_id', poolId);

  const memberIds = membersData?.map(m => m.user_id) || [];

  // 2. Fetch Profiles for these members
  const { data: profilesData } = await supabase
    .from('profiles')
    .select('id, nickname')
    .in('id', memberIds);

  // 3. Fetch Predictions for these members
  const { data: allPredictions } = await supabase
    .from('predictions')
    .select('user_id, points_won, match_id')
    .in('user_id', memberIds);

  // 4. Count total matches
  const { count: totalMatches } = await supabase
    .from('matches')
    .select('*', { count: 'exact', head: true });

  // 5. Process Data
  const userMap: Record<string, { nickname: string, points: number, predictedCount: number, isMe: boolean }> = {};
  
  // Initialize map with all members
  memberIds.forEach(id => {
    const profile = profilesData?.find(p => p.id === id);
    userMap[id] = { 
      nickname: profile?.nickname || `Usuario #${id.substring(0, 4)}`, 
      points: 0,
      predictedCount: 0,
      isMe: id === user.id
    };
  });

  // Add points and prediction counts
  allPredictions?.forEach(p => {
    if (userMap[p.user_id]) {
      userMap[p.user_id].points += p.points_won || 0;
      userMap[p.user_id].predictedCount++;
    }
  });

  const sortedRanking = Object.values(userMap).sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    return b.predictedCount - a.predictedCount;
  });

  // Matches Fetching
  let query = supabase.from("matches").select(`*, team_a:teams!team_a_id(*), team_b:teams!team_b_id(*)`);
  if (view === "today") query = query.order("start_time", { ascending: true }).limit(12);
  else query = query.eq("group_id", selectedGroup).eq("stage", "group").order("start_time", { ascending: true });
  const { data: matches } = await query;

  const { data: myPredictions } = await supabase.from('predictions').select('*').eq('user_id', user.id);
  const groups = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"];

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 font-sans text-gray-900 dark:text-zinc-100">
      <div className="max-w-6xl mx-auto">
        <nav className="mb-10 flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center gap-6">
            <Link href="/groups" className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest flex items-center gap-2 hover:translate-x-[-4px] transition-all">
              ← Mis Grupos
            </Link>
            <div className="hidden sm:block w-px h-4 bg-gray-100 dark:bg-zinc-800"></div>
            <LeaveGroupButton poolId={Number(poolId)} poolName={pool.name} />
          </div>
          <CopyInviteCode code={pool.invite_code} />
        </nav>

        <header className="mb-16">
          <h1 className="text-6xl font-black uppercase tracking-tighter leading-none">{pool.name}</h1>
          <p className="text-gray-400 font-bold uppercase text-[10px] tracking-[0.4em] mt-4">
            Competición Privada • {memberIds.length} Jugadores
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-4 space-y-8">
            <div className="sticky top-24">
              <h2 className="text-xs font-black uppercase tracking-[0.3em] text-gray-400 mb-6 flex items-center gap-4">
                Posiciones <div className="h-px flex-1 bg-gray-100 dark:bg-zinc-900"></div>
              </h2>
              <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] shadow-2xl border border-gray-100 dark:border-zinc-800 overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50/50 dark:bg-zinc-800/50 border-b border-gray-100 dark:border-zinc-800">
                      <th className="px-6 py-3 text-[8px] font-black text-gray-400 uppercase tracking-widest">Pos</th>
                      <th className="py-3 text-[8px] font-black text-gray-400 uppercase tracking-widest">Jugador</th>
                      <th className="px-6 py-3 text-right text-[8px] font-black text-gray-400 uppercase tracking-widest">Pts</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-zinc-800 text-sm font-bold">
                    {sortedRanking.map((member, index) => {
                      const progress = totalMatches ? Math.round((member.predictedCount / totalMatches) * 100) : 0;
                      return (
                        <tr key={index} className={`${member.isMe ? 'bg-blue-600 text-white' : 'hover:bg-gray-50/50 dark:hover:bg-zinc-800/30'}`}>
                          <td className="px-6 py-5 w-12 text-center text-[10px] font-black">{index + 1}</td>
                          <td className="py-5 uppercase tracking-tighter">
                            <div className="flex flex-col">
                              <span className="truncate max-w-[120px]">{member.nickname}</span>
                              <span className={`text-[8px] font-black uppercase tracking-widest ${member.isMe ? 'text-blue-200' : progress === 100 ? 'text-green-500' : 'text-orange-500'}`}>
                                {progress}% Completo ({member.predictedCount})
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-5 text-right font-black text-lg">{member.points}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="lg:col-span-8 space-y-10">
            <div className="flex flex-col gap-8">
              <div className="flex p-1.5 bg-gray-100 dark:bg-zinc-900 rounded-2xl w-fit">
                <Link href={`/groups/${poolId}?view=today`} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${view === 'today' ? 'bg-white dark:bg-zinc-800 text-blue-600 shadow-md scale-105' : 'text-gray-400'}`}>Hoy</Link>
                <Link href={`/groups/${poolId}?view=groups&group=${selectedGroup}`} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${view === 'groups' ? 'bg-white dark:bg-zinc-800 text-blue-600 shadow-md scale-105' : 'text-gray-400'}`}>Grupos</Link>
              </div>
              {view === 'groups' && (
                <div className="flex flex-wrap gap-2">
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
          </div>
        </div>
      </div>
    </div>
  );
}
