import { createClient } from "@/utils/supabase/server";
import MatchCard from "@/components/MatchCard";
import GroupStandings from "@/components/GroupStandings";
import RandomizeButton from "@/components/RandomizeButton";
import RealtimeRankingListener from "@/components/RealtimeRankingListener";
import { Match, Prediction, Team } from "@/types";
import Link from "next/link";
import { calculateStandings } from "@/lib/standings";
import { buildKnockoutViewModels, getCompletedGroups, resolveKnockoutTeams } from "@/lib/knockout";
import HomeTabsHandler from "@/components/HomeTabsHandler";
import KnockoutStageBoard from "@/components/knockout/KnockoutStageBoard";
import { KnockoutMatchViewModel } from "@/types/knockout";
import { Suspense } from "react";
import ScoringRulesButton from "@/components/ScoringRulesButton";
import { getUserGlobalRankStats } from "@/lib/global-ranking";

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
              <p className="text-xs font-bold text-gray-400 uppercase tracking-tight leading-relaxed">Crea ligas exclusivas para tu oficina, familia o amigos con códigos de invitación únicos.</p>
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
              <p className="text-xs font-bold text-gray-400 uppercase tracking-tight leading-relaxed">¿Sin tiempo? Usa &quot;Una ayudaíta&quot; para generar predicciones basadas en datos en un solo click.</p>
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
  const rawStage = resolvedSearchParams.stage || "round_32";
  const selectedStage = rawStage === "bracket" ? "round_32" : rawStage;

  const { data: allMatchesSummary } = await supabase.from("matches").select("id, group_id, stage").eq('is_finished', false);

  let predictions: Prediction[] = [];
  let userStats = { points: 0, rank: 0, bonusPoints: 0 };

  const { data: userPreds } = await supabase.from("predictions").select("*").eq("user_id", user.id);
  if (userPreds) predictions = userPreds;

  const rankStats = await getUserGlobalRankStats(supabase, user.id);
  userStats.points = rankStats.points;
  userStats.bonusPoints = rankStats.bonusPoints;
  userStats.rank = rankStats.rank;

  const groupCompletion: Record<string, boolean> = {};
  const allGroups = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"];
  allGroups.forEach(gid => groupCompletion[gid] = false);

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

  const incompleteGroups = allGroups.filter(gid => !groupCompletion[gid]);
  const allGroupsComplete = incompleteGroups.length === 0;

  // --- FETCH DATA FOR RESOLUTION ---
  const { data: allTeams } = await supabase.from("teams").select("*");
  const { data: allGroupMatches } = await supabase.from("matches").select("*, team_a:teams!team_a_id(*), team_b:teams!team_b_id(*)").eq("stage", "group");
  const { data: allKnockoutMatches } = await supabase.from("matches").select("*, team_a:teams!team_a_id(*), team_b:teams!team_b_id(*)").neq("stage", "group");

  const completedGroupsCount = allGroupMatches
    ? getCompletedGroups(allGroupMatches as Match[], predictions).size
    : 0;

  // --- KNOCKOUT STAGE-BY-STAGE COMPLETION ---
  // Each stage requires all matches of the previous stage to be predicted.
  const knockoutStageOrder = ['round_32', 'round_16', 'quarter_final', 'semi_final', 'final'];
  const knockoutStageLabels: Record<string, string> = {
    round_32: 'Dieciseisavos',
    round_16: 'Octavos',
    quarter_final: 'Cuartos',
    semi_final: 'Semis',
    final: 'Final',
  };
  // Whether ALL matches in each stage have a prediction (or are already finished)
  const knockoutStageComplete: Record<string, boolean> = {};
  if (allGroupsComplete && allKnockoutMatches) {
    knockoutStageOrder.forEach(stage => {
      const stageMatches = (allKnockoutMatches as Match[]).filter(m => m.stage === stage);
      knockoutStageComplete[stage] = stageMatches.length > 0 &&
        stageMatches.every(m => m.is_finished || predictions.some(p => p.match_id === m.id));
    });
  }
  // Is the currently selected stage accessible?
  const selectedStageIdx = knockoutStageOrder.indexOf(selectedStage);
  const isSelectedStageAccessible = true;
  // Previous stage info for the "locked" empty state
  const prevStageName = selectedStageIdx > 0 ? knockoutStageOrder[selectedStageIdx - 1] : null;
  const incompletePrevStageCount =
    prevStageName && allKnockoutMatches
      ? (allKnockoutMatches as Match[]).filter(
          m => m.stage === prevStageName && !m.is_finished && !predictions.some(p => p.match_id === m.id)
        ).length
      : 0;

  let matches: Match[] = [];
  let knockoutViewModels: KnockoutMatchViewModel[] = [];

  if (view === "today") {
    const { data } = await supabase.from("matches").select(`*, team_a:teams!team_a_id(*), team_b:teams!team_b_id(*)`).eq("is_finished", false).order("start_time", { ascending: true }).limit(12);
    matches = (data || []) as Match[];
  } else if (view === "results") {
    const { data } = await supabase.from("matches").select(`*, team_a:teams!team_a_id(*), team_b:teams!team_b_id(*)`).eq("is_finished", true).order("start_time", { ascending: false }).limit(24);
    matches = (data || []) as Match[];
  } else if (view === "groups") {
    const { data } = await supabase.from("matches").select(`*, team_a:teams!team_a_id(*), team_b:teams!team_b_id(*)`).eq("group_id", selectedGroup).eq("stage", "group").order("start_time", { ascending: true });
    matches = (data || []) as Match[];
  } else if (view === "knockout" && allKnockoutMatches && allGroupMatches && allTeams) {
    const allKnockoutVm = buildKnockoutViewModels(
      allKnockoutMatches as Match[],
      allGroupMatches as Match[],
      predictions,
      allTeams as Team[]
    );

    knockoutViewModels =
      selectedStage === "final"
        ? allKnockoutVm.filter(
            (vm) => vm.match.stage === "final" || vm.match.stage === "third_place"
          )
        : allKnockoutVm
            .filter((vm) => vm.match.stage === selectedStage)
            .sort(
              (a, b) =>
                new Date(a.match.start_time).getTime() -
                new Date(b.match.start_time).getTime()
            );

    matches = resolveKnockoutTeams(
      allKnockoutMatches as Match[],
      allGroupMatches as Match[],
      predictions,
      allTeams as Team[]
    ) as Match[];
  }

  // Resolve knockout teams for Today/Results views as well
  if ((view === "today" || view === "results") && matches.length > 0) {
    if (allKnockoutMatches && allGroupMatches && allTeams) {
      matches = resolveKnockoutTeams(matches, allGroupMatches as Match[], predictions, allTeams as Team[]);
    }
  }

  // Map placeholders back for labelling (solo eliminatorias)
  if (view !== "groups") {
    matches = matches.map((rm) => {
      const original = (allKnockoutMatches as (Match & { team_a: Team; team_b: Team })[] || []).find(
        (o) => o.id === rm.id
      );
      return {
        ...rm,
        placeholder_a: original?.team_a?.iso_code,
        placeholder_b: original?.team_b?.iso_code,
      };
    });
  }

  let groupTeams: Team[] = [];
  let standings: any[] = [];
  let predictedStandings: any[] = [];

  if (view === "groups" && matches) {
    const teamMap = new Map();
    matches.forEach(m => {
      if (m.team_a) teamMap.set(m.team_a.id, m.team_a);
      if (m.team_b) teamMap.set(m.team_b.id, m.team_b);
    });
    groupTeams = Array.from(teamMap.values());
    
    // Tabla Real
    standings = calculateStandings(matches as Match[], groupTeams);

    // Tabla de Pronósticos (Simulada)
    const simulatedMatches = matches.map(m => {
      const pred = predictions.find(p => p.match_id === m.id);
      return {
        ...m,
        result_a: pred?.predicted_a ?? null,
        result_b: pred?.predicted_b ?? null
      };
    });
    predictedStandings = calculateStandings(simulatedMatches as Match[], groupTeams);
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
      <RealtimeRankingListener />
      <div className="max-w-5xl mx-auto">
        <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6 text-center sm:text-left">
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            <div>
              <div className="flex items-center justify-center sm:justify-start gap-3 mb-2">
                <span className="bg-blue-600 text-white px-2 py-0.5 text-[10px] font-black rounded uppercase tracking-widest">MUNDIAL 2026</span>
                <h2 className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em]">Predicciones & Resultados</h2>
              </div>
              <h1 className="text-3xl sm:text-5xl font-black tracking-tighter text-gray-900 dark:text-white uppercase leading-none">MIS <span className="text-blue-600">PREDICCIONES</span></h1>
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900 px-4 sm:px-6 py-4 rounded-[2rem] shadow-xl border border-gray-100 dark:border-zinc-800 flex items-center justify-around sm:justify-start gap-4 sm:gap-6">
            <div className="text-center min-w-0 flex-1">
              <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">
                Tu Puntuación
              </span>
              <span className="text-2xl font-black text-blue-600 leading-none">{userStats.points}</span>
            </div>
            <div className="w-px h-8 bg-gray-100 dark:bg-zinc-800 shrink-0"></div>
            <div className="text-center min-w-0 flex-1">
              <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">
                <span className="inline-flex items-center justify-center gap-2">
                  Ranking Global
                  <ScoringRulesButton size="sm" />
                </span>
              </span>
              <span className="text-2xl font-black text-gray-900 dark:text-white leading-none">#{userStats.rank || '--'}</span>
            </div>
          </div>
        </header>

        <div className="flex p-1.5 bg-gray-100 dark:bg-zinc-900 rounded-2xl w-full lg:w-fit overflow-x-auto no-scrollbar shadow-sm mb-10">
          <Link href={`/?view=groups&group=${selectedGroup}`} className={`px-4 sm:px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${view === 'groups' ? 'bg-white dark:bg-zinc-800 text-blue-600 shadow-md scale-105' : 'text-gray-400'}`}>Grupos</Link>
          <Link href="/?view=knockout" className={`px-4 sm:px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${view === 'knockout' ? 'bg-white dark:bg-zinc-800 text-blue-600 shadow-md scale-105' : 'text-gray-400'}`}>Eliminatorias</Link>
          <Link href="/?view=today" className={`px-4 sm:px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${view === 'today' ? 'bg-white dark:bg-zinc-800 text-blue-600 shadow-md scale-105' : 'text-gray-400'}`}>Próximos</Link>
          <Link href="/?view=results" className={`px-4 sm:px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${view === 'results' ? 'bg-white dark:bg-zinc-800 text-blue-600 shadow-md scale-105' : 'text-gray-400'}`}>Resultados</Link>
        </div>

        {view === 'groups' && (
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 justify-center sm:justify-start animate-in fade-in slide-in-from-top-2 mb-10">
            <div className="grid grid-cols-4 gap-3 w-full sm:flex sm:flex-wrap sm:gap-2 sm:w-auto">
              {groups.map(g => (
                <Link
                  key={g}
                  href={`/?view=groups&group=${g}`}
                  className={`relative flex items-center justify-center min-h-[3.25rem] sm:min-h-0 sm:w-10 sm:h-10 rounded-2xl sm:rounded-xl text-base sm:text-[10px] font-black transition-all touch-manipulation active:scale-95 ${selectedGroup === g ? 'bg-blue-600 text-white shadow-md' : 'bg-white dark:bg-zinc-900 text-gray-400 border border-gray-100 dark:border-zinc-800'}`}
                >
                  {g}
                  {groupCompletion[g] === false && <span className="absolute top-1 right-1 sm:-top-1 sm:-right-1 w-3 h-3 sm:w-2.5 sm:h-2.5 bg-orange-500 border-2 border-white dark:border-black rounded-full shadow-sm"></span>}
                  {groupCompletion[g] === true && <span className="absolute top-1 right-1 sm:-top-1 sm:-right-1 w-3 h-3 sm:w-2.5 sm:h-2.5 bg-green-500 border-2 border-white dark:border-black rounded-full shadow-sm flex items-center justify-center"><svg xmlns="http://www.w3.org/2000/svg" width="6" height="6" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg></span>}
                </Link>
              ))}
            </div>
            <RandomizeButton allGroups compact />
          </div>
        )}

        {view === 'knockout' && (
          <>
            <div className="flex p-1.5 bg-gray-100 dark:bg-zinc-900 rounded-2xl w-full sm:w-fit overflow-x-auto no-scrollbar shadow-sm mb-6">
              <div className="flex gap-2 min-w-max">
                {[
                  { id: 'round_32', label: 'Dieciseisavos' },
                  { id: 'round_16', label: 'Octavos' },
                  { id: 'quarter_final', label: 'Cuartos' },
                  { id: 'semi_final', label: 'Semis' },
                  { id: 'final', label: 'Final' },
                ].map(s => (
                  <Link
                    key={s.id}
                    href={`/?view=knockout&stage=${s.id}`}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                      selectedStage === s.id
                        ? 'bg-white dark:bg-zinc-800 text-blue-600 shadow-md'
                        : 'text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300'
                    }`}
                  >
                    {s.label}
                  </Link>
                ))}
              </div>
            </div>
            {!allGroupsComplete && (
              <div className="mb-6 px-4 py-3 rounded-2xl bg-orange-50 dark:bg-orange-950/20 border border-orange-100 dark:border-orange-900/30">
                <p className="text-[9px] font-bold text-orange-700 dark:text-orange-400 uppercase tracking-widest leading-relaxed">
                  {completedGroupsCount > 0
                    ? `${completedGroupsCount} grupo${completedGroupsCount !== 1 ? "s" : ""} ya rellenan equipos en eliminatorias. `
                    : "Los cruces usan placeholders hasta que predigas los grupos. "}
                  Faltan {incompleteGroups.length} para completar todos los cruces y mejores terceros.
                </p>
                <Link
                  href={`/?view=groups&group=${incompleteGroups[0] ?? "A"}`}
                  className="inline-block mt-2 text-[9px] font-black text-orange-600 uppercase tracking-widest hover:underline"
                >
                  Ir a grupos →
                </Link>
              </div>
            )}
            {allGroupsComplete && prevStageName && !knockoutStageComplete[prevStageName] && selectedStageIdx > 0 && (
              <p className="text-[9px] font-bold text-blue-500 uppercase tracking-widest mb-6 px-2">
                Aún no has predicho todos los partidos de {knockoutStageLabels[prevStageName]} — puedes ver las siguientes fases igualmente
              </p>
            )}
          </>
        )}

        <section className="space-y-10">
          {view === "groups" && (
            <div className="animate-in fade-in zoom-in duration-500">
              {groupTeams.length > 0 ? (
                <GroupStandings stats={standings} predictedStats={predictedStandings} />
              ) : (
                <div className="bg-gray-50 dark:bg-zinc-900/50 p-8 rounded-[2rem] text-center border border-dashed border-gray-200 dark:border-zinc-800 mb-6">
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">No hay partidos configurados para el Grupo {selectedGroup}</p>
                </div>
              )}
              {matches.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                  {matches.map((match) => (
                    <MatchCard
                      key={match.id}
                      match={match}
                      userId={user.id}
                      initialPrediction={predictions.find((p) => p.match_id === match.id)}
                    />
                  ))}
                </div>
              ) : null}
            </div>
          )}

          {view === "knockout" && knockoutViewModels.length > 0 ? (
            <div className="animate-in fade-in zoom-in duration-500">
              <KnockoutStageBoard
                viewModels={knockoutViewModels}
                userId={user.id}
                stageLabel={knockoutStageLabels[selectedStage] ?? selectedStage}
              />
            </div>
          ) : view === "knockout" ? (
            <div className="py-20 text-center">
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-300">
                No hay partidos de eliminatorias configurados. Ejecuta knockout_structure.sql en Supabase.
              </p>
            </div>
          ) : (view === "today" || view === "results") ? (
            Object.entries(groupedMatches).length > 0 ? (
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
            ) : (
              <div className="py-20 text-center">
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-300">No hay partidos para mostrar</p>
              </div>
            )
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
