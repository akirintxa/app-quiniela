
'use client';

import { useState } from "react";
import { leavePool } from "@/app/actions";

export default function LeaveGroupButton({
  poolId,
  poolName,
  className = "",
}: {
  poolId: number;
  poolName: string;
  className?: string;
}) {
  const [loading, setLoading] = useState(false);

  const handleLeave = async () => {
    if (!confirm(`¿Estás seguro de que quieres salir del grupo "${poolName}"?`)) return;
    
    setLoading(true);
    try {
      await leavePool(poolId);
    } catch (err) {
      alert("Error al intentar salir del grupo");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button 
      onClick={handleLeave}
      disabled={loading}
      className={`min-h-11 px-5 py-3 rounded-2xl border border-red-200 dark:border-red-900/40 bg-white dark:bg-zinc-900 text-[10px] font-black uppercase tracking-widest text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors flex items-center justify-center gap-2 shrink-0 ${className}`}
    >
      {loading ? 'Saliendo...' : 'Abandonar Grupo'}
      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
    </button>
  );
}
