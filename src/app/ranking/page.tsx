import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import RealtimeRankingListener from "@/components/RealtimeRankingListener";

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

  // ... (rest of data fetching logic)

  const { data: myPools } = await supabase
    .from('pool_members')
    .select('pool_id, pools (name)')
    .eq('user_id', user.id);

  // 2. Fetch ALL relevant players first
  let targetUserIds: string[] = [];
  
  if (selectedPoolId) {
    // Mode: Pool Ranking - Only members of this pool
    const { data: members } = await supabase
      .from('pool_members')
      .select('user_id')
      .eq('pool_id', Number(selectedPoolId));
    if (members) targetUserIds = members.map(m => m.user_id);
  } else {
    // Mode: Global Ranking - All users with a profile
    const { data: allProfiles } = await supabase.from('profiles').select('id');
    if (allProfiles) targetUserIds = allProfiles.map(p => p.id);
  }

  // 3. Fetch Profiles (with Avatars and Teams) and Predictions for these users
  const { data: profilesData } = await supabase
    .from('profiles')
    .select('id, nickname, avatar_url, teams:favorite_team_id (iso_code)')
    .in('id', targetUserIds);

  const { data: predictionsData } = await supabase
    .from('predictions')
    .select('user_id, points_won')
    .in('user_id', targetUserIds);

  // 4. Process Ranking
  const userMap: Record<string, { nickname: string, avatar: string, flag: string | null, points: number, isMe: boolean }> = {};
  
  // Initialize with all target users
  profilesData?.forEach(p => {
    userMap[p.id] = { 
      nickname: p.nickname || 'Usuario', 
      avatar: p.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.id}`,
      flag: (p.teams as any)?.iso_code || null,
      points: 0, 
      isMe: p.id === user.id 
    };
  });

  // Add points
  predictionsData?.forEach(pred => {
    if (userMap[pred.user_id]) {
      userMap[pred.user_id].points += pred.points_won || 0;
    }
  });

  const sortedRanking = Object.values(userMap).sort((a, b) => b.points - a.points);

  const getFlagUrl = (iso: string) => {
    if (!iso) return null;
    const cleanIso = iso.toLowerCase();
    if (cleanIso === 'gb-sct') return `https://flagcdn.com/w40/gb-sct.png`;
    if (cleanIso === 'gb-eng') return `https://flagcdn.com/w40/gb-eng.png`;
    if (cleanIso === 'gb-wls') return `https://flagcdn.com/w40/gb-wls.png`;
    return `https://flagcdn.com/w40/${cleanIso}.png`;
  };

  return (
    <div className="py-10 px-4 sm:px-6 lg:px-8 font-sans">
      <RealtimeRankingListener />
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

        {/* TABS */}
        <div className="flex flex-wrap gap-2 mb-8 p-1.5 bg-gray-100 dark:bg-zinc-900 rounded-2xl w-fit">
          <Link 
            href="/ranking" 
            className={`px-6 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${!selectedPoolId ? 'bg-white dark:bg-zinc-800 text-blue-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
          >
            Global
          </Link>
          {myPools?.map(p => (
            <Link 
              key={p.pool_id}
              href={`/ranking?pool=${p.pool_id}`} 
              className={`px-6 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${selectedPoolId === String(p.pool_id) ? 'bg-white dark:bg-zinc-800 text-blue-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
            >
              {(p.pools as any)?.name}
            </Link>
          ))}
        </div>

        {/* Scoring Mini-rules */}
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
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-zinc-800/50">
                <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-gray-400 w-16 text-center">Pos</th>
                <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-gray-400">Jugador</th>
                <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-gray-400 text-right">Pts</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-zinc-800">
              {sortedRanking.length > 0 ? (
                sortedRanking.map((member, index) => (
                  <tr key={index} className={`${member.isMe ? 'bg-blue-600 text-white' : 'hover:bg-gray-50/50 dark:hover:bg-zinc-800/30'}`}>
                    <td className="px-6 py-5 w-16 text-center">
                      <span className={`w-8 h-8 inline-flex items-center justify-center rounded-xl text-[10px] font-black ${
                        index === 0 && !member.isMe ? 'bg-yellow-400 text-yellow-950 shadow-lg shadow-yellow-400/20' : 
                        member.isMe ? 'bg-white/20 text-white' : 'bg-gray-50 dark:bg-zinc-800 text-gray-400'
                      }`}>
                        {index + 1}
                      </span>
                    </td>
                    <td className="py-5 pr-6">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl overflow-hidden border-2 flex-shrink-0 ${member.isMe ? 'border-white/30' : 'border-gray-100 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-800'}`}>
                          <img src={member.avatar} alt={member.nickname} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className="font-black text-sm uppercase tracking-tighter">{member.nickname}</span>
                            {member.flag && (
                              <img 
                                src={getFlagUrl(member.flag) || ""} 
                                alt="fav team" 
                                className="w-4 h-3 object-cover rounded-[2px] opacity-80 shadow-sm"
                                title="Equipo Favorito"
                              />
                            )}
                          </div>
                          {member.isMe && <span className="text-[8px] font-black uppercase tracking-widest opacity-60">Tú</span>}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-right font-black text-xl tracking-tighter">{member.points}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="px-8 py-20 text-center text-gray-400 text-xs font-black uppercase tracking-widest opacity-50">No hay jugadores registrados todavía</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
