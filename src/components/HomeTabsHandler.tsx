'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function HomeTabsHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const view = searchParams.get('view');
  const group = searchParams.get('group');

  useEffect(() => {
    // 1. Si hay una vista en la URL, la guardamos
    if (view) {
      localStorage.setItem('home_last_view', view);
      if (view === 'groups' && group) {
        localStorage.setItem('home_last_group', group);
      }
    } 
    // 2. Si NO hay vista en la URL, redirigimos a la última guardada o a 'groups' por defecto
    else {
      const lastView = localStorage.getItem('home_last_view') || 'groups';
      const lastGroup = localStorage.getItem('home_last_group') || 'A';
      
      let url = `/?view=${lastView}`;
      if (lastView === 'groups') {
        url += `&group=${lastGroup}`;
      }
      
      router.replace(url);
    }
  }, [view, group, router]);

  return null;
}
