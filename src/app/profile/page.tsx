import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import { updateNickname } from "../actions";

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  // 1. Fetch All user predictions that are finished
  const { data: userPreds } = await supabase
    .from('predictions')
    .select('points_won')
    .not('points_won', 'is', null);

  const totalPoints = userPreds?.reduce((acc, curr) => acc + (curr.points_won || 0), 0) || 0;
  const plenos = userPreds?.filter(p => p.points_won === 3).length || 0;
  const aciertos = userPreds?.filter(p => (p.points_won || 0) > 0 && p.points_won < 3).length || 0;
  const fallos = userPreds?.filter(p => (p.points_won || 0) === 0).length || 0;
  const totalPredicted = userPreds?.length || 0;
  
  const effectiveness = totalPredicted > 0 
    ? Math.round(((plenos + aciertos) / totalPredicted) * 100) 
    : 0;

  const displayName = user.user_metadata?.nickname || user.email?.split('@')[0];

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-2xl mx-auto">
        
        <header className="mb-12 text-center">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[2.5rem] shadow-2xl text-white text-4xl font-black mb-6 transform -rotate-3 transition-transform hover:rotate-0">
            {displayName?.substring(0, 1).toUpperCase()}
          </div>
          <h1 className="text-4xl font-black text-gray-900 dark:text-white uppercase tracking-tighter leading-none">MI <span className="text-blue-600">PERFIL</span></h1>
          <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.3em] mt-4">Estadísticas y Ajustes</p>
        </header>

        <div className="space-y-8">
          {/* STATS GRID */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-[2rem] border border-gray-100 dark:border-zinc-800 text-center shadow-sm">
              <span className="text-3xl font-black text-blue-600 block leading-none mb-2">{totalPoints}</span>
              <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Puntos Totales</span>
            </div>
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-[2rem] border border-gray-100 dark:border-zinc-800 text-center shadow-sm">
              <span className="text-3xl font-black text-green-500 block leading-none mb-2">{plenos}</span>
              <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Plenos (3 pts)</span>
            </div>
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-[2rem] border border-gray-100 dark:border-zinc-800 text-center shadow-sm">
              <span className="text-3xl font-black text-yellow-500 block leading-none mb-2">{aciertos}</span>
              <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Aciertos</span>
            </div>
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-[2rem] border border-gray-100 dark:border-zinc-800 text-center shadow-sm">
              <span className="text-3xl font-black text-gray-300 block leading-none mb-2">{effectiveness}%</span>
              <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Efectividad</span>
            </div>
          </div>

          {/* PROGRESS INFO */}
          <div className="bg-white dark:bg-zinc-900 p-8 rounded-[3rem] border border-gray-100 dark:border-zinc-800 shadow-xl overflow-hidden relative">
            <div className="relative z-10">
              <h2 className="text-xs font-black uppercase tracking-[0.2em] text-gray-400 mb-6 flex items-center gap-3">Análisis de Juego <div className="h-px flex-1 bg-gray-100 dark:bg-zinc-800"></div></h2>
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black text-gray-900 dark:text-zinc-100 uppercase tracking-widest">Partidos Pronosticados</span>
                  <span className="text-sm font-black">{totalPredicted}</span>
                </div>
                <div className="w-full h-2 bg-gray-100 dark:bg-zinc-800 rounded-full overflow-hidden flex">
                  <div className="bg-green-500 h-full" style={{ width: `${(plenos / totalPredicted) * 100 || 0}%` }}></div>
                  <div className="bg-yellow-500 h-full" style={{ width: `${(aciertos / totalPredicted) * 100 || 0}%` }}></div>
                  <div className="bg-gray-200 dark:bg-zinc-700 h-full" style={{ width: `${(fallos / totalPredicted) * 100 || 0}%` }}></div>
                </div>
                <div className="flex gap-4 text-[8px] font-black uppercase tracking-widest text-gray-400">
                  <div className="flex items-center gap-1.5"><div className="w-2 h-2 bg-green-500 rounded-full"></div> Plenos</div>
                  <div className="flex items-center gap-1.5"><div className="w-2 h-2 bg-yellow-500 rounded-full"></div> Aciertos</div>
                  <div className="flex items-center gap-1.5"><div className="w-2 h-2 bg-gray-200 dark:bg-zinc-700 rounded-full"></div> Fallos</div>
                </div>
              </div>
            </div>
          </div>

          {/* Nickname Form */}
          <section className="bg-white dark:bg-zinc-900 p-8 rounded-[3rem] shadow-xl border border-gray-100 dark:border-zinc-800">
            <h2 className="text-[10px] font-black mb-6 uppercase tracking-widest text-gray-400">Configuración de Cuenta</h2>
            <form action={updateNickname} className="space-y-4">
              <div>
                <label className="block text-[9px] font-black uppercase tracking-widest text-gray-400 mb-2 ml-1">Tu apodo en los rankings</label>
                <div className="flex gap-3">
                  <input name="nickname" type="text" defaultValue={displayName} placeholder="TU APODO" className="flex-1 rounded-2xl px-5 py-4 bg-gray-50 dark:bg-zinc-800 border-none outline-none focus:ring-2 focus:ring-blue-500 font-black uppercase text-sm" required />
                  <button className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20">Actualizar</button>
                </div>
              </div>
            </form>
          </section>

          {/* Account Actions */}
          <section className="p-8 bg-red-50/20 dark:bg-red-950/10 rounded-[3rem] border border-red-100/50 dark:border-red-900/20">
            <h2 className="text-[10px] font-black mb-6 uppercase tracking-widest text-red-600/50">Cerrar Sesión</h2>
            <form action="/auth/signout" method="post">
              <button className="w-full bg-white dark:bg-zinc-900 text-red-600 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] border border-red-100 dark:border-red-900/30 hover:bg-red-600 hover:text-white transition-all shadow-sm">
                Salir de la aplicación
              </button>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
}
