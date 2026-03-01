import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Ranking Global | FIFA 2026",
};

export default async function RankingPage({
  searchParams,
}: {
  searchParams: Promise<{ pool?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const resolvedSearchParams = await searchParams;
  const selectedPoolId = resolvedSearchParams.pool;

  // 1. Fetch user's pools for the tabs
  let myPools: any[] = [];
  if (user) {
    const { data } = await supabase
      .from('pool_members')
      .select('pool_id, pools (name)')
      .eq('user_id', user.id);
    if (data) myPools = data;
  }

  // 2. Fetch Ranking Data
  let query = supabase.from('predictions').select('user_id, points_won, profiles:user_id (nickname)');
  
  if (selectedPoolId) {
    // Filter by pool members
    const { data: members } = await supabase.from('pool_members').select('user_id').eq('pool_id', selectedPoolId);
    if (members) {
      query = query.in('user_id', members.map(m => m.user_id));
    }
  }

  const { data: rankingData } = await query;

  const userMap: Record<string, { nickname: string, points: number, isMe: boolean }> = {};
  rankingData?.forEach((pred: any) => {
    const id = pred.user_id;
    const points = pred.points_won || 0;
    const nickname = pred.profiles?.nickname || `Usuario #${id.substring(0, 5)}`;
    if (!userMap[id]) userMap[id] = { nickname, points: 0, isMe: id === user?.id };
    userMap[id].points += points;
  });

  const sortedRanking = Object.values(userMap).sort((a, b) => b.points - a.points);

  return (
    <div className="py-10 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-4xl mx-auto">
        <header className="mb-10 text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start gap-3 mb-2">
            <span className="bg-blue-600 text-white px-2 py-0.5 text-[10px] font-black rounded uppercase tracking-widest">Competición</span>
            <h2 className="text-[10px] text-gray-400 font-black uppercase tracking-[0.3em]">Tablas de Posiciones</h2>
          </div>
          <h1 className="text-5xl font-black tracking-tighter text-gray-900 dark:text-white uppercase leading-none">
            HALL OF <span className="text-blue-600 dark:text-blue-500">FAME</span>
          </h1>
        </header>

        {/* TABS FOR DIFFERENT RANKINGS */}
        {user && (
          <div className="flex flex-wrap gap-2 mb-8 p-1.5 bg-gray-100 dark:bg-zinc-900 rounded-2xl w-fit">
            <Link 
              href="/ranking" 
              className={`px-6 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${!selectedPoolId ? 'bg-white dark:bg-zinc-800 text-blue-600 shadow-sm' : 'text-gray-400'}`}
            >
              Global
            </Link>
            {myPools.map(p => (
              <Link 
                key={p.pool_id}
                href={`/ranking?pool=${p.pool_id}`} 
                className={`px-6 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${selectedPoolId === p.pool_id ? 'bg-white dark:bg-zinc-800 text-blue-600 shadow-sm' : 'text-gray-400'}`}
              >
                {p.pools.name}
              </Link>
            ))}
          </div>
        )}

        {/* Scoring Rules (Mini) */}
        <div className="mb-8 grid grid-cols-3 gap-2">
          <div className="bg-white dark:bg-zinc-900 p-3 rounded-2xl border border-gray-100 dark:border-zinc-800 text-center">
            <span className="text-xs font-black text-blue-600 block">+1</span>
            <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Resultado</span>
          </div>
          <div className="bg-white dark:bg-zinc-900 p-3 rounded-2xl border border-gray-100 dark:border-zinc-800 text-center">
            <span className="text-xs font-black text-gray-400 block">+1</span>
            <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Goles A</span>
          </div>
          <div className="bg-white dark:bg-zinc-900 p-3 rounded-2xl border border-gray-100 dark:border-zinc-800 text-center">
            <span className="text-xs font-black text-gray-400 block">+1</span>
            <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Goles B</span>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] shadow-2xl border border-gray-100 dark:border-zinc-800 overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 dark:bg-zinc-800/50">
                <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-gray-400">Pos</th>
                <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-gray-400">Jugador</th>
                <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-gray-400 text-right">Pts</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-zinc-800">
              {sortedRanking.length > 0 ? (
                sortedRanking.map((member, index) => (
                  <tr key={index} className={`${member.isMe ? 'bg-blue-600 text-white' : 'hover:bg-gray-50/50 dark:hover:bg-zinc-800/30'}`}>
                    <td className="px-6 py-5 w-16">
                      <span className={`w-8 h-8 flex items-center justify-center rounded-xl text-[10px] font-black ${
                        index === 0 && !member.isMe ? 'bg-yellow-400 text-yellow-950 shadow-lg shadow-yellow-400/20' : 
                        member.isMe ? 'bg-white/20 text-white' : 'bg-gray-50 dark:bg-zinc-800 text-gray-400'
                      }`}>
                        {index + 1}
                      </span>
                    </td>
                    <td className="py-5 font-black text-sm uppercase tracking-tighter">{member.nickname}</td>
                    <td className="px-6 py-5 text-right font-black text-xl tracking-tighter">{member.points}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="px-8 py-20 text-center text-gray-400 text-xs font-black uppercase tracking-widest opacity-50">Esperando el pitido inicial...</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
