'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function HomeTabsHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const view = searchParams.get('view');
  const group = searchParams.get('group');
  const stage = searchParams.get('stage');

  useEffect(() => {
    // 1. Si hay una vista en la URL, la guardamos
    if (view) {
      localStorage.setItem('home_last_view', view);
      if (view === 'groups' && group) {
        localStorage.setItem('home_last_group', group);
      }
      if (view === 'knockout' && stage) {
        localStorage.setItem('home_last_stage', stage);
      }
    } 
    // 2. Si NO hay vista en la URL, redirigimos a la última guardada o a 'groups' por defecto
    else {
      const lastView = localStorage.getItem('home_last_view') || 'groups';
      const lastGroup = localStorage.getItem('home_last_group') || 'A';
      const lastStage = localStorage.getItem('home_last_stage') || 'round_32';
      
      let url = `/?view=${lastView}`;
      if (lastView === 'groups') {
        url += `&group=${lastGroup}`;
      } else if (lastView === 'knockout') {
        url += `&stage=${lastStage}`;
      }
      
      router.replace(url);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, group, stage]); // Eliminamos router si no es necesario para la lógica de dependencia pura o simplemente refrescamos.

  return null;
}
