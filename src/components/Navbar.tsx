import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import NavbarLinks from "./NavbarLinks";
import MobileNavbarLinks from "./MobileNavbarLinks";
import UserMenu from "./UserMenu";
import { isAppAdminEmail } from "@/lib/app-admin";
import { fetchProfileFields, getFavoriteTeamFlagUrl } from "@/lib/profile";
import { getMatchSyncStatus } from "@/lib/match-sync-status";
import MatchSyncStatus from "./MatchSyncStatus";

export const dynamic = "force-dynamic";

export default async function Navbar() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const isAdmin = isAppAdminEmail(user?.email);

  let syncStatus = null;
  if (isAdmin) {
    syncStatus = await getMatchSyncStatus(supabase);
  }

  let initialNickname: string | null = null;
  let initialFlagUrl: string | null = null;
  if (user?.id) {
    try {
      const fields = await fetchProfileFields(supabase, user.id);
      initialNickname =
        fields?.nickname ||
        (user.user_metadata?.nickname as string | undefined) ||
        null;
      initialFlagUrl = getFavoriteTeamFlagUrl(fields?.favoriteTeam ?? null, 40);
    } catch {
      initialNickname = (user.user_metadata?.nickname as string | undefined) || null;
    }
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
          {user && <NavbarLinks showAdmin={isAdmin} />}
          {syncStatus && <MatchSyncStatus status={syncStatus} variant="navbar" />}
          
          {user ? (
            <UserMenu
              userId={user.id}
              email={user.email}
              initialNickname={initialNickname}
              initialFlagUrl={initialFlagUrl}
            />
          ) : (
            <div className="flex items-center gap-2 sm:gap-3">
              <Link
                href="/login?mode=signup"
                className="hidden sm:inline bg-blue-600 text-white px-4 sm:px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all"
              >
                Crear cuenta
              </Link>
              <Link
                href="/login"
                className="bg-zinc-900 dark:bg-white text-white dark:text-black px-5 sm:px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg shadow-black/10"
              >
                Entrar
              </Link>
            </div>
          )}
        </div>
      </div>
      
      {/* Mobile Links (Only visible on small screens and if logged in) */}
      {user && <MobileNavbarLinks showAdmin={isAdmin} />}
    </nav>
  );
}
