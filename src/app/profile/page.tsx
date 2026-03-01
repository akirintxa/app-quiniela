
'use client';

import { useState, useEffect } from 'react';
import { createClient } from "@/utils/supabase/client";
import { updateNickname } from "../actions";
import Link from "next/link";

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState({ points: 0, predicted: 0, plenos: 0, aciertos: 0, fallos: 0, effectiveness: 0, groups: 0 });
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    async function loadData() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        window.location.href = '/login';
        return;
      }
      setUser(user);

      // Fetch Predictions for stats
      const { data: preds } = await supabase
        .from('predictions')
        .select('points_won')
        .not('points_won', 'is', null);

      const { count: groupsCount } = await supabase
        .from('pool_members')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      const totalPoints = preds?.reduce((acc, curr) => acc + (curr.points_won || 0), 0) || 0;
      const plenos = preds?.filter(p => p.points_won === 3).length || 0;
      const aciertos = preds?.filter(p => (p.points_won || 0) > 0 && p.points_won < 3).length || 0;
      const totalPredicted = preds?.length || 0;
      const fallos = totalPredicted - (plenos + aciertos);
      
      setStats({
        points: totalPoints,
        predicted: totalPredicted,
        plenos,
        aciertos,
        fallos,
        effectiveness: totalPredicted > 0 ? Math.round(((plenos + aciertos) / totalPredicted) * 100) : 0,
        groups: groupsCount || 0
      });
      setLoading(false);
    }
    loadData();
  }, []);

  const handleUpdate = async (formData: FormData) => {
    setUpdating(true);
    setMessage(null);
    const result = await updateNickname(formData);
    
    if (result?.success) {
      setMessage({ type: 'success', text: '¡Perfil actualizado con éxito!' });
      // Update local state nickname
      const nickname = formData.get('nickname') as string;
      setUser({ ...user, user_metadata: { ...user.user_metadata, nickname } });
    } else {
      setMessage({ type: 'error', text: result?.error || 'Error al actualizar' });
    }
    setUpdating(false);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center font-black text-xs uppercase tracking-widest opacity-50">Cargando perfil...</div>;

  const displayName = user?.user_metadata?.nickname || user?.email?.split('@')[0];

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-2xl mx-auto">
        <header className="mb-12 text-center">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[2.5rem] shadow-2xl text-white text-4xl font-black mb-6 transform -rotate-3">
            {displayName?.substring(0, 1).toUpperCase()}
          </div>
          <h1 className="text-4xl font-black text-gray-900 dark:text-white uppercase tracking-tighter leading-none">MI PERFIL</h1>
          <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.3em] mt-4">Estadísticas y Ajustes</p>
        </header>

        <div className="space-y-8">
          {/* STATS GRID */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-[2rem] border border-gray-100 dark:border-zinc-800 text-center shadow-sm">
              <span className="text-3xl font-black text-blue-600 block leading-none mb-2">{stats.points}</span>
              <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Puntos</span>
            </div>
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-[2rem] border border-gray-100 dark:border-zinc-800 text-center shadow-sm">
              <span className="text-3xl font-black text-green-500 block leading-none mb-2">{stats.plenos}</span>
              <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Plenos</span>
            </div>
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-[2rem] border border-gray-100 dark:border-zinc-800 text-center shadow-sm">
              <span className="text-3xl font-black text-yellow-500 block leading-none mb-2">{stats.aciertos}</span>
              <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Aciertos</span>
            </div>
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-[2rem] border border-gray-100 dark:border-zinc-800 text-center shadow-sm">
              <span className="text-3xl font-black text-gray-300 block leading-none mb-2">{stats.effectiveness}%</span>
              <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Efectividad</span>
            </div>
          </div>

          {/* PROGRESS INFO */}
          <div className="bg-white dark:bg-zinc-900 p-8 rounded-[3rem] border border-gray-100 dark:border-zinc-800 shadow-xl">
            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-gray-400 mb-6 flex items-center gap-3">Análisis <div className="h-px flex-1 bg-gray-100 dark:bg-zinc-800"></div></h2>
            <div className="space-y-6">
              <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                <span>Partidos Pronosticados</span>
                <span>{stats.predicted}</span>
              </div>
              <div className="w-full h-2 bg-gray-100 dark:bg-zinc-800 rounded-full overflow-hidden flex text-gray-900 dark:text-zinc-100">
                <div className="bg-green-500 h-full" style={{ width: `${(stats.plenos / stats.predicted) * 100 || 0}%` }}></div>
                <div className="bg-yellow-500 h-full" style={{ width: `${(stats.aciertos / stats.predicted) * 100 || 0}%` }}></div>
                <div className="bg-gray-200 dark:bg-zinc-700 h-full" style={{ width: `${(stats.fallos / stats.predicted) * 100 || 0}%` }}></div>
              </div>
            </div>
          </div>

          {/* Nickname Form */}
          <section className="bg-white dark:bg-zinc-900 p-8 rounded-[3rem] shadow-xl border border-gray-100 dark:border-zinc-800 relative">
            <h2 className="text-[10px] font-black mb-6 uppercase tracking-widest text-gray-400">Configuración</h2>
            <form action={handleUpdate} className="space-y-4">
              <div>
                <label className="block text-[9px] font-black uppercase tracking-widest text-gray-400 mb-2 ml-1">Nickname</label>
                <div className="flex gap-3">
                  <input name="nickname" type="text" defaultValue={displayName} className="flex-1 rounded-2xl px-5 py-4 bg-gray-50 dark:bg-zinc-800 border-none outline-none font-black uppercase text-sm" required />
                  <button disabled={updating} className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-blue-700 transition-all shadow-lg disabled:opacity-50">
                    {updating ? '...' : 'Actualizar'}
                  </button>
                </div>
              </div>
            </form>

            {message && (
              <div className={`mt-6 p-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-center animate-in fade-in slide-in-from-top-2 ${message.type === 'success' ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
                {message.text}
              </div>
            )}
          </section>

          <form action="/auth/signout" method="post">
            <button className="w-full bg-red-50/50 dark:bg-red-950/10 text-red-600 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] border border-red-100 dark:border-red-900/20 hover:bg-red-600 hover:text-white transition-all">
              Cerrar Sesión
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
