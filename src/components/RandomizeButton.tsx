
'use client';

import { useState } from "react";
import { randomizeGroupPredictions } from "@/app/actions";

export default function RandomizeButton({ groupId }: { groupId: string }) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    if (!confirm("¿Rellenar este grupo con pronósticos al azar? Se sobrescribirán los que ya tengas.")) return;
    setLoading(true);
    try {
      await randomizeGroupPredictions(groupId);
    } catch (err) {
      alert("Error al aleatorizar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button 
      onClick={handleClick}
      disabled={loading}
      className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 transition-all active:scale-95 ${
        loading 
          ? 'bg-gray-100 text-gray-400 border-gray-100' 
          : 'bg-white dark:bg-zinc-900 border-gray-100 dark:border-zinc-800 text-gray-400 hover:border-blue-500 hover:text-blue-600'
      }`}
      title="Rellenar grupo aleatoriamente"
    >
      <span className="text-[10px] font-black uppercase tracking-widest">
        {loading ? 'Sorteando...' : '¡Una Ayudaíta!'}
      </span>
      <span className={loading ? 'animate-spin' : ''}>🎲</span>
    </button>
  );
}
