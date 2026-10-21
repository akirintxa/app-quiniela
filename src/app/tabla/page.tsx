import Link from "next/link";
import { Metadata } from "next";
import MemberBadge from "@/components/MemberBadge";
import { createClient } from "@/utils/supabase/server";
import { tryCreateServiceRoleClient } from "@/utils/supabase/admin";
import { getFavoriteTeamFlagUrl, loadFavoriteTeamsByIds } from "@/lib/profile";
import {
  buildGlobalPlayerStandings,
  getCompetitionRankAtIndex,
} from "@/lib/global-ranking";

export const metadata: Metadata = {
  title: "Q26 - Tabla general",
  description: "Ranking global de la quiniela del Mundial 2026.",
};

// Se regenera cada minuto; el ranking global ya va cacheado por tag.
export const revalidate = 60;

type PublicRow = {
  id: string;
  rank: number;
  nickname: string;
  flagUrl: string | null;
  points: number;
};

/** Ranking global visible sin login: solo apodo, bandera favorita y puntos. */
async function loadPublicStandings(): Promise<PublicRow[]> {
  // Las predicciones y equipos solo son legibles con sesión; sin service role no hay tabla pública.
  const admin = tryCreateServiceRoleClient();
  const supabase = admin ?? (await createClient());

  const standings = await buildGlobalPlayerStandings(supabase);
  if (standings.length === 0) return [];

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, nickname, favorite_team_id");
  const profileById = new Map((profiles ?? []).map((p) => [p.id, p]));

  const favoriteIds =
    profiles
      ?.map((p) => p.favorite_team_id)
      .filter((id): id is number => id != null) ?? [];
  const teamsById = await loadFavoriteTeamsByIds(supabase, favoriteIds);

  const ordered = standings.map((s) => ({ ...s, points: s.totalPoints }));
  return ordered.map((s, index) => {
    const p = profileById.get(s.userId);
    const favTeam = p?.favorite_team_id
      ? teamsById.get(p.favorite_team_id)
      : null;
    return {
      id: s.userId,
      rank: getCompetitionRankAtIndex(ordered, index),
      nickname: p?.nickname || "Usuario",
      flagUrl: getFavoriteTeamFlagUrl(favTeam ?? null, 40),
      points: s.totalPoints,
    };
  });
}

const PODIUM_STYLES: Record<number, string> = {
  1: "bg-yellow-400 text-yellow-950",
  2: "bg-gray-300 text-gray-800",
  3: "bg-orange-300 text-orange-950",
};

export default async function PublicStandingsPage() {
  let rows: PublicRow[] = [];
  try {
    rows = await loadPublicStandings();
  } catch (err) {
    console.error("tabla pública:", err);
  }

  return (
    <div className="py-10 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-4xl mx-auto">
        <header className="mb-10 flex flex-col sm:flex-row justify-between items-center gap-6 text-center sm:text-left">
          <div>
            <div className="flex items-center justify-center sm:justify-start gap-3 mb-2">
              <span className="bg-blue-600 text-white px-2 py-0.5 text-[10px] font-black rounded uppercase tracking-widest">MUNDIAL 2026</span>
              <h2 className="text-[10px] text-gray-400 font-black uppercase tracking-[0.3em]">Ranking global</h2>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tighter text-gray-900 dark:text-white uppercase leading-none">TABLA <span className="text-blue-600">GENERAL</span></h1>
          </div>
          <Link
            href="/login?mode=signup"
            className="text-center bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-blue-500/30 transition-all"
          >
            Quiero jugar
          </Link>
        </header>

        <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] shadow-2xl border border-gray-100 dark:border-zinc-800 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-zinc-800/50">
                <th className="px-6 py-4 text-[9px] font-black uppercase text-gray-400 w-16 text-center">Pos</th>
                <th className="px-6 py-4 text-[9px] font-black uppercase text-gray-400">Jugador</th>
                <th className="px-6 py-4 text-[9px] font-black uppercase text-gray-400 text-right">Pts</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-zinc-800">
              {rows.map((row) => (
                <tr key={row.id}>
                  <td className="px-6 py-5 w-16 text-center">
                    <span className={`w-8 h-8 inline-flex items-center justify-center rounded-xl text-[10px] font-black ${PODIUM_STYLES[row.rank] ?? "bg-gray-50 dark:bg-zinc-800 text-gray-400"}`}>{row.rank}</span>
                  </td>
                  <td className="py-5">
                    <div className="flex items-center gap-4 min-w-0">
                      <MemberBadge flagUrl={row.flagUrl} nickname={row.nickname} />
                      <span className="font-black text-sm uppercase tracking-tighter truncate text-gray-900 dark:text-white">
                        {row.nickname}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-right font-black text-xl tracking-tighter text-gray-900 dark:text-white">
                    {row.points}
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-8 py-20 text-center text-gray-400 text-xs font-black uppercase tracking-widest opacity-50 italic">
                    Aún no hay jugadores registrados
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
