'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function GroupForms({ createPool, joinPool }: { createPool: (fd: FormData) => Promise<void>, joinPool: (fd: FormData) => Promise<void> }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Mapeo de errores y mensajes
  const getDisplayMessage = () => {
    const error = searchParams.get('error');
    const message = searchParams.get('message');

    if (error === 'invalid_code') return { text: 'Código inválido o grupo no encontrado', type: 'error' };
    if (error === 'already_member') return { text: 'Ya perteneces a este grupo', type: 'error' };
    if (error === 'join_failed') return { text: 'Error al unirse al grupo', type: 'error' };
    if (message === 'success_create') return { text: 'Liga creada con éxito', type: 'success' };
    
    return null;
  };

  const [localMsg, setLocalMsg] = useState<{ text: string, type: string } | null>(getDisplayMessage());

  useEffect(() => {
    setLocalMsg(getDisplayMessage());
  }, [searchParams]);

  const clearMessages = () => {
    if (localMsg) {
      setLocalMsg(null);
      // Limpiamos la URL sin scroll y sin recargar
      router.replace('/groups', { scroll: false });
    }
  };

  return (
    <div className="space-y-6">
      {/* MENSAJES UBICADOS AQUÍ CON TRADUCCIÓN LIMPIA */}
      {localMsg && (
        <div className={`p-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-center animate-in fade-in slide-in-from-top-2 border ${localMsg.type === 'error' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-green-50 text-green-600 border-green-100'}`}>
          {localMsg.text}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] border border-gray-100 dark:border-zinc-800 shadow-sm">
          <h2 className="text-[10px] font-black mb-6 uppercase tracking-[0.2em] text-gray-400">Nueva Liga</h2>
          <form action={createPool} className="flex flex-col gap-3">
            <input 
              name="name" 
              type="text" 
              placeholder="NOMBRE" 
              onFocus={clearMessages}
              onChange={clearMessages}
              className="rounded-xl px-5 py-3 bg-gray-50 dark:bg-zinc-800 border-none outline-none focus:ring-2 focus:ring-blue-500 font-black uppercase text-xs text-zinc-900 dark:text-white" 
              required 
            />
            <button className="bg-zinc-900 dark:bg-white text-white dark:text-black py-3 rounded-xl font-black uppercase tracking-widest text-[9px] hover:opacity-90 transition-all">Crear Grupo</button>
          </form>
        </div>
        <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] border border-gray-100 dark:border-zinc-800 shadow-sm">
          <h2 className="text-[10px] font-black mb-6 uppercase tracking-[0.2em] text-gray-400">Unirse</h2>
          <form action={joinPool} className="flex flex-col gap-3">
            <input 
              name="code" 
              type="text" 
              placeholder="CÓDIGO" 
              onFocus={clearMessages}
              onChange={clearMessages}
              className="rounded-xl px-5 py-3 bg-gray-50 dark:bg-zinc-800 border-none outline-none focus:ring-2 focus:ring-blue-500 font-black text-center uppercase tracking-widest text-xs text-zinc-900 dark:text-white" 
              required 
            />
            <button className="bg-blue-600 text-white py-3 rounded-xl font-black uppercase tracking-widest text-[9px] hover:bg-blue-700 transition-all">Unirme ahora</button>
          </form>
        </div>
      </div>
    </div>
  );
}
