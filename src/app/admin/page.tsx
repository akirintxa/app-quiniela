import { createClient } from "@/utils/supabase/server";
import { Match } from "@/types";
import AdminMatchRow from "./AdminMatchRow";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Q26 - Admin",
};

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ group?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // 1. SECURITY CHECK
  // Only allow access if user is logged in AND their email is in the ADMIN_EMAIL list
  const adminEmails = process.env.ADMIN_EMAIL?.split(',').map(e => e.trim()) || [];

  if (!user || !user.email || !adminEmails.includes(user.email)) {
    // If not admin, redirect to home
    redirect('/');
  }
  const resolvedSearchParams = await searchParams;
  const selectedGroup = resolvedSearchParams.group || "A";

  const { data: matches, error } = await supabase
    .from("matches")
    .select(`
      *,
      team_a:teams!team_a_id(*),
      team_b:teams!team_b_id(*)
    `)
    .eq("group_id", selectedGroup)
    .order("start_time", { ascending: true });

  const groups = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"];

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
          </div>
          <Link href="/" className="text-xs font-black bg-white dark:bg-zinc-900 px-6 py-3 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm uppercase tracking-widest">
            Volver
          </Link>
        </header>

        <div className="flex flex-wrap gap-2 mb-8 bg-white dark:bg-zinc-900 p-3 rounded-[2rem] border border-gray-100 dark:border-zinc-800 shadow-sm">
          {groups.map(g => (
            <Link 
              key={g} 
              href={`/admin?group=${g}`}
              className={`w-10 h-10 flex items-center justify-center rounded-xl text-sm font-black transition-all ${selectedGroup === g ? 'bg-red-600 text-white shadow-lg shadow-red-500/30' : 'text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300'}`}
            >
              {g}
            </Link>
          ))}
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] shadow-xl border border-gray-100 dark:border-zinc-800 overflow-hidden">
          <div className="divide-y divide-gray-50 dark:divide-zinc-800">
            {matches && matches.length > 0 ? (
              matches.map((match: Match) => (
                <AdminMatchRow key={match.id} match={match} />
              ))
            ) : (
              <p className="p-20 text-center text-gray-400 font-bold">No hay partidos en este grupo</p>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
