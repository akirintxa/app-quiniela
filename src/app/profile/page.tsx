'use client';

import { useState, useEffect } from 'react';
import { createClient } from "@/utils/supabase/client";
import { updateProfile } from "../actions";
import Navbar from "@/components/Navbar";

const AVATARS = [
  // Los 10 primeros originales (Avataaars)
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
  // 10 de Pixel Art con personajes (Pixel Art)
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
  const [stats, setStats] = useState({ points: 0, predicted: 0, plenos: 0, aciertos: 0, fallos: 0, effectiveness: 0 });
  
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

      // Fetch Profile Data
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (profileData) {
        setProfile(profileData);
        setSelectedAvatar(profileData.avatar_url || AVATARS[0]);
        setSelectedTeam(profileData.favorite_team_id?.toString() || "");
      }

      // Fetch only Teams that are in the Group Stage
      const { data: groupMatches } = await supabase
        .from('matches')
        .select('team_a_id, team_b_id')
        .eq('stage', 'group');

      if (groupMatches) {
        const teamIds = Array.from(new Set(groupMatches.flatMap(m => [m.team_a_id, m.team_b_id])));
        const { data: teamsData } = await supabase
          .from('teams')
          .select('*')
          .in('id', teamIds)
          .order('name');
        setTeams(teamsData || []);
      }

      // Fetch Predictions for stats
      const { data: preds } = await supabase
        .from('predictions')
        .select('points_won')
        .eq('user_id', user.id)
        .not('points_won', 'is', null);

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
        effectiveness: totalPredicted > 0 ? Math.round(((plenos + aciertos) / totalPredicted) * 100) : 0
      });
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
    
    if (result?.success) {
      setMessage({ type: 'success', text: '¡Perfil actualizado con éxito!' });
    } else {
      setMessage({ type: 'error', text: result?.error || 'Error al actualizar' });
    }
    setUpdating(false);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center font-black text-xs uppercase tracking-widest opacity-50">Cargando perfil...</div>;

  const displayName = profile?.nickname || user?.user_metadata?.nickname || user?.email?.split('@')[0];

  return (
    <>
      <Navbar />
      <div className="py-6 sm:py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-2xl mx-auto">
        <header className="mb-8 sm:mb-12 text-center">
          <div className="relative inline-block group">
            <div className="w-24 h-24 sm:w-32 sm:h-32 bg-white dark:bg-zinc-800 rounded-[2.5rem] sm:rounded-[3rem] shadow-2xl overflow-hidden border-4 border-blue-600 mb-6 mx-auto transform -rotate-3 transition-transform hover:rotate-0">
              <img src={selectedAvatar || AVATARS[0]} alt="Avatar" className="w-full h-full object-cover p-2" />
            </div>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white uppercase tracking-tighter leading-none">{displayName}</h1>
          <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.3em] mt-2">{user?.email}</p>
          <p className="text-[10px] text-blue-600 font-black uppercase tracking-[0.3em] mt-4">Gestión de Perfil</p>
        </header>

        <div className="space-y-6 sm:space-y-8">
          {/* STATS GRID */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
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

          {/* EDIT FORM */}
          <form onSubmit={handleUpdate} className="space-y-8">
            <section className="bg-white dark:bg-zinc-900 p-8 rounded-[3rem] shadow-xl border border-gray-100 dark:border-zinc-800">
              <h2 className="text-[10px] font-black mb-8 uppercase tracking-[0.2em] text-gray-400 flex items-center gap-4">
                Personalización <div className="h-px flex-1 bg-gray-100 dark:bg-zinc-800"></div>
              </h2>
              
              {/* AVATAR SELECTOR */}
              <div className="mb-10">
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-6">Elige tu Avatar (Originales o Pixel Art)</label>
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-3 sm:gap-4">
                  {AVATARS.map((avatar, idx) => (
                    <button 
                      key={idx} 
                      type="button"
                      onClick={() => setSelectedAvatar(avatar)}
                      className={`relative aspect-square rounded-2xl overflow-hidden border-2 transition-all hover:scale-110 ${selectedAvatar === avatar ? 'border-blue-600 bg-blue-50 ring-2 ring-blue-600/20' : 'border-transparent bg-gray-50 dark:bg-zinc-800'}`}
                    >
                      <img src={avatar} alt="Option" className="w-full h-full p-1" />
                      {selectedAvatar === avatar && (
                        <div className="absolute inset-0 bg-blue-600/5 flex items-center justify-center">
                          <div className="bg-blue-600 text-white rounded-full p-0.5">
                            <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                          </div>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 ml-1">Nickname</label>
                  <input name="nickname" type="text" defaultValue={displayName} className="w-full rounded-2xl px-5 py-4 bg-gray-50 dark:bg-zinc-800 border-none outline-none font-black uppercase text-sm focus:ring-2 focus:ring-blue-600 transition-all" required />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 ml-1">Tu Candidato al Título (Fase de Grupos)</label>
                  <select 
                    name="favorite_team_id" 
                    value={selectedTeam} 
                    onChange={(e) => setSelectedTeam(e.target.value)}
                    className="w-full rounded-2xl px-5 py-4 bg-gray-50 dark:bg-zinc-800 border-none outline-none font-black uppercase text-sm focus:ring-2 focus:ring-blue-600 transition-all appearance-none"
                  >
                    <option value="">Selecciona tu país</option>
                    {teams.map(team => (
                      <option key={team.id} value={team.id}>{team.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-10">
                <button 
                  disabled={updating} 
                  type="submit"
                  className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-xs hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/20 disabled:opacity-50 active:scale-95"
                >
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
    </>
  );
}
