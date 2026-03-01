import { createClient } from "@/utils/supabase/server";
import Link from "next/link";

export default async function Navbar() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const displayName = user?.user_metadata?.nickname || user?.email?.split('@')[0];

  return (
    <nav className="sticky top-0 z-50 bg-white/80 dark:bg-black/80 backdrop-blur-md border-b border-gray-100 dark:border-zinc-800 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto h-20 flex justify-between items-center">
        {/* Logo */}
        <Link href="/" className="group flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 transform -rotate-3 group-hover:rotate-0 transition-transform">
            <span className="text-lg font-black text-white tracking-tighter">Q26</span>
          </div>
          <span className="hidden sm:block text-xs font-black uppercase tracking-[0.2em] text-gray-900 dark:text-white">Quiniela</span>
        </Link>


        {/* Links */}
        <div className="flex items-center gap-4 sm:gap-8">
          <div className="hidden sm:flex items-center gap-6 mr-4">
            <Link href="/groups" className="text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-blue-600 transition-colors">Mis Grupos</Link>
            <Link href="/ranking" className="text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-blue-600 transition-colors">Ranking</Link>
          </div>
          
          {user ? (
            <Link href="/profile" className="flex items-center gap-3 bg-gray-50 dark:bg-zinc-900 p-1 rounded-full border border-gray-100 dark:border-zinc-800 shadow-sm pl-4 pr-2 hover:border-blue-500 transition-all group">
              <span className="text-[10px] font-black text-gray-900 dark:text-zinc-100 uppercase tracking-tighter group-hover:text-blue-600">{displayName}</span>
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-[10px] font-black text-white">
                {displayName?.substring(0, 1).toUpperCase()}
              </div>
            </Link>
          ) : (
            <Link href="/login" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-full text-[10px] font-black transition-all shadow-lg shadow-blue-500/20 active:scale-95 uppercase tracking-widest">
              Entrar
            </Link>
          )}
        </div>
      </div>
      
      {/* Mobile Links (Only visible on small screens) */}
      <div className="sm:hidden flex justify-center gap-8 pb-4 border-t border-gray-50 dark:border-zinc-900 pt-2">
        <Link href="/groups" className="text-[9px] font-black uppercase tracking-widest text-gray-400">Grupos</Link>
        <Link href="/ranking" className="text-[9px] font-black uppercase tracking-widest text-gray-400">Ranking</Link>
      </div>
    </nav>
  );
}
