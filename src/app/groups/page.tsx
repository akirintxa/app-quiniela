import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import GroupForms from "@/components/GroupForms";

export default async function GroupsPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string; error?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: myGroups } = await supabase
    .from('pool_members')
    .select(`
      pool_id,
      pools (
        id,
        name,
        invite_code,
        creator_id,
        pool_members (count)
      )
    `)
    .eq('user_id', user.id);

  const hasGroups = myGroups && myGroups.length > 0;

  const createPool = async (formData: FormData) => {
    'use server';
    const name = formData.get('name') as string;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const { data: pool } = await supabase.from('pools').insert({ name, creator_id: user.id, invite_code: inviteCode }).select().single();
    if (pool) await supabase.from('pool_members').insert({ pool_id: pool.id, user_id: user.id, role: 'admin' });
    revalidatePath('/groups');
    redirect('/groups?message=success_create');
  };

  const joinPool = async (formData: FormData) => {
    'use server';
    const code = (formData.get('code') as string).toUpperCase().trim();
    if (!code) return;
    
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: pool } = await supabase.from('pools').select('id').eq('invite_code', code).maybeSingle();
    if (!pool) return redirect('/groups?error=invalid_code');

    // Verificar si ya es miembro
    const { data: existingMember } = await supabase
      .from('pool_members')
      .select('pool_id')
      .eq('pool_id', pool.id)
      .eq('user_id', user.id)
      .maybeSingle();

    if (existingMember) {
      return redirect('/groups?error=already_member');
    }

    const { error: joinError } = await supabase.from('pool_members').upsert({ pool_id: pool.id, user_id: user.id });
    if (joinError) return redirect('/groups?error=join_failed');

    revalidatePath('/groups');
    redirect(`/groups/${pool.id}`);
  };

  return (
    <div className="py-10 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-4xl mx-auto">
        <header className="mb-10 text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start gap-3 mb-2">
            <span className="bg-blue-600 text-white px-2 py-0.5 text-[10px] font-black rounded uppercase tracking-widest">MUNDIAL 2026</span>
            <h2 className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em]">Ligas Privadas</h2>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tighter text-gray-900 dark:text-white uppercase leading-none">
            MIS <span className="text-blue-600 dark:text-blue-500">GRUPOS</span>
          </h1>
        </header>

        {!hasGroups ? (
          <div className="mb-12 bg-blue-600 rounded-[3rem] p-8 sm:p-12 text-center shadow-2xl shadow-blue-500/20 animate-in fade-in zoom-in duration-500">
            <div className="max-w-xl mx-auto">
              <span className="bg-white/20 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest mb-6 inline-block">¡Empieza aquí!</span>
              <h2 className="text-2xl sm:text-4xl font-black text-white uppercase tracking-tighter leading-none mb-4">La Quiniela es mejor con amigos</h2>
              <p className="text-blue-100 text-sm font-bold uppercase tracking-tight mb-10 leading-relaxed opacity-90">Crea tu propia liga privada e invita a tus colegas con un código, o únete a una liga ya existente.</p>
              
              <div className="max-w-md mx-auto">
                <GroupForms createPool={createPool} joinPool={joinPool} />
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-12">
            <section className="space-y-6">
              <div className="grid grid-cols-1 gap-4">
                {myGroups.map((item: any) => (
                  <Link 
                    key={item.pool_id} 
                    href={`/groups/${item.pool_id}`}
                    className="group bg-white dark:bg-zinc-900 p-6 rounded-[2.5rem] shadow-xl border border-gray-100 dark:border-zinc-800 hover:border-blue-500 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-6"
                  >
                    <div className="flex items-center gap-6">
                      <div className="w-14 h-14 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center text-blue-600 dark:text-blue-400 text-2xl font-black">
                        {item.pools.name.substring(0, 1).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="text-xl font-black text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors uppercase tracking-tight">
                          {item.pools.name}
                        </h3>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-[9px] font-black bg-gray-100 dark:bg-zinc-800 text-gray-500 px-2 py-1 rounded-md uppercase tracking-widest">
                            {item.pools.pool_members[0].count} Jugadores
                          </span>
                          <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest">
                            Código: {item.pools.invite_code}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-blue-600 group-hover:translate-x-2 transition-transform">
                      Ver Tabla →
                    </div>
                  </Link>
                ))}
              </div>
            </section>

            <section className="pt-10 border-t border-gray-100 dark:border-zinc-900">
              <GroupForms createPool={createPool} joinPool={joinPool} />
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
