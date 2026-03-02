'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function RankingTabsHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const poolId = searchParams.get('pool');

  useEffect(() => {
    // 1. Si hay un poolId en la URL, lo guardamos (sea una liga o 'all')
    if (poolId) {
      localStorage.setItem('last_pool_viewed', poolId);
    } 
    // 2. Si entramos a /ranking limpio (sin parámetros)
    else if (searchParams.toString() === '') {
      const lastPool = localStorage.getItem('last_pool_viewed');
      // Redirigimos solo si el último visto era una liga específica
      if (lastPool && lastPool !== 'all') {
        router.replace(`/ranking?pool=${lastPool}`);
      }
    }
  }, [poolId, router, searchParams]);

  return null;
}
