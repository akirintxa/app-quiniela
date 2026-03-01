'use client';

import { useState } from "react";
import { Match } from "@/types";
import { updateLiveScore, finalizeMatch, toggleMatchLock, resetMatch } from "@/app/actions";

interface AdminMatchRowProps {
  match: Match & { is_locked?: boolean, is_finished?: boolean };
}

export default function AdminMatchRow({ match }: AdminMatchRowProps) {
  const [resultA, setResultA] = useState<number | string>(match.result_a ?? "");
  const [resultB, setResultB] = useState<number | string>(match.result_b ?? "");
  const [loading, setLoading] = useState(false);
  const [isLocked, setIsLocked] = useState(match.is_locked || false);

  const handleLiveUpdate = async () => {
    if (resultA === "" || resultB === "") return;
    setLoading(true);
    try {
      await updateLiveScore(match.id, Number(resultA), Number(resultB));
      setIsLocked(true);
    } catch (error) {
      alert("Error al actualizar");
    } finally {
      setLoading(false);
    }
  };

  const handleFinalize = async () => {
    if (resultA === "" || resultB === "") return;
    if (!confirm("¿Finalizar partido y repartir puntos?")) return;
    
    setLoading(true);
    try {
      await finalizeMatch(match.id, Number(resultA), Number(resultB));
    } catch (error) {
      alert("Error al finalizar");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    if (!confirm("¿REINICIAR PARTIDO? Se borrarán los goles y los PUNTOS de todos los usuarios.")) return;
    
    setLoading(true);
    try {
      await resetMatch(match.id);
      setResultA("");
      setResultB("");
      setIsLocked(false);
    } catch (error) {
      alert("Error al reiniciar");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleLock = async () => {
    setLoading(true);
    try {
      await toggleMatchLock(match.id, !isLocked);
      setIsLocked(!isLocked);
    } catch (error) {
      alert("Error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`p-6 flex flex-col lg:flex-row items-center justify-between gap-6 transition-all ${match.is_finished ? 'bg-blue-50/20 dark:bg-blue-900/5' : ''}`}>
      <div className="flex-1 flex items-center gap-6">
        <button 
          onClick={handleToggleLock}
          disabled={loading || match.is_finished}
          className={`w-12 h-12 rounded-2xl flex items-center justify-center border-2 transition-all ${isLocked ? 'bg-red-50 border-red-100 text-red-500' : 'bg-green-50 border-green-100 text-green-500'}`}
        >
          {isLocked ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></svg>
          )}
        </button>

        <div className="flex items-center gap-4">
          <span className="font-black text-xs uppercase w-20 text-right truncate">{match.team_a?.name}</span>
          <div className="flex items-center gap-2">
            <input 
              type="number" 
              value={resultA}
              onChange={(e) => setResultA(e.target.value === "" ? "" : Number(e.target.value))}
              disabled={match.is_finished}
              className="w-12 h-12 text-center text-xl font-black bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl"
            />
            <span className="font-black text-gray-300">:</span>
            <input 
              type="number" 
              value={resultB}
              onChange={(e) => setResultB(e.target.value === "" ? "" : Number(e.target.value))}
              disabled={match.is_finished}
              className="w-12 h-12 text-center text-xl font-black bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl"
            />
          </div>
          <span className="font-black text-xs uppercase w-20 text-left truncate">{match.team_b?.name}</span>
        </div>
      </div>

      <div className="flex gap-2">
        {match.is_finished ? (
          <>
            <span className="px-6 py-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl font-black text-[10px] uppercase tracking-widest border border-blue-200 dark:border-blue-800">
              Finalizado
            </span>
            <button 
              onClick={handleReset}
              disabled={loading}
              className="p-3 bg-gray-100 dark:bg-zinc-800 text-gray-400 hover:text-red-500 rounded-xl transition-all"
              title="Reiniciar partido"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
            </button>
          </>
        ) : (
          <>
            <button 
              onClick={handleLiveUpdate}
              disabled={loading || resultA === "" || resultB === ""}
              className="px-4 py-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-zinc-200 transition-all"
            >
              Vivo
            </button>
            <button 
              onClick={handleFinalize}
              disabled={loading || resultA === "" || resultB === ""}
              className="px-4 py-3 bg-red-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-red-700 transition-all shadow-lg shadow-red-500/20"
            >
              Finalizar
            </button>
            {(match.result_a !== null || isLocked) && (
              <button 
                onClick={handleReset}
                disabled={loading}
                className="p-3 bg-gray-100 dark:bg-zinc-800 text-gray-400 hover:text-red-500 rounded-xl transition-all"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
