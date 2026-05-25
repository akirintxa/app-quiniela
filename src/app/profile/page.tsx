'use client';

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { updateProfile } from "../actions";
import { getTeamFlagUrl } from "@/lib/team-flag";
import { fetchProfileFields } from "@/lib/profile";
import {
  calculateFavoriteTeamBonuses,
  getTotalPointsWithFavoriteBonus,
  type FavoriteBonusAward,
} from "@/lib/favorite-bonus";
import type { Match, Prediction } from "@/types";

type Team = { id: number; name: string; iso_code: string };

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
    totalFinished: 0,
    plenos: 0,
    diferencias: 0,
    ganadores: 0,
    effectiveness: 0,
  });
  const [bonusAwards, setBonusAwards] = useState<FavoriteBonusAward[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(
    null
  );

  const [tournamentStarted, setTournamentStarted] = useState(false);

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

      const { count: startedCount } = await supabase
        .from("matches")
        .select("id", { count: "exact", head: true })
        .or("is_finished.eq.true,result_a.not.is.null");
      setTournamentStarted((startedCount ?? 0) > 0);

      const { count: finishedCount } = await supabase
        .from("matches")
        .select("*", { count: "exact", head: true })
        .eq("is_finished", true);

      const { data: preds } = await supabase
        .from("predictions")
        .select(`points_won, predicted_a, predicted_b, matches (result_a, result_b)`)
        .eq("user_id", authUser.id)
        .not("points_won", "is", null);

      if (preds) {
        let totalPoints = 0;
        let plenos = 0;
        let diferencias = 0;
        let ganadores = 0;

        preds.forEach((p) => {
          totalPoints += p.points_won || 0;
          const m = (Array.isArray(p.matches) ? p.matches[0] : p.matches) as {
            result_a: number;
            result_b: number;
          } | null;
          if (m && m.result_a !== null) {
            const isPleno =
              p.predicted_a === m.result_a && p.predicted_b === m.result_b;
            const isDif = p.predicted_a - p.predicted_b === m.result_a - m.result_b;
            const isWinner =
              Math.sign(p.predicted_a - p.predicted_b) ===
              Math.sign(m.result_a - m.result_b);

            if (isPleno) plenos++;
            else if (isDif) diferencias++;
            else if (isWinner) ganadores++;
          }
        });

        const totalAciertos = plenos + diferencias + ganadores;

        let favoriteBonus = { total: 0, awards: [] as FavoriteBonusAward[] };
        const favId = profileFields?.favorite_team_id;
        if (favId) {
          const [{ data: groupMatches }, { data: knockoutMatches }] =
            await Promise.all([
              supabase
                .from("matches")
                .select("*, team_a:teams!team_a_id(*), team_b:teams!team_b_id(*)")
                .eq("stage", "group"),
              supabase
                .from("matches")
                .select("*, team_a:teams!team_a_id(*), team_b:teams!team_b_id(*)")
                .neq("stage", "group"),
            ]);
          let finalPrediction: Prediction | null = null;
          const finalMatch = (knockoutMatches as Match[] | null)?.find(
            (m) => m.stage === "final"
          );
          if (finalMatch) {
            const { data: fp } = await supabase
              .from("predictions")
              .select("*")
              .eq("user_id", authUser.id)
              .eq("match_id", finalMatch.id)
              .maybeSingle();
            finalPrediction = (fp as Prediction) ?? null;
          }
          favoriteBonus = calculateFavoriteTeamBonuses(favId, {
            groupMatches: (groupMatches || []) as Match[],
            knockoutMatches: (knockoutMatches || []) as Match[],
            finalPrediction,
          });
        }
        setBonusAwards(favoriteBonus.awards);
        setStats({
          points: getTotalPointsWithFavoriteBonus(totalPoints, favoriteBonus),
          bonusPoints: favoriteBonus.total,
          predicted: preds.length,
          totalFinished: finishedCount || 0,
          plenos,
          diferencias,
          ganadores,
          effectiveness:
            preds.length > 0
              ? Math.round((totalAciertos / preds.length) * 100)
              : 0,
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
            suffix={`/ ${stats.totalFinished}`}
            accent="text-green-500"
          />
          <StatCard
            label="Diferencias"
            value={stats.diferencias}
            suffix={`/ ${stats.totalFinished}`}
            accent="text-yellow-500"
          />
          <StatCard
            label="Ganadores"
            value={stats.ganadores}
            suffix={`/ ${stats.totalFinished}`}
            accent="text-orange-500"
          />
        </div>

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
            <div className="text-2xl font-black">
              {stats.predicted} / {stats.totalFinished}
            </div>
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
              {tournamentStarted && (
                <span className="ml-2 text-[8px] text-orange-500 normal-case">
                  (bloqueado: ya hay resultados oficiales)
                </span>
              )}
            </label>
            <select
              id="favorite_team_id"
              name="favorite_team_id"
              value={selectedTeamId}
              onChange={(e) => setSelectedTeamId(e.target.value)}
              disabled={tournamentStarted}
              className={`w-full rounded-2xl px-5 py-4 bg-gray-50 dark:bg-zinc-800 border-none outline-none font-black uppercase text-sm focus:ring-2 focus:ring-blue-600 appearance-none ${
                tournamentStarted ? "opacity-60 cursor-not-allowed" : ""
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
