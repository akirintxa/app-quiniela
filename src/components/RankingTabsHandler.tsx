'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function RankingTabsHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const poolId = searchParams.get('pool');

  useEffect(() => {
    // 1. Si hay un poolId en la URL, lo guardamos como el último visitado
    if (poolId) {
      localStorage.setItem('last_pool_viewed', poolId);
    } 
    // 2. Si NO hay poolId pero tenemos uno guardado en localStorage, redirigimos
    else {
      const lastPool = localStorage.getItem('last_pool_viewed');
      // Solo redirigimos si estamos en la ruta base de /ranking (sin ?view_user=...)
      if (lastPool && !searchParams.has('view_user')) {
        router.replace(`/ranking?pool=${lastPool}`);
      }
    }
  }, [poolId, router, searchParams]);

  return null;
}
