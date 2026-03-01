
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
      className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 transition-all active:scale-95 shadow-sm ${
        loading 
          ? 'bg-gray-100 text-gray-400 border-gray-100' 
          : 'bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20 border-orange-100 dark:border-orange-900/30 text-orange-600 dark:text-orange-400 hover:border-orange-300 hover:shadow-orange-500/10'
      }`}
      title="Rellenar grupo aleatoriamente"
    >
      <span className="text-[10px] font-black uppercase tracking-widest">
        {loading ? 'Sorteando...' : '¡Una Ayudaíta!'}
      </span>
      <span className={`text-sm ${loading ? 'animate-spin' : 'animate-bounce'}`}>🎲</span>
    </button>
  );
}
