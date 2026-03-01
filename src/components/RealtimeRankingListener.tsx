'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

export default function RealtimeRankingListener() {
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    // Escuchar cambios en la tabla de predicciones
    // Específicamente cuando se actualizan los puntos ganados
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'predictions',
        },
        () => {
          // Refrescar los datos del servidor (re-ejecuta el Server Component)
          router.refresh();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [router, supabase]);

  return null; // Este componente no renderiza nada, solo escucha
}
