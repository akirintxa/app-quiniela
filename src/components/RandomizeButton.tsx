
'use client';

import { useState } from "react";
import { randomizeGroupPredictions, randomizeKnockoutPredictions } from "@/app/actions";

export default function RandomizeButton({ groupId, stage }: { groupId?: string, stage?: string }) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    const context = groupId ? `el Grupo ${groupId}` : "esta fase";
    if (!confirm(`¿Rellenar ${context} con pronósticos al azar? Se sobrescribirán los que ya tengas.`)) return;
    
    setLoading(true);
    try {
      if (groupId) {
        await randomizeGroupPredictions(groupId);
      } else if (stage) {
        await randomizeKnockoutPredictions(stage);
      }
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
      className={`flex items-center gap-2 px-6 py-3 rounded-2xl border-2 transition-all active:scale-95 shadow-xl ${
        loading
          ? 'bg-gray-100 text-gray-400 border-gray-100'
          : 'bg-gradient-to-r from-orange-500 to-amber-500 border-orange-400 text-white hover:from-orange-600 hover:to-amber-600 hover:shadow-orange-500/20'
      }`}
      title="Rellenar grupo aleatoriamente"
    >
      <span className="text-[11px] font-black uppercase tracking-widest">
        {loading ? 'Sorteando...' : '¡Una Ayudaíta!'}
      </span>
      <span className={`text-lg ${loading ? 'animate-spin' : 'animate-bounce'}`}>🎲</span>
    </button>
  );
}
