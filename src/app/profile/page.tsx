'use client';

import { useState, useEffect } from 'react';
import { createClient } from "@/utils/supabase/client";
import { updateProfile } from "../actions";

const AVATARS = [
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Bubba",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Cuddles",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Jack",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Luna",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Milo",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Oliver",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Zoe",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Cookie",
  "https://api.dicebear.com/7.x/pixel-art/svg?seed=Mario",
  "https://api.dicebear.com/7.x/pixel-art/svg?seed=Luigi",
  "https://api.dicebear.com/7.x/pixel-art/svg?seed=Peach",
  "https://api.dicebear.com/7.x/pixel-art/svg?seed=Yoshi",
  "https://api.dicebear.com/7.x/pixel-art/svg?seed=Bowser",
  "https://api.dicebear.com/7.x/pixel-art/svg?seed=Link",
  "https://api.dicebear.com/7.x/pixel-art/svg?seed=Zelda",
  "https://api.dicebear.com/7.x/pixel-art/svg?seed=Samus",
  "https://api.dicebear.com/7.x/pixel-art/svg?seed=Kirby",
  "https://api.dicebear.com/7.x/pixel-art/svg?seed=Cloud"
];

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [teams, setTeams] = useState<any[]>([]);
  const [stats, setStats] = useState({ 
    points: 0, 
    predicted: 0, 
    totalFinished: 0,
    plenos: 0, 
    diferencias: 0, 
    ganadores: 0, 
    effectiveness: 0 
  });
  
  const [selectedAvatar, setSelectedAvatar] = useState("");
  const [selectedTeam, setSelectedTeam] = useState("");
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

      // 1. Fetch Profile Data
      const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (profileData) {
        setProfile(profileData);
        setSelectedAvatar(profileData.avatar_url || AVATARS[0]);
        setSelectedTeam(profileData.favorite_team_id?.toString() || "");
      }

      // 2. Fetch Teams for candidate selector
      const { data: groupMatches } = await supabase.from('matches').select('team_a_id, team_b_id').eq('stage', 'group');
      if (groupMatches) {
        const teamIds = Array.from(new Set(groupMatches.flatMap(m => [m.team_a_id, m.team_b_id])));
        const { data: teamsData } = await supabase.from('teams').select('*').in('id', teamIds).order('name');
        setTeams(teamsData || []);
      }

      // 3. Fetch Total Finished Matches
      const { count: finishedCount } = await supabase.from('matches').select('*', { count: 'exact', head: true }).eq('is_finished', true);

      // 4. Fetch Predictions for stats
      const { data: preds } = await supabase
        .from('predictions')
        .select(`points_won, predicted_a, predicted_b, matches (result_a, result_b)`)
        .eq('user_id', user.id)
        .not('points_won', 'is', null);

      if (preds) {
        let totalPoints = 0;
        let plenos = 0;
        let diferencias = 0;
        let ganadores = 0;

        preds.forEach(p => {
          totalPoints += (p.points_won || 0);
          const m = p.matches as any;
          if (m && m.result_a !== null) {
            const isPleno = p.predicted_a === m.result_a && p.predicted_b === m.result_b;
            const isDif = (p.predicted_a - p.predicted_b) === (m.result_a - m.result_b);
            const isWinner = Math.sign(p.predicted_a - p.predicted_b) === Math.sign(m.result_a - m.result_b);

            if (isPleno) plenos++;
            else if (isDif) diferencias++;
            else if (isWinner) ganadores++;
          }
        });

        const totalAciertos = plenos + diferencias + ganadores;
        setStats({
          points: totalPoints,
          predicted: preds.length,
          totalFinished: finishedCount || 0,
          plenos,
          diferencias,
          ganadores,
          effectiveness: preds.length > 0 ? Math.round((totalAciertos / preds.length) * 100) : 0
        });
      }
      
      setLoading(false);
    }
    loadData();
  }, []);

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setUpdating(true);
    setMessage(null);
    const formData = new FormData(e.currentTarget);
    formData.append('avatar_url', selectedAvatar);
    const result = await updateProfile(formData);
    if (result?.success) setMessage({ type: 'success', text: '¡Perfil actualizado!' });
    else setMessage({ type: 'error', text: result?.error || 'Error' });
    setUpdating(false);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center font-black text-xs uppercase tracking-widest opacity-50">Cargando perfil...</div>;

  const displayName = profile?.nickname || user?.user_metadata?.nickname || user?.email?.split('@')[0];

  return (
    <div className="py-6 sm:py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-2xl mx-auto">
        <header className="mb-8 sm:mb-12 text-center">
          <div className="w-24 h-24 sm:w-32 sm:h-32 bg-white dark:bg-zinc-800 rounded-[2.5rem] sm:rounded-[3rem] shadow-2xl overflow-hidden border-4 border-blue-600 mb-6 mx-auto transform -rotate-3 hover:rotate-0 transition-transform cursor-pointer">
            <img src={selectedAvatar} alt="Avatar" className="w-full h-full object-cover p-2" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white uppercase tracking-tighter leading-none">{displayName}</h1>
          <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.3em] mt-2">{user?.email}</p>
        </header>

        <div className="space-y-6 sm:space-y-8">
          {/* STATS GRID MEJORADA CON FRACCIONES */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-white dark:bg-zinc-900 p-4 rounded-3xl border border-gray-100 dark:border-zinc-800 text-center shadow-sm">
              <span className="text-2xl font-black text-blue-600 block mb-1">{stats.points}</span>
              <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Puntos Totales</span>
            </div>
            <div className="bg-white dark:bg-zinc-900 p-4 rounded-3xl border border-gray-100 dark:border-zinc-800 text-center shadow-sm">
              <div className="flex items-baseline justify-center gap-1 mb-1">
                <span className="text-2xl font-black text-green-500">{stats.plenos}</span>
                <span className="text-[10px] font-black text-gray-300">/ {stats.totalFinished}</span>
              </div>
              <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Plenos</span>
            </div>
            <div className="bg-white dark:bg-zinc-900 p-4 rounded-3xl border border-gray-100 dark:border-zinc-800 text-center shadow-sm">
              <div className="flex items-baseline justify-center gap-1 mb-1">
                <span className="text-2xl font-black text-yellow-500">{stats.diferencias}</span>
                <span className="text-[10px] font-black text-gray-300">/ {stats.totalFinished}</span>
              </div>
              <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Diferencias</span>
            </div>
            <div className="bg-white dark:bg-zinc-900 p-4 rounded-3xl border border-gray-100 dark:border-zinc-800 text-center shadow-sm">
              <div className="flex items-baseline justify-center gap-1 mb-1">
                <span className="text-2xl font-black text-orange-500">{stats.ganadores}</span>
                <span className="text-[10px] font-black text-gray-300">/ {stats.totalFinished}</span>
              </div>
              <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Ganadores</span>
            </div>
          </div>

          <div className="bg-blue-600 p-6 rounded-3xl text-center shadow-xl shadow-blue-500/20">
            <div className="flex justify-between items-center px-4">
              <div className="text-left text-white/80">
                <span className="text-[8px] font-black uppercase tracking-widest">Efectividad Global</span>
                <div className="text-2xl font-black text-white">{stats.effectiveness}%</div>
              </div>
              <div className="text-right text-white/80">
                <span className="text-[8px] font-black uppercase tracking-widest">Jugados</span>
                <div className="text-2xl font-black text-white">{stats.predicted} / {stats.totalFinished}</div>
              </div>
            </div>
          </div>

          {/* EDIT FORM (Sin cambios ...) */}
          <form onSubmit={handleUpdate} className="space-y-8">
            <section className="bg-white dark:bg-zinc-900 p-8 rounded-[3rem] shadow-xl border border-gray-100 dark:border-zinc-800">
              <h2 className="text-[10px] font-black mb-8 uppercase tracking-[0.2em] text-gray-400 flex items-center gap-4">
                Personalización <div className="h-px flex-1 bg-gray-100 dark:bg-zinc-800"></div>
              </h2>
              
              <div className="mb-10">
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-6">Elige tu Avatar</label>
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
                  {AVATARS.map((avatar, idx) => (
                    <button key={idx} type="button" onClick={() => setSelectedAvatar(avatar)} className={`relative aspect-square rounded-2xl overflow-hidden border-2 transition-all hover:scale-110 ${selectedAvatar === avatar ? 'border-blue-600 ring-2 ring-blue-600/20' : 'border-transparent bg-gray-50 dark:bg-zinc-800'}`}>
                      <img src={avatar} alt="Option" className="w-full h-full p-1" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 ml-1">Nickname</label>
                  <input name="nickname" type="text" defaultValue={profile?.nickname || ""} className="w-full rounded-2xl px-5 py-4 bg-gray-50 dark:bg-zinc-800 border-none outline-none font-black uppercase text-sm focus:ring-2 focus:ring-blue-600 transition-all" required />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 ml-1">Tu Candidato al Título</label>
                  <select name="favorite_team_id" value={selectedTeam} onChange={(e) => setSelectedTeam(e.target.value)} className="w-full rounded-2xl px-5 py-4 bg-gray-50 dark:bg-zinc-800 border-none outline-none font-black uppercase text-sm focus:ring-2 focus:ring-blue-600 transition-all appearance-none">
                    <option value="">Selecciona tu país</option>
                    {teams.map(team => <option key={team.id} value={team.id}>{team.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="mt-10">
                <button disabled={updating} type="submit" className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-xs hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/20 active:scale-95">
                  {updating ? 'Guardando...' : 'GUARDAR CAMBIOS'}
                </button>
              </div>

              {message && (
                <div className={`mt-6 p-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-center animate-in fade-in slide-in-from-top-2 ${message.type === 'success' ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
                  {message.text}
                </div>
              )}
            </section>
          </form>

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
