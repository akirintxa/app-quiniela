import { createClient } from "@/utils/supabase/server";
import MatchCard from "@/components/MatchCard";
import { Match, Prediction } from "@/types";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import { updateNickname } from "./actions";
import RandomizeButton from "@/components/RandomizeButton";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ group?: string; view?: string; stage?: string }>;
}) {
  const supabase = await createClient();
  const resolvedSearchParams = await searchParams;
  const view = resolvedSearchParams.view || "today";
  const selectedGroup = resolvedSearchParams.group || "A";
  const selectedStage = resolvedSearchParams.stage || "round_32";

  const { data: { user } } = await supabase.auth.getUser();

  const { data: allMatches } = await supabase.from("matches").select("id, group_id, stage").eq('is_finished', false);

  let predictions: Prediction[] = [];
  let userStats = { points: 0, rank: 0 };

  if (user) {
    const { data: userPreds } = await supabase.from("predictions").select("*").eq("user_id", user.id);
    if (userPreds) {
      predictions = userPreds;
      userStats.points = userPreds.reduce((acc, curr) => acc + (curr.points_won || 0), 0);
    }
    const { data: allPoints } = await supabase.from('predictions').select('user_id, points_won');
    if (allPoints) {
      const globalScores: Record<string, number> = {};
      allPoints.forEach(p => {
        globalScores[p.user_id] = (globalScores[p.user_id] || 0) + (p.points_won || 0);
      });
      const sortedScores = Object.values(globalScores).sort((a, b) => b - a);
      userStats.rank = sortedScores.indexOf(userStats.points) + 1;
    }
  }

  const groupCompletion: Record<string, boolean> = {};
  if (allMatches && user) {
    const groupMap: Record<string, { total: number, predicted: number }> = {};
    allMatches.forEach(m => {
      if (m.stage === 'group') {
        const gid = m.group_id || 'unknown';
        if (!groupMap[gid]) groupMap[gid] = { total: 0, predicted: 0 };
        groupMap[gid].total++;
        if (predictions.some(p => p.match_id === m.id)) groupMap[gid].predicted++;
      }
    });
    Object.keys(groupMap).forEach(gid => {
      groupCompletion[gid] = groupMap[gid].predicted === groupMap[gid].total;
    });
  }

  let query = supabase.from("matches").select(`*, team_a:teams!team_a_id(*), team_b:teams!team_b_id(*)`);
  if (view === "today") query = query.order("start_time", { ascending: true }).limit(12);
  else if (view === "groups") query = query.eq("group_id", selectedGroup).eq("stage", "group").order("start_time", { ascending: true });
  else if (view === "knockout") query = query.eq("stage", selectedStage).order("start_time", { ascending: true });
  const { data: matches } = await query;

  const groupedMatches: Record<string, Match[]> = {};
  if (view === "today" && matches) {
    matches.forEach(match => {
      const date = new Date(match.start_time).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
      if (!groupedMatches[date]) groupedMatches[date] = [];
      groupedMatches[date].push(match);
    });
  }

  const groups = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"];
  const stages = [
    { id: "round_32", name: "R32", status: "active" },
    { id: "round_16", name: "Octavos", status: "soon" },
    { id: "quarter_final", name: "Cuartos", status: "soon" },
    { id: "semi_final", name: "Semis", status: "soon" },
    { id: "final", name: "Final", status: "soon" }
  ];

  return (
    <div className="py-10 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-5xl mx-auto">
        <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="flex items-start gap-6">
            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20 transform -rotate-3">
              <span className="text-2xl font-black text-white tracking-tighter">Q26</span>
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <span className="bg-blue-600 text-white px-2 py-0.5 text-[9px] font-black rounded uppercase tracking-widest">TORNEO</span>
                <h2 className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em]">Copa del Mundo</h2>
              </div>
              <h1 className="text-5xl font-black tracking-tighter text-gray-900 dark:text-white uppercase leading-none">
                FIFA <span className="text-blue-600">COPA DEL MUNDO</span>
              </h1>
            </div>

          </div>
          {user && (
            <div className="bg-white dark:bg-zinc-900 px-6 py-4 rounded-[2rem] shadow-xl border border-gray-100 dark:border-zinc-800 flex items-center gap-6">
              <div className="text-center">
                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">Tu Puntuación</span>
                <span className="text-2xl font-black text-blue-600 leading-none">{userStats.points}</span>
              </div>
              <div className="w-px h-8 bg-gray-100 dark:bg-zinc-800"></div>
              <div className="text-center">
                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">Ranking Global</span>
                <span className="text-2xl font-black text-gray-900 dark:text-white leading-none">#{userStats.rank || '--'}</span>
              </div>
            </div>
          )}
        </header>

        {user && !user.user_metadata?.nickname && (
          <div className="mb-10 p-6 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl shadow-lg text-white relative overflow-hidden">
             <div className="relative z-10">
              <h3 className="text-xl font-black mb-1 uppercase tracking-tighter">¡Bienvenido! 🚀</h3>
              <p className="text-blue-100 mb-4 font-bold uppercase text-[9px] tracking-widest opacity-80">Elige tu apodo para competir</p>
              {/* Form wrapper to fix TS void return type error */}
              <form action={async (formData) => {
                'use server';
                await updateNickname(formData);
              }} className="flex flex-col sm:flex-row gap-3">
                <input name="nickname" type="text" placeholder="TU APODO" className="flex-1 max-w-xs rounded-xl px-5 py-3 bg-white/10 border border-white/20 text-white outline-none font-black uppercase text-sm" required />
                <button className="bg-white text-blue-700 px-8 py-3 rounded-xl font-black hover:bg-blue-50 transition-all active:scale-95 uppercase text-[10px] tracking-widest">Listo</button>
              </form>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-6 mb-10">
          <div className="flex p-1.5 bg-gray-100 dark:bg-zinc-900 rounded-2xl w-fit self-center sm:self-start overflow-x-auto shadow-sm">
            <Link href="/?view=today" className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${view === 'today' ? 'bg-white dark:bg-zinc-800 text-blue-600 shadow-sm' : 'text-gray-400'}`}>Próximos</Link>
            <Link href={`/?view=groups&group=${selectedGroup}`} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${view === 'groups' ? 'bg-white dark:bg-zinc-800 text-blue-600 shadow-sm' : 'text-gray-400'}`}>Fase de Grupos</Link>
            <Link href={`/?view=knockout&stage=${selectedStage}`} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${view === 'knockout' ? 'bg-white dark:bg-zinc-800 text-blue-600 shadow-sm' : 'text-gray-400'}`}>Eliminatorias</Link>
          </div>

          {view === 'groups' && (
            <div className="flex flex-wrap items-center gap-3 justify-center sm:justify-start animate-in fade-in slide-in-from-top-2">
              <div className="flex flex-wrap gap-2">
                {groups.map(g => (
                  <Link key={g} href={`/?view=groups&group=${g}`} className={`relative w-10 h-10 flex items-center justify-center rounded-xl text-[10px] font-black transition-all ${selectedGroup === g ? 'bg-blue-600 text-white shadow-md' : 'bg-white dark:bg-zinc-900 text-gray-400 border border-gray-100 dark:border-zinc-800'}`}>
                    {g}
                    {user && groupCompletion[g] === false && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-orange-500 border-2 border-white dark:border-black rounded-full shadow-sm"></span>}
                    {user && groupCompletion[g] === true && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-500 border-2 border-white dark:border-black rounded-full shadow-sm flex items-center justify-center"><svg xmlns="http://www.w3.org/2000/svg" width="6" height="6" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg></span>}
                  </Link>
                ))}
              </div>
              <div className="hidden sm:block w-px h-6 bg-gray-100 dark:bg-zinc-800 mx-2"></div>
              {user && <RandomizeButton groupId={selectedGroup} />}
            </div>
          )}

          {view === 'knockout' && (
            <div className="flex flex-wrap gap-2 justify-center sm:justify-start animate-in fade-in slide-in-from-top-2">
              {stages.map(s => (
                s.status === "active" ? (
                  <Link key={s.id} href={`/?view=knockout&stage=${s.id}`} className={`px-4 py-2 flex items-center justify-center rounded-xl text-[10px] font-black transition-all ${selectedStage === s.id ? 'bg-blue-600 text-white shadow-md' : 'bg-white dark:bg-zinc-900 text-gray-400 border border-gray-100 dark:border-zinc-800'}`}>{s.name}</Link>
                ) : (
                  <div key={s.id} className="px-4 py-2 bg-gray-50 dark:bg-zinc-900/50 text-gray-300 dark:text-zinc-700 rounded-xl text-[10px] font-black uppercase tracking-widest border border-dashed border-gray-200 dark:border-zinc-800 cursor-not-allowed">
                    {s.name} <span className="text-[8px] ml-1 opacity-50 uppercase tracking-tighter">Soon</span>
                  </div>
                )
              ))}
            </div>
          )}
        </div>

        <section className="space-y-10">
          {view === "today" ? (
            Object.entries(groupedMatches).map(([date, dayMatches]) => (
              <div key={date} className="space-y-6">
                <div className="flex items-center gap-4 text-gray-400">
                  <h2 className="text-[10px] font-black uppercase tracking-[0.4em] whitespace-nowrap">{date}</h2>
                  <div className="h-px flex-1 bg-gray-100 dark:bg-zinc-900"></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {dayMatches.map((match) => (
                    <MatchCard key={match.id} match={match} userId={user?.id} initialPrediction={predictions.find(p => p.match_id === match.id)} />
                  ))}
                </div>
              </div>
            ))
          ) : matches && matches.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {matches.map((match) => (
                <MatchCard key={match.id} match={match} userId={user?.id} initialPrediction={predictions.find(p => p.match_id === match.id)} />
              ))}
            </div>
          ) : (
            <div className="text-center py-24 bg-white dark:bg-zinc-900 rounded-[3.5rem] border-2 border-dashed border-gray-100 dark:border-zinc-800 shadow-inner">
              <p className="text-xs font-black text-gray-300 dark:text-zinc-700 uppercase tracking-[0.3em]">Etapa no disponible</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
