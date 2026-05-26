'use client';

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Match } from "@/types";
import {
  startMatch,
  updateLiveScore,
  finalizeMatch,
  resetMatch,
} from "@/app/actions";
import { getMatchAdminStatus } from "@/lib/match-admin";

interface AdminMatchRowProps {
  match: Match;
}

export default function AdminMatchRow({ match }: AdminMatchRowProps) {
  const router = useRouter();
  const status = useMemo(() => getMatchAdminStatus(match), [match]);

  const [resultA, setResultA] = useState<number | string>(
    match.result_a !== null ? match.result_a : ""
  );
  const [resultB, setResultB] = useState<number | string>(
    match.result_b !== null ? match.result_b : ""
  );
  const [winnerId, setWinnerId] = useState<number | null>(match.winner_id ?? null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isKnockout = match.stage !== "group";
  const isDraw =
    resultA !== "" && resultB !== "" && Number(resultA) === Number(resultB);

  useEffect(() => {
    setResultA(match.result_a !== null ? match.result_a : "");
    setResultB(match.result_b !== null ? match.result_b : "");
    setWinnerId(match.winner_id ?? null);
    setErrorMsg(null);
  }, [
    match.result_a,
    match.result_b,
    match.winner_id,
    match.is_locked,
    match.is_finished,
  ]);

  const runAction = async (fn: () => Promise<{ ok: boolean; error?: string }>) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fn();
      if (!res.ok) {
        setErrorMsg(res.error || "Error desconocido");
        return;
      }
      router.refresh();
    } catch {
      setErrorMsg("Error de red o servidor");
    } finally {
      setLoading(false);
    }
  };

  const validateScores = (): boolean => {
    if (resultA === "" || resultB === "") {
      setErrorMsg("Introduce marcador para ambos equipos");
      return false;
    }
    if (isKnockout && isDraw && !winnerId) {
      setErrorMsg("En eliminatorias con empate, indica quién pasa de ronda");
      return false;
    }
    return true;
  };

  const handleStart = () =>
    runAction(() => startMatch(match.id));

  const handleLiveUpdate = () => {
    if (!validateScores()) return;
    return runAction(() =>
      updateLiveScore(match.id, Number(resultA), Number(resultB), winnerId)
    );
  };

  const handleFinalize = () => {
    if (!validateScores()) return;
    if (!confirm("¿Finalizar partido? El marcador quedará cerrado.")) return;
    return runAction(() =>
      finalizeMatch(match.id, Number(resultA), Number(resultB), winnerId)
    );
  };

  const handleSaveCorrection = () => {
    if (!validateScores()) return;
    if (
      !confirm(
        "Este partido ya está cerrado. ¿Guardar corrección del marcador? Se recalcularán los puntos de este partido para todos los usuarios."
      )
    ) {
      return;
    }
    return runAction(() =>
      finalizeMatch(match.id, Number(resultA), Number(resultB), winnerId)
    );
  };

  const handleReset = () => {
    if (
      !confirm(
        "¿Reiniciar partido? Se borrarán marcador y puntos de este partido para todos."
      )
    ) {
      return;
    }
    return runAction(() => resetMatch(match.id));
  };

  const statusLabel =
    status === "finished"
      ? "Finalizado"
      : status === "live"
        ? "En vivo"
        : "Sin iniciar";

  const statusClass =
    status === "finished"
      ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
      : status === "live"
        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
        : "bg-gray-100 text-gray-500 dark:bg-zinc-800 dark:text-zinc-400";

  const scoreInputsDisabled = loading || status === "scheduled";
  const pasaDisabled = loading || status === "scheduled";

  return (
    <div
      className={`p-6 flex flex-col gap-4 border-b border-gray-50 dark:border-zinc-800 last:border-0 ${
        status === "live" ? "bg-green-50/30 dark:bg-green-950/10" : ""
      } ${status === "finished" ? "bg-blue-50/20 dark:bg-blue-900/5" : ""}`}
    >
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-6">
        <div className="flex flex-wrap items-center gap-4 min-w-0">
          <span
            className={`shrink-0 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${statusClass}`}
          >
            {statusLabel}
          </span>
          <span className="font-black text-xs uppercase truncate max-w-[7rem] sm:max-w-none text-right sm:text-right">
            {match.team_a?.name}
          </span>
          <div className="flex items-center gap-2">
            <div className="flex flex-col items-center">
              <input
                type="number"
                min={0}
                value={resultA}
                onChange={(e) =>
                  setResultA(e.target.value === "" ? "" : Number(e.target.value))
                }
                disabled={scoreInputsDisabled}
                placeholder="–"
                className="w-14 h-14 text-center text-xl font-black bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl disabled:opacity-50"
              />
              {isKnockout && isDraw && status !== "scheduled" && (
                <button
                  type="button"
                  onClick={() => setWinnerId(match.team_a_id)}
                  disabled={pasaDisabled}
                  className={`mt-1 text-[8px] font-black uppercase px-2 py-0.5 rounded-md border ${
                    winnerId === match.team_a_id
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white dark:bg-zinc-800 text-gray-400 border-gray-200"
                  }`}
                >
                  Pasa
                </button>
              )}
            </div>
            <span className="font-black text-gray-300 text-lg">:</span>
            <div className="flex flex-col items-center">
              <input
                type="number"
                min={0}
                value={resultB}
                onChange={(e) =>
                  setResultB(e.target.value === "" ? "" : Number(e.target.value))
                }
                disabled={scoreInputsDisabled}
                placeholder="–"
                className="w-14 h-14 text-center text-xl font-black bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl disabled:opacity-50"
              />
              {isKnockout && isDraw && status !== "scheduled" && (
                <button
                  type="button"
                  onClick={() => setWinnerId(match.team_b_id)}
                  disabled={pasaDisabled}
                  className={`mt-1 text-[8px] font-black uppercase px-2 py-0.5 rounded-md border ${
                    winnerId === match.team_b_id
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white dark:bg-zinc-800 text-gray-400 border-gray-200"
                  }`}
                >
                  Pasa
                </button>
              )}
            </div>
          </div>
          <span className="font-black text-xs uppercase truncate max-w-[7rem] sm:max-w-none">
            {match.team_b?.name}
          </span>
        </div>

        <div className="flex flex-wrap gap-2 justify-end">
          {status === "scheduled" && (
            <button
              type="button"
              onClick={handleStart}
              disabled={loading}
              className="px-5 py-3 bg-green-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-green-700 shadow-lg shadow-green-500/20 disabled:opacity-50"
            >
              Iniciar 0-0
            </button>
          )}

          {status === "live" && (
            <>
              <button
                type="button"
                onClick={handleLiveUpdate}
                disabled={loading}
                className="px-4 py-3 bg-zinc-800 dark:bg-zinc-700 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:opacity-90 disabled:opacity-50"
              >
                Actualizar marcador
              </button>
              <button
                type="button"
                onClick={handleFinalize}
                disabled={loading}
                className="px-4 py-3 bg-red-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-red-700 shadow-lg shadow-red-500/20 disabled:opacity-50"
              >
                Finalizar
              </button>
              <button
                type="button"
                onClick={handleReset}
                disabled={loading}
                title="Reiniciar"
                className="p-3 bg-gray-100 dark:bg-zinc-800 text-gray-400 hover:text-red-500 rounded-xl"
              >
                ↺
              </button>
            </>
          )}

          {status === "finished" && (
            <>
              <span className="px-4 py-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-xl font-black text-[10px] uppercase tracking-widest self-center">
                Cerrado
              </span>
              <button
                type="button"
                onClick={handleSaveCorrection}
                disabled={loading}
                className="px-4 py-3 bg-amber-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-amber-700 shadow-lg shadow-amber-500/20 disabled:opacity-50"
              >
                Guardar corrección
              </button>
              <button
                type="button"
                onClick={handleReset}
                disabled={loading}
                title="Reiniciar partido"
                className="p-3 bg-gray-100 dark:bg-zinc-800 text-gray-400 hover:text-red-500 rounded-xl"
              >
                ↺
              </button>
            </>
          )}
        </div>
      </div>

      {errorMsg && (
        <p className="text-[10px] font-bold text-red-600 uppercase tracking-wide">
          {errorMsg}
        </p>
      )}
    </div>
  );
}
