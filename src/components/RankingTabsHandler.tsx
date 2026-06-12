'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function RankingTabsHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const poolId = searchParams.get('pool');

  useEffect(() => {
    if (poolId) {
      localStorage.setItem('last_pool_viewed', poolId);
    } else if (searchParams.toString() === '') {
      const lastPool = localStorage.getItem('last_pool_viewed') ?? 'all';
      router.replace(`/ranking?pool=${lastPool}&view=players`);
    }
  }, [poolId, router, searchParams]);

  return null;
}
