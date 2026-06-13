'use client';

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";
import { getIsAppAdmin, updateProfile } from "../actions";
import { getTeamFlagUrl } from "@/lib/team-flag";
import { fetchProfileFields } from "@/lib/profile";
import {
  calculateFavoriteTeamBonuses,
  getTotalPointsWithFavoriteBonus,
  type FavoriteBonusAward,
} from "@/lib/favorite-bonus";
import { aggregateProfileStats } from "@/lib/profile-stats";
import { isFavoriteTeamChangeLocked } from "@/lib/tournament";
import type { Match, Team } from "@/types";

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [nickname, setNickname] = useState("");
  const [selectedTeamId, setSelectedTeamId] = useState("");
  const [teams, setTeams] = useState<Team[]>([]);
  const [stats, setStats] = useState({
    points: 0,
    bonusPoints: 0,
    predicted: 0,
    plenos: 0,
    diferencias: 0,
    ganadores: 0,
    effectiveness: 0,
  });
  const [bonusAwards, setBonusAwards] = useState<FavoriteBonusAward[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(
    null
  );

  const [favoriteTeamLocked, setFavoriteTeamLocked] = useState(false);

  const favoriteTeam = useMemo(
    () => teams.find((t) => String(t.id) === selectedTeamId) ?? null,
    [teams, selectedTeamId]
  );

  const flagUrl = getTeamFlagUrl(favoriteTeam, 80);

  useEffect(() => {
    async function loadData() {
      const supabase = createClient();
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();
      if (!authUser) {
        window.location.href = "/login";
        return;
      }
      setUser(authUser);

      let profileFields: Awaited<ReturnType<typeof fetchProfileFields>> = null;
      try {
        profileFields = await fetchProfileFields(supabase, authUser.id);
        if (profileFields) {
          setNickname(
            profileFields.nickname ||
              authUser.user_metadata?.nickname ||
              authUser.email?.split("@")[0] ||
              ""
          );
          setSelectedTeamId(profileFields.favorite_team_id?.toString() || "");
        } else {
          setNickname(
            authUser.user_metadata?.nickname || authUser.email?.split("@")[0] || ""
          );
        }
      } catch (err) {
        console.error("load profile:", err);
        setNickname(
          authUser.user_metadata?.nickname || authUser.email?.split("@")[0] || ""
        );
      }

      const { data: groupMatches } = await supabase
        .from("matches")
        .select("team_a_id, team_b_id")
        .eq("stage", "group");
      if (groupMatches) {
        const teamIds = Array.from(
          new Set(groupMatches.flatMap((m) => [m.team_a_id, m.team_b_id]))
        );
        const { data: teamsData } = await supabase
          .from("teams")
          .select("id, name, iso_code")
          .in("id", teamIds)
          .order("name");
        setTeams((teamsData as Team[]) || []);
      }

      setFavoriteTeamLocked(await isFavoriteTeamChangeLocked(supabase));
      setIsAdmin(await getIsAppAdmin());

      const { data: preds } = await supabase
        .from("predictions")
        .select(
          `points_won, predicted_a, predicted_b, predicted_winner_id, matches (result_a, result_b, stage, winner_id, team_a_id, team_b_id)`
        )
        .eq("user_id", authUser.id)
        .not("points_won", "is", null);

      if (preds) {
        const matchStats = aggregateProfileStats(preds);

        let favoriteBonus = { total: 0, awards: [] as FavoriteBonusAward[] };
        const favId = profileFields?.favorite_team_id;
        if (favId) {
          const [{ data: groupMatches }, { data: knockoutMatches }, { data: allTeamsRows }] =
            await Promise.all([
              supabase
                .from("matches")
                .select("*, team_a:teams!team_a_id(*), team_b:teams!team_b_id(*)")
                .eq("stage", "group"),
              supabase
                .from("matches")
                .select("*, team_a:teams!team_a_id(*), team_b:teams!team_b_id(*)")
                .neq("stage", "group"),
              supabase.from("teams").select("*"),
            ]);
          favoriteBonus = calculateFavoriteTeamBonuses(favId, {
            groupMatches: (groupMatches || []) as Match[],
            knockoutMatches: (knockoutMatches || []) as Match[],
            allTeams: (allTeamsRows || []) as Team[],
          });
        }
        setBonusAwards(favoriteBonus.awards);
        setStats({
          points: getTotalPointsWithFavoriteBonus(
            matchStats.matchPoints,
            favoriteBonus
          ),
          bonusPoints: favoriteBonus.total,
          predicted: matchStats.scoredPredictions,
          plenos: matchStats.plenos,
          diferencias: matchStats.diferencias,
          ganadores: matchStats.ganadores,
          effectiveness: matchStats.effectiveness,
        });
      }

      setLoading(false);
    }
    loadData();
  }, []);

  const reloadProfile = async (userId: string) => {
    try {
      const supabase = createClient();
      const fields = await fetchProfileFields(supabase, userId);
      if (!fields) return;
      if (fields.nickname) setNickname(fields.nickname);
      setSelectedTeamId(fields.favorite_team_id?.toString() || "");
    } catch (err) {
      console.error("reloadProfile:", err);
    }
  };

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;
    setUpdating(true);
    setMessage(null);
    const formData = new FormData(e.currentTarget);
    const result = await updateProfile(formData);
    if (result?.success) {
      await reloadProfile(user.id);
      setMessage({ type: "success", text: "Perfil actualizado" });
      window.dispatchEvent(new Event("profile-updated"));
      router.refresh();
    } else {
      setMessage({ type: "error", text: result?.error || "Error al guardar" });
    }
    setUpdating(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center font-black text-xs uppercase tracking-widest opacity-50">
        Cargando perfil...
      </div>
    );
  }

  return (
    <div className="py-6 sm:py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-2xl mx-auto space-y-8">
        <header className="text-center">
          <div className="mx-auto mb-4 w-20 h-14 sm:w-24 sm:h-16 rounded-2xl overflow-hidden border-2 border-gray-100 dark:border-zinc-800 shadow-lg bg-gray-50 dark:bg-zinc-900 flex items-center justify-center">
            {flagUrl ? (
              <img
                src={flagUrl}
                alt={favoriteTeam?.name || "Equipo favorito"}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-2xl font-black text-gray-300 dark:text-zinc-600">
                ?
              </span>
            )}
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white uppercase tracking-tighter leading-none">
            {nickname || "Tu perfil"}
          </h1>
          {favoriteTeam && (
            <p className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest mt-2">
              {favoriteTeam.name}
            </p>
          )}
          <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.25em] mt-1">
            {user?.email}
          </p>
        </header>

        {isAdmin && (
          <Link
            href="/admin"
            className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800/80 text-[10px] font-black uppercase tracking-widest text-zinc-700 dark:text-zinc-200 hover:border-blue-500 hover:text-blue-600 transition-all"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            Panel de administración
          </Link>
        )}

        {bonusAwards.length > 0 && (
          <div className="bg-orange-50 dark:bg-orange-950/30 border border-orange-100 dark:border-orange-900/40 rounded-3xl p-5 space-y-2">
            <p className="text-[9px] font-black uppercase tracking-widest text-orange-700 dark:text-orange-400">
              Bono equipo favorito (+{stats.bonusPoints})
            </p>
            <ul className="space-y-1.5">
              {bonusAwards.map((a) => (
                <li
                  key={a.key}
                  className="flex justify-between text-[10px] font-bold text-gray-700 dark:text-zinc-300"
                >
                  <span>{a.label}</span>
                  <span className="text-orange-600 font-black">+{a.points}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard
            label="Puntos"
            value={String(stats.points)}
            accent="text-blue-600"
            hint={
              stats.bonusPoints > 0
                ? `incl. +${stats.bonusPoints} favorito`
                : undefined
            }
          />
          <StatCard
            label="Plenos"
            value={stats.plenos}
            suffix={`/ ${stats.predicted}`}
            accent="text-green-500"
          />
          <StatCard
            label="Diferencias"
            value={stats.diferencias}
            suffix={`/ ${stats.predicted}`}
            accent="text-yellow-500"
          />
          <StatCard
            label="Ganadores"
            value={stats.ganadores}
            suffix={`/ ${stats.predicted}`}
            accent="text-orange-500"
          />
        </div>

        <p className="text-[10px] text-gray-400 dark:text-zinc-500 leading-relaxed px-1 -mt-1">
          Cada partido puntuado entra en una sola categoría: pleno, diferencia o
          ganador (en ese orden). La diferencia exige acertar el margen y el
          resultado (no vale al revés, p. ej. 2-1 ≠ 0-1). Si acertaste ganador y
          diferencia, cuenta como{" "}
          <span className="font-bold text-yellow-600 dark:text-yellow-500">
            diferencia
          </span>
          . Los aciertos solo de goles (+1A/+1B) suman puntos pero no aparecen
          arriba.{" "}
          <span className="font-bold">Efectividad</span> = % de partidos en los que
          acertaste quién ganó o si hubo empate (90&apos;).
        </p>

        <div className="bg-blue-600 p-5 rounded-3xl text-white shadow-xl shadow-blue-500/20 flex justify-between px-4">
          <div>
            <span className="text-[8px] font-black uppercase tracking-widest opacity-80">
              Efectividad
            </span>
            <div className="text-2xl font-black">{stats.effectiveness}%</div>
          </div>
          <div className="text-right">
            <span className="text-[8px] font-black uppercase tracking-widest opacity-80">
              Jugados
            </span>
            <div className="text-2xl font-black">{stats.predicted}</div>
          </div>
        </div>

        <form onSubmit={handleUpdate} className="bg-white dark:bg-zinc-900 p-6 sm:p-8 rounded-[2.5rem] shadow-xl border border-gray-100 dark:border-zinc-800 space-y-5">
          <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
            Editar perfil
          </h2>

          <div>
            <label
              htmlFor="nickname"
              className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2"
            >
              Nickname
            </label>
            <input
              id="nickname"
              name="nickname"
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="w-full rounded-2xl px-5 py-4 bg-gray-50 dark:bg-zinc-800 border-none outline-none font-black uppercase text-sm focus:ring-2 focus:ring-blue-600 transition-all text-zinc-900 dark:text-white"
              required
            />
          </div>

          <div>
            <label
              htmlFor="favorite_team_id"
              className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2"
            >
              Equipo favorito
              {favoriteTeamLocked && (
                <span className="ml-2 text-[8px] text-orange-500 normal-case">
                  (bloqueado: todos los equipos ya jugaron al menos un partido)
                </span>
              )}
            </label>
            <select
              id="favorite_team_id"
              name="favorite_team_id"
              value={selectedTeamId}
              onChange={(e) => setSelectedTeamId(e.target.value)}
              disabled={favoriteTeamLocked}
              className={`w-full rounded-2xl px-5 py-4 bg-gray-50 dark:bg-zinc-800 border-none outline-none font-black uppercase text-sm focus:ring-2 focus:ring-blue-600 appearance-none ${
                favoriteTeamLocked ? "opacity-60 cursor-not-allowed" : ""
              }`}
            >
              <option value="">Sin equipo</option>
              {teams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </select>
          </div>

          <button
            disabled={updating}
            type="submit"
            className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black uppercase tracking-[0.2em] text-xs hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 active:scale-[0.98] disabled:opacity-60"
          >
            {updating ? "Guardando..." : "Guardar cambios"}
          </button>

          {message && (
            <p
              className={`text-center text-[10px] font-black uppercase tracking-widest ${
                message.type === "success" ? "text-green-600" : "text-red-600"
              }`}
            >
              {message.text}
            </p>
          )}
        </form>

        <form action="/auth/signout" method="post">
          <button
            type="submit"
            className="w-full bg-red-50/50 dark:bg-red-950/10 text-red-600 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] border border-red-100 dark:border-red-900/20 hover:bg-red-600 hover:text-white transition-all"
          >
            Cerrar sesión
          </button>
        </form>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  suffix,
  hint,
  accent,
}: {
  label: string;
  value: string | number;
  suffix?: string;
  hint?: string;
  accent: string;
}) {
  return (
    <div className="bg-white dark:bg-zinc-900 p-4 rounded-3xl border border-gray-100 dark:border-zinc-800 text-center shadow-sm">
      <div className={`text-2xl font-black mb-1 ${accent}`}>
        {value}
        {suffix && (
          <span className="text-[10px] font-black text-gray-300 ml-0.5">{suffix}</span>
        )}
      </div>
      <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">
        {label}
      </span>
      {hint && (
        <span className="text-[7px] font-bold text-orange-500 uppercase tracking-widest block mt-1">
          {hint}
        </span>
      )}
    </div>
  );
}
