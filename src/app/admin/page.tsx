import { createClient } from "@/utils/supabase/server";
import { Match } from "@/types";
import AdminMatchRow from "./AdminMatchRow";
import AdminRandomizePhaseButton from "./AdminRandomizePhaseButton";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Q26 - Admin - La Quiniela",
};

const KNOCKOUT_STAGES = [
  { id: "round_32", label: "Dieciseisavos" },
  { id: "round_16", label: "Octavos" },
  { id: "quarter_final", label: "Cuartos" },
  { id: "semi_final", label: "Semis" },
  { id: "third_place", label: "3er Puesto" },
  { id: "final", label: "Final" },
];

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ group?: string; section?: string; stage?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const adminEmails = process.env.ADMIN_EMAIL?.split(',').map(e => e.trim()) || [];

  if (!user || !user.email || !adminEmails.includes(user.email)) {
    redirect('/');
  }

  const resolvedSearchParams = await searchParams;
  const section = resolvedSearchParams.section || "groups";
  const selectedGroup = resolvedSearchParams.group || "A";
  const selectedStage = resolvedSearchParams.stage || "round_32";

  const groups = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"];

  let matches: Match[] | null = null;
  let error: { message: string } | null = null;
  let phasePendingCount = 0;
  let randomizePhaseLabel = "";

  if (section === "groups") {
    const res = await supabase
      .from("matches")
      .select(`*, team_a:teams!team_a_id(*), team_b:teams!team_b_id(*)`)
      .eq("group_id", selectedGroup)
      .order("start_time", { ascending: true });
    matches = res.data as Match[] | null;
    error = res.error;

    const { count } = await supabase
      .from("matches")
      .select("id", { count: "exact", head: true })
      .eq("stage", "group")
      .eq("is_finished", false);
    phasePendingCount = count ?? 0;
    randomizePhaseLabel = "fase de grupos";
  } else {
    const res = await supabase
      .from("matches")
      .select(`*, team_a:teams!team_a_id(*), team_b:teams!team_b_id(*)`)
      .eq("stage", selectedStage)
      .order("start_time", { ascending: true });
    matches = res.data as Match[] | null;
    error = res.error;

    const { count } = await supabase
      .from("matches")
      .select("id", { count: "exact", head: true })
      .eq("stage", selectedStage)
      .eq("is_finished", false);
    phasePendingCount = count ?? 0;
    randomizePhaseLabel =
      KNOCKOUT_STAGES.find((s) => s.id === selectedStage)?.label ?? selectedStage;
  }

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-black py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <header className="mb-12 flex justify-between items-end">
          <div>
            <h1 className="text-4xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">
              Panel de <span className="text-red-600">Control</span>
            </h1>
            <p className="text-gray-500 dark:text-zinc-400 font-bold uppercase text-xs tracking-widest mt-1">
              Solo para Administradores
            </p>
            <p className="text-[9px] text-gray-400 dark:text-zinc-500 font-bold uppercase tracking-widest mt-3 max-w-md leading-relaxed">
              1. Iniciar 0-0 · 2. Actualizar marcador (tiempo real en la app) · 3. Finalizar · ↺ Reiniciar
            </p>
          </div>
          <Link href="/" className="text-xs font-black bg-white dark:bg-zinc-900 px-6 py-3 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm uppercase tracking-widest">
            Volver
          </Link>
        </header>

        <div className="flex gap-2 mb-6">
          <Link
            href="/admin?section=groups"
            className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest ${
              section === "groups"
                ? "bg-red-600 text-white"
                : "bg-white dark:bg-zinc-900 text-gray-400 border border-gray-100 dark:border-zinc-800"
            }`}
          >
            Grupos
          </Link>
          <Link
            href="/admin?section=knockout&stage=round_32"
            className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest ${
              section === "knockout"
                ? "bg-red-600 text-white"
                : "bg-white dark:bg-zinc-900 text-gray-400 border border-gray-100 dark:border-zinc-800"
            }`}
          >
            Eliminatorias
          </Link>
        </div>

        {section === "groups" ? (
          <div className="flex flex-wrap gap-2 mb-8 bg-white dark:bg-zinc-900 p-3 rounded-[2rem] border border-gray-100 dark:border-zinc-800 shadow-sm">
            {groups.map(g => (
              <Link
                key={g}
                href={`/admin?section=groups&group=${g}`}
                className={`w-10 h-10 flex items-center justify-center rounded-xl text-sm font-black transition-all ${selectedGroup === g ? 'bg-red-600 text-white shadow-lg shadow-red-500/30' : 'text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300'}`}
              >
                {g}
              </Link>
            ))}
          </div>
        ) : (
          <div className="flex flex-wrap gap-2 mb-8 bg-white dark:bg-zinc-900 p-3 rounded-[2rem] border border-gray-100 dark:border-zinc-800 shadow-sm">
            {KNOCKOUT_STAGES.map(s => (
              <Link
                key={s.id}
                href={`/admin?section=knockout&stage=${s.id}`}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${
                  selectedStage === s.id ? 'bg-red-600 text-white' : 'text-gray-400'
                }`}
              >
                {s.label}
              </Link>
            ))}
          </div>
        )}

        {error && (
          <p className="mb-4 text-red-500 text-sm font-bold">{error.message}</p>
        )}

        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-2">
          <p className="text-[9px] font-bold text-amber-800/70 dark:text-amber-400/70 uppercase tracking-widest max-w-md leading-relaxed">
            Pruebas: finaliza todos los partidos pendientes de la fase con marcadores aleatorios.
          </p>
          <AdminRandomizePhaseButton
            {...(section === "groups"
              ? { section: "groups" as const }
              : { section: "knockout" as const, stage: selectedStage })}
            label={randomizePhaseLabel}
            pendingCount={phasePendingCount}
          />
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] shadow-xl border border-gray-100 dark:border-zinc-800 overflow-hidden">
          <div className="divide-y divide-gray-50 dark:divide-zinc-800">
            {matches && matches.length > 0 ? (
              matches.map((match: Match) => (
                <AdminMatchRow key={match.id} match={match} />
              ))
            ) : (
              <p className="p-20 text-center text-gray-400 font-bold">
                {section === "knockout"
                  ? "No hay partidos de eliminatorias. Ejecuta knockout_structure.sql."
                  : "No hay partidos en este grupo"}
              </p>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
