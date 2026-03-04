import { createClient } from "@/utils/supabase/server";
import MatchCard from "@/components/MatchCard";
import GroupStandings from "@/components/GroupStandings";
import { Match, Prediction, Team } from "@/types";
import Link from "next/link";
import { calculateStandings } from "@/lib/standings";
import HomeTabsHandler from "@/components/HomeTabsHandler";
import { Suspense } from "react";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ group?: string; view?: string; stage?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const resolvedSearchParams = await searchParams;

  // --- LANDING PAGE FOR NON-LOGGED USERS ---
  if (!user) {
    return (
      <div className="min-h-[calc(100vh-80px)] flex flex-col font-sans overflow-hidden bg-white dark:bg-black">
        {/* HERO SECTION */}
        <section className="relative pt-20 pb-32 px-6 overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-6xl pointer-events-none">
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full animate-pulse"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-400/10 blur-[120px] rounded-full"></div>
          </div>

          <div className="max-w-5xl mx-auto text-center relative z-10">
            <div className="inline-flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 px-4 py-2 rounded-full mb-8 border border-blue-100 dark:border-blue-800/30 animate-in fade-in slide-in-from-top-4 duration-700">
              <span className="w-2 h-2 bg-blue-600 rounded-full animate-ping"></span>
              <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400">Mundial 2026</span>
            </div>
            
            <h1 className="text-5xl sm:text-8xl font-black tracking-tighter text-gray-900 dark:text-white uppercase leading-[0.9] mb-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
              DOMINA <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-400">LA QUINIELA</span>
            </h1>
            
            <p className="max-w-xl mx-auto text-sm sm:text-lg font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-tight mb-12 leading-tight">
              Crea ligas privadas, compite con tus amigos y demuestra quien más sabe de fútbol en el Mundial 2026.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in fade-in zoom-in duration-1000 delay-300">
              <Link href="/login" className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-10 py-5 rounded-[2rem] font-black uppercase tracking-widest text-xs shadow-2xl shadow-blue-500/40 transition-all hover:scale-105 active:scale-95">
                Empezar a Jugar
              </Link>
              <Link href="/ranking?pool=all" className="w-full sm:w-auto bg-gray-100 dark:bg-zinc-900 text-gray-900 dark:text-white px-10 py-5 rounded-[2rem] font-black uppercase tracking-widest text-xs border border-gray-200 dark:border-zinc-800 transition-all hover:bg-gray-200 dark:hover:bg-zinc-800">
                Ver Ranking Live
              </Link>
            </div>
          </div>
        </section>

        {/* FEATURES GRID */}
        <section className="py-24 px-6 bg-gray-50/50 dark:bg-zinc-950/50 border-y border-gray-100 dark:border-zinc-900">
          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white dark:bg-zinc-900 p-10 rounded-[3rem] shadow-xl border border-gray-100 dark:border-zinc-800 transform transition-all hover:-translate-y-2">
              <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center mb-8 shadow-lg shadow-blue-500/20">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              </div>
              <h3 className="text-xl font-black uppercase tracking-tighter mb-4">Ligas Privadas</h3>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-tight leading-relaxed">Crea grupos exclusivos para tu oficina, familia o amigos con códigos de invitación únicos.</p>
            </div>

            <div className="bg-white dark:bg-zinc-900 p-10 rounded-[3rem] shadow-xl border border-gray-100 dark:border-zinc-800 transform transition-all hover:-translate-y-2">
              <div className="w-14 h-14 bg-green-500 rounded-2xl flex items-center justify-center mb-8 shadow-lg shadow-green-500/20">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></svg>
              </div>
              <h3 className="text-xl font-black uppercase tracking-tighter mb-4">Estadísticas Pro</h3>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-tight leading-relaxed">Analiza tu efectividad, plenos y tendencias con nuestro nuevo panel de rendimiento avanzado.</p>
            </div>

            <div className="bg-white dark:bg-zinc-900 p-10 rounded-[3rem] shadow-xl border border-gray-100 dark:border-zinc-800 transform transition-all hover:-translate-y-2">
              <div className="w-14 h-14 bg-orange-500 rounded-2xl flex items-center justify-center mb-8 shadow-lg shadow-orange-500/20">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m12 14 4-4 4 4-4 4-4-4Z"/><path d="M3.34 19a10 10 0 1 1 17.32 0"/></svg>
              </div>
              <h3 className="text-xl font-black uppercase tracking-tighter mb-4">Ayuda Inteligente</h3>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-tight leading-relaxed">¿Sin tiempo? Usa "Una ayudaíta" para generar predicciones basadas en datos en un solo click.</p>
            </div>
          </div>
        </section>

        {/* FOOTER MINI */}
        <footer className="py-12 text-center border-t border-gray-100 dark:border-zinc-900 bg-white dark:bg-black">
          <p className="text-[10px] font-black text-gray-300 dark:text-zinc-700 uppercase tracking-[0.5em]">Q26 — Quiniela 2026</p>
        </footer>
      </div>
    );
  }

  // --- ORIGINAL DASHBOARD LOGIC (For Logged Users) ---
  const view = resolvedSearchParams.view || "groups";
  const selectedGroup = resolvedSearchParams.group || "A";
  const selectedStage = resolvedSearchParams.stage || "round_32";

  const { data: allMatchesSummary } = await supabase.from("matches").select("id, group_id, stage").eq('is_finished', false);

  let predictions: Prediction[] = [];
  let userStats = { points: 0, rank: 0 };

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

  const groupCompletion: Record<string, boolean> = {};
  if (allMatchesSummary) {
    const groupMap: Record<string, { total: number, predicted: number }> = {};
    allMatchesSummary.forEach(m => {
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
  if (view === "today") query = query.eq("is_finished", false).order("start_time", { ascending: true }).limit(12);
  else if (view === "results") query = query.eq("is_finished", true).order("start_time", { ascending: false }).limit(24);
  else if (view === "groups") query = query.eq("group_id", selectedGroup).eq("stage", "group").order("start_time", { ascending: true });
  else if (view === "knockout") query = query.eq("stage", selectedStage).order("start_time", { ascending: true });
  const { data: matches } = await query;

  let groupTeams: Team[] = [];
  let standings: any[] = [];
  if (view === "groups" && matches) {
    const teamMap = new Map();
    matches.forEach(m => {
      if (m.team_a) teamMap.set(m.team_a.id, m.team_a);
      if (m.team_b) teamMap.set(m.team_b.id, m.team_b);
    });
    groupTeams = Array.from(teamMap.values());
    standings = calculateStandings(matches as Match[], groupTeams);
  }

  const groupedMatches: Record<string, Match[]> = {};
  if ((view === "today" || view === "results") && matches) {
    matches.forEach(match => {
      const date = new Date(match.start_time).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
      if (!groupedMatches[date]) groupedMatches[date] = [];
      groupedMatches[date].push(match);
    });
  }

  const groups = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"];

  return (
    <div className="py-10 px-4 sm:px-6 lg:px-8 font-sans">
      <Suspense fallback={null}><HomeTabsHandler /></Suspense>
      <div className="max-w-5xl mx-auto">
        <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6 text-center sm:text-left">
          <div>
            <div className="flex items-center justify-center sm:justify-start gap-3 mb-2">
              <span className="bg-blue-600 text-white px-2 py-0.5 text-[10px] font-black rounded uppercase tracking-widest">MUNDIAL 2026</span>
              <h2 className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em]">Predicciones & Resultados</h2>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tighter text-gray-900 dark:text-white uppercase leading-none">MIS <span className="text-blue-600">PREDICCIONES</span></h1>
          </div>

          <div className="bg-white dark:bg-zinc-900 px-4 sm:px-6 py-4 rounded-[2rem] shadow-xl border border-gray-100 dark:border-zinc-800 flex items-center justify-around sm:justify-start gap-4 sm:gap-6">
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
        </header>

        <div className="flex flex-col gap-6 mb-10">
          <div className="flex p-1.5 bg-gray-100 dark:bg-zinc-900 rounded-2xl w-fit self-center sm:self-start overflow-x-auto shadow-sm">
            <Link href={`/?view=groups&group=${selectedGroup}`} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${view === 'groups' ? 'bg-white dark:bg-zinc-800 text-blue-600 shadow-md scale-105' : 'text-gray-400'}`}>Grupos</Link>
            <Link href="/?view=today" className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${view === 'today' ? 'bg-white dark:bg-zinc-800 text-blue-600 shadow-md scale-105' : 'text-gray-400'}`}>Próximos</Link>
            <Link href="/?view=results" className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${view === 'results' ? 'bg-white dark:bg-zinc-800 text-blue-600 shadow-md scale-105' : 'text-gray-400'}`}>Resultados</Link>
          </div>

          {view === 'groups' && (
            <div className="flex flex-col sm:flex-row items-center gap-4 justify-center sm:justify-start animate-in fade-in slide-in-from-top-2">
              <div className="grid grid-cols-6 sm:flex sm:flex-wrap gap-2 w-full sm:w-auto">
                {groups.map(g => (
                  <Link key={g} href={`/?view=groups&group=${g}`} className={`relative w-full aspect-square sm:w-10 sm:h-10 flex items-center justify-center rounded-xl text-[10px] font-black transition-all ${selectedGroup === g ? 'bg-blue-600 text-white shadow-md' : 'bg-white dark:bg-zinc-900 text-gray-400 border border-gray-100 dark:border-zinc-800'}`}>
                    {g}
                    {groupCompletion[g] === false && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-orange-500 border-2 border-white dark:border-black rounded-full shadow-sm"></span>}
                    {groupCompletion[g] === true && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-500 border-2 border-white dark:border-black rounded-full shadow-sm flex items-center justify-center"><svg xmlns="http://www.w3.org/2000/svg" width="6" height="6" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg></span>}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        <section className="space-y-10">
          {view === "groups" && standings.length > 0 && (
            <div className="animate-in fade-in zoom-in duration-500">
              <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400 mb-4 px-2 italic">Clasificación Grupo {selectedGroup}</h2>
              <GroupStandings stats={standings} />
            </div>
          )}

          {(view === "today" || view === "results") ? (
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
          ) : null}
        </section>
      </div>
    </div>
  );
}
