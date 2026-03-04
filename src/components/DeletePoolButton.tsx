'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { deletePool } from '@/app/actions';

export default function DeletePoolButton({ poolId }: { poolId: number }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!confirming) {
      setConfirming(true);
      return;
    }
    setLoading(true);
    try {
      const result = await deletePool(poolId);
      if (result?.success) {
        router.push('/groups');
        router.refresh();
      }
    } catch (error) {
      console.error("Error al eliminar la liga:", error);
      alert("Error al eliminar la liga");
      setConfirming(false);
      setLoading(false);
    }
  };

  return (
    <div className="mt-20 pt-10 border-t border-red-100 dark:border-red-900/20">
      <div className="bg-red-50/30 dark:bg-red-950/10 p-8 rounded-[3rem] border border-red-100 dark:border-red-900/20 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div>
          <h3 className="text-sm font-black text-red-600 uppercase tracking-widest mb-1">Zona Peligrosa</h3>
          <p className="text-[10px] font-bold text-red-400 uppercase tracking-tight">Esta acción eliminará la liga y a todos sus miembros de forma permanente.</p>
        </div>
        <button
          onClick={handleDelete}
          disabled={loading}
          className={`px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
            confirming 
            ? 'bg-red-600 text-white animate-pulse shadow-lg shadow-red-500/40' 
            : 'bg-white dark:bg-zinc-900 text-red-600 border border-red-200 dark:border-red-900/40 hover:bg-red-50'
          }`}
        >
          {loading ? 'Eliminando...' : confirming ? '¿ESTÁS SEGURO? CLIC DE NUEVO' : 'Eliminar Liga'}
        </button>
        {confirming && !loading && (
          <button 
            onClick={() => setConfirming(false)} 
            className="text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-gray-600"
          >
            Cancelar
          </button>
        )}
      </div>
    </div>
  );
}
