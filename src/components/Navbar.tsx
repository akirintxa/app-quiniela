import { createClient } from "@/utils/supabase/server";
import Link from "next/link";

export default async function Navbar() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let displayName = user?.email?.split('@')[0];
  if (user?.id) {
    const { data: profile } = await supabase.from('profiles').select('nickname').eq('id', user.id).single();
    if (profile?.nickname) displayName = profile.nickname;
  }

  return (
    <nav className="sticky top-0 z-50 bg-white/80 dark:bg-black/80 backdrop-blur-md border-b border-gray-100 dark:border-zinc-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="group flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 transform -rotate-3 group-hover:rotate-0 transition-transform">
            <span className="text-lg font-black text-white tracking-tighter">Q26</span>
          </div>
          <span className="hidden sm:block text-[10px] font-black uppercase tracking-[0.2em] text-gray-900 dark:text-white">LA QUINIELA</span>
        </Link>

        {/* Links - Solo visibles si está logueado */}
        <div className="flex items-center gap-4 sm:gap-8">
          {user && (
            <div className="hidden sm:flex items-center gap-6 mr-4">
              <Link href="/" className="text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-blue-600 transition-colors">Mis Predicciones</Link>
              <Link href="/groups" className="text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-blue-600 transition-colors">Mis Grupos</Link>
              <Link href="/ranking" className="text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-blue-600 transition-colors">Ranking</Link>
            </div>
          )}
          
          {user ? (
            <div className="flex items-center gap-2 sm:gap-4">
              <Link href="/profile" className="flex items-center gap-3 bg-gray-50 dark:bg-zinc-900 p-1 rounded-full border border-gray-100 dark:border-zinc-800 shadow-sm pl-4 pr-2 hover:border-blue-500 transition-all group">
                <span className="text-[10px] font-black text-gray-900 dark:text-zinc-100 uppercase tracking-tighter group-hover:text-blue-600">{displayName}</span>
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-[10px] font-black text-white shadow-inner uppercase">
                  {displayName?.substring(0, 1)}
                </div>
              </Link>
              <form action="/auth/signout" method="post">
                <button title="Cerrar Sesión" className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-full transition-all">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                </button>
              </form>
            </div>
          ) : (
            <Link href="/login" className="bg-zinc-900 dark:bg-white text-white dark:text-black px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg shadow-black/10">
              Entrar
            </Link>
          )}
        </div>
      </div>
      
      {/* Mobile Links (Only visible on small screens and if logged in) */}
      {user && (
        <div className="sm:hidden flex justify-center gap-8 pb-4 border-t border-gray-50 dark:border-zinc-900 pt-2">
          <Link href="/" className="text-[9px] font-black uppercase tracking-widest text-gray-400">Inicio</Link>
          <Link href="/groups" className="text-[9px] font-black uppercase tracking-widest text-gray-400">Grupos</Link>
          <Link href="/ranking" className="text-[9px] font-black uppercase tracking-widest text-gray-400">Ranking</Link>
        </div>
      )}
    </nav>
  );
}
