import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { revalidatePath } from "next/cache";

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  // Fetch some stats for the profile
  const { count: predictionsCount } = await supabase
    .from('predictions')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id);

  const { count: groupsCount } = await supabase
    .from('pool_members')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id);

  const updateNickname = async (formData: FormData) => {
    'use server';
    const nickname = formData.get('nickname') as string;
    if (!nickname) return;
    const supabase = await createClient();
    await supabase.auth.updateUser({ data: { nickname } });
    const { data: { user } } = await supabase.auth.getUser();
    if (user) await supabase.from('profiles').upsert({ id: user.id, nickname });
    revalidatePath('/profile');
    revalidatePath('/');
  };

  const displayName = user.user_metadata?.nickname || user.email?.split('@')[0];

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-black py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <nav className="mb-10">
          <Link href="/" className="text-xs font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest flex items-center gap-2">
            ← Volver al Inicio
          </Link>
        </nav>

        <header className="mb-12 text-center">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[2.5rem] shadow-xl text-white text-4xl font-black mb-6">
            {displayName?.substring(0, 1).toUpperCase()}
          </div>
          <h1 className="text-4xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Mi <span className="text-blue-600">Perfil</span></h1>
          <p className="text-gray-500 dark:text-zinc-400 font-bold uppercase text-[10px] tracking-[0.3em] mt-2">Personaliza tu experiencia mundialista</p>
        </header>

        <div className="space-y-8">
          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-[2rem] border border-gray-100 dark:border-zinc-800 text-center shadow-sm">
              <span className="text-2xl font-black text-blue-600 block">{predictionsCount || 0}</span>
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Predicciones</span>
            </div>
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-[2rem] border border-gray-100 dark:border-zinc-800 text-center shadow-sm">
              <span className="text-2xl font-black text-blue-600 block">{groupsCount || 0}</span>
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Grupos</span>
            </div>
          </div>

          {/* Nickname Form */}
          <section className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] shadow-xl border border-gray-100 dark:border-zinc-800">
            <h2 className="text-sm font-black mb-6 uppercase tracking-widest text-gray-400">Ajustes de Identidad</h2>
            <form action={updateNickname} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 ml-1">Nickname en Rankings</label>
                <div className="flex gap-3">
                  <input 
                    name="nickname"
                    type="text" 
                    defaultValue={displayName}
                    placeholder="Tu apodo"
                    className="flex-1 rounded-2xl px-5 py-4 bg-gray-50 dark:bg-zinc-800 border-none outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                    required
                  />
                  <button className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20">
                    Actualizar
                  </button>
                </div>
              </div>
            </form>
          </section>

          {/* Account Actions */}
          <section className="p-8 bg-red-50/30 dark:bg-red-950/10 rounded-[2.5rem] border border-red-100/50 dark:border-red-900/20">
            <h2 className="text-sm font-black mb-6 uppercase tracking-widest text-red-600/50">Zona de Peligro</h2>
            <form action="/auth/signout" method="post">
              <button className="w-full bg-white dark:bg-zinc-900 text-red-600 py-4 rounded-2xl font-black uppercase tracking-widest text-xs border border-red-100 dark:border-red-900/30 hover:bg-red-600 hover:text-white transition-all">
                Cerrar Sesión
              </button>
            </form>
          </section>
        </div>
      </div>
    </main>
  );
}
