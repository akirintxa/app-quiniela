import { createClient } from "@/utils/supabase/server";
import { Match, Prediction } from "@/types";
import MatchCard from "@/components/MatchCard";
import CopyInviteCode from "@/components/CopyInviteCode";
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

  // 1. Fetch All Members of this pool
  const { data: membersData } = await supabase
    .from('pool_members')
    .select(`user_id, profiles:user_id (nickname)`)
    .eq('pool_id', poolId);

  const memberIds = membersData?.map(m => m.user_id) || [];

  // 2. Fetch Total Points for these members
  const { data: totalPointsData } = await supabase
    .from('predictions')
    .select('user_id, points_won')
    .in('user_id', memberIds);

  // 3. Process Ranking
  const userMap: Record<string, { nickname: string, points: number, isMe: boolean }> = {};
  membersData?.forEach(m => {
    userMap[m.user_id] = { 
      nickname: (m.profiles as any)?.nickname || 'Usuario', 
      points: 0,
      isMe: m.user_id === user.id
    };
  });

  totalPointsData?.forEach(p => {
    if (userMap[p.user_id]) {
      userMap[p.user_id].points += p.points_won || 0;
    }
  });

  const sortedRanking = Object.values(userMap).sort((a, b) => b.points - a.points);

  // 4. Matches and Logic
  let query = supabase.from("matches").select(`*, team_a:teams!team_a_id(*), team_b:teams!team_b_id(*)`);
  if (view === "today") query = query.order("start_time", { ascending: true }).limit(12);
  else query = query.eq("group_id", selectedGroup).eq("stage", "group").order("start_time", { ascending: true });
  const { data: matches } = await query;

  const { data: myPredictions } = await supabase.from('predictions').select('*').eq('user_id', user.id);
  const groups = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"];

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-6xl mx-auto">
        <nav className="mb-10 flex flex-wrap justify-between items-center gap-4">
          <Link href="/groups" className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest flex items-center gap-2 hover:translate-x-[-4px] transition-all">
            ← Mis Ligas
          </Link>
          <CopyInviteCode code={pool.invite_code} />
        </nav>

        <header className="mb-16">
          <h1 className="text-6xl font-black text-gray-900 dark:text-white uppercase tracking-tighter leading-none">{pool.name}</h1>
          <p className="text-gray-400 font-bold uppercase text-[10px] tracking-[0.4em] mt-4">
            Competición Privada • {membersData?.length} Jugadores
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* LEFT: RANKING TABLE */}
          <div className="lg:col-span-4 space-y-8">
            <div className="sticky top-24">
              <h2 className="text-xs font-black uppercase tracking-[0.3em] text-gray-400 mb-6 flex items-center gap-4">
                Posiciones <div className="h-px flex-1 bg-gray-100 dark:bg-zinc-900"></div>
              </h2>
              <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] shadow-2xl border border-gray-100 dark:border-zinc-800 overflow-hidden">
                <table className="w-full text-left">
                  <tbody className="divide-y divide-gray-50 dark:divide-zinc-800 text-sm font-bold">
                    {sortedRanking.map((member, index) => (
                      <tr key={index} className={`${member.isMe ? 'bg-blue-600 text-white' : 'hover:bg-gray-50/50 dark:hover:bg-zinc-800/30'}`}>
                        <td className="px-6 py-5 w-12">
                          <span className={`w-8 h-8 flex items-center justify-center rounded-xl text-[10px] font-black ${
                            index === 0 && !member.isMe ? 'bg-yellow-400 text-yellow-950' : 
                            member.isMe ? 'bg-white/20 text-white' : 'bg-gray-50 dark:bg-zinc-800 text-gray-400'
                          }`}>
                            {index + 1}
                          </span>
                        </td>
                        <td className="py-5 uppercase tracking-tighter truncate max-w-[120px]">{member.nickname}</td>
                        <td className="px-6 py-5 text-right font-black text-lg">{member.points}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-6 text-[9px] font-black text-gray-400 uppercase tracking-widest text-center px-8 leading-relaxed opacity-50">
                Los puntos se actualizan automáticamente al finalizar cada partido
              </p>
            </div>
          </div>

          {/* RIGHT: MATCHES */}
          <div className="lg:col-span-8 space-y-10">
            <div className="flex flex-col gap-8">
              <div className="flex p-1.5 bg-gray-100 dark:bg-zinc-900 rounded-2xl w-fit">
                <Link href={`/groups/${poolId}?view=today`} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${view === 'today' ? 'bg-white dark:bg-zinc-800 text-blue-600 shadow-md scale-105' : 'text-gray-400 hover:text-gray-600'}`}>Hoy</Link>
                <Link href={`/groups/${poolId}?view=groups&group=${selectedGroup}`} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${view === 'groups' ? 'bg-white dark:bg-zinc-800 text-blue-600 shadow-md scale-105' : 'text-gray-400 hover:text-gray-600'}`}>Grupos</Link>
              </div>
              
              {view === 'groups' && (
                <div className="flex flex-wrap gap-2">
                  {groups.map(g => (
                    <Link key={g} href={`/groups/${poolId}?view=groups&group=${g}`} className={`w-10 h-10 flex items-center justify-center rounded-xl text-xs font-black transition-all ${selectedGroup === g ? 'bg-blue-600 text-white shadow-lg' : 'bg-white dark:bg-zinc-900 text-gray-400 border border-gray-100 dark:border-zinc-800 hover:border-blue-400'}`}>{g}</Link>
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
