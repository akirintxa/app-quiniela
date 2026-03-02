import { createClient } from "@/utils/supabase/server";
import MatchCard from "@/components/MatchCard";
import GroupStandings from "@/components/GroupStandings";
import { Match, Prediction, Team } from "@/types";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import RandomizeButton from "@/components/RandomizeButton";
import { calculateStandings } from "@/lib/standings";
import Navbar from "@/components/Navbar";

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

  const { data: allMatchesSummary } = await supabase.from("matches").select("id, group_id, stage").eq('is_finished', false);

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
  if (allMatchesSummary && user) {
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

  // Fetch matches for rendering
  let query = supabase.from("matches").select(`*, team_a:teams!team_a_id(*), team_b:teams!team_b_id(*)`);
  if (view === "today") query = query.eq("is_finished", false).order("start_time", { ascending: true }).limit(12);
  else if (view === "results") query = query.eq("is_finished", true).order("start_time", { ascending: false }).limit(24);
  else if (view === "groups") query = query.eq("group_id", selectedGroup).eq("stage", "group").order("start_time", { ascending: true });
  else if (view === "knockout") query = query.eq("stage", selectedStage).order("start_time", { ascending: true });
  const { data: matches } = await query;

  // CALCULATE STANDINGS IF VIEWING GROUP
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
  const stages = [
    { id: "round_32", name: "R32", status: "active" },
    { id: "round_16", name: "Octavos", status: "soon" },
    { id: "quarter_final", name: "Cuartos", status: "soon" },
    { id: "semi_final", name: "Semis", status: "soon" },
    { id: "final", name: "Final", status: "soon" }
  ];

  return (
    <>
      <Navbar />
      <div className="py-10 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-5xl mx-auto">
        <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="flex items-start gap-4 sm:gap-6">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20 transform -rotate-3">
              <span className="text-xl sm:text-2xl font-black text-white tracking-tighter">Q26</span>
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <span className="bg-blue-600 text-white px-2 py-0.5 text-[9px] font-black rounded uppercase tracking-widest">TORNEO</span>
                <h2 className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em]">Copa del Mundo</h2>
              </div>
              <h1 className="text-3xl sm:text-5xl font-black tracking-tighter text-gray-900 dark:text-white uppercase leading-none">FIFA COPA DEL MUNDO</h1>
            </div>
          </div>
          {user && (
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
          )}
        </header>

        <div className="flex flex-col gap-6 mb-10">
          <div className="flex p-1.5 bg-gray-100 dark:bg-zinc-900 rounded-2xl w-fit self-center sm:self-start overflow-x-auto shadow-sm">
            <Link href="/?view=today" className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${view === 'today' ? 'bg-white dark:bg-zinc-800 text-blue-600 shadow-md scale-105' : 'text-gray-400'}`}>Próximos</Link>
            <Link href="/?view=results" className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${view === 'results' ? 'bg-white dark:bg-zinc-800 text-blue-600 shadow-md scale-105' : 'text-gray-400'}`}>Resultados</Link>
            <Link href={`/?view=groups&group=${selectedGroup}`} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${view === 'groups' ? 'bg-white dark:bg-zinc-800 text-blue-600 shadow-md scale-105' : 'text-gray-400'}`}>Grupos</Link>
            {/* <Link href={`/?view=knockout&stage=${selectedStage}`} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${view === 'knockout' ? 'bg-white dark:bg-zinc-800 text-blue-600 shadow-md scale-105' : 'text-gray-400'}`}>Fase Final</Link> */}
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
          ) : (
            <div className="text-center py-24 bg-white dark:bg-zinc-900 rounded-[3.5rem] border-2 border-dashed border-gray-100 dark:border-zinc-800 shadow-inner">
              <p className="text-xs font-black text-gray-300 dark:text-zinc-700 uppercase tracking-[0.3em]">Etapa no disponible</p>
            </div>
          )}
        </section>
      </div>
    </div>
    </>
  );
}
