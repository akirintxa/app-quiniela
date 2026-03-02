'use client';

import { useState } from 'react';

interface ShareRankingButtonProps {
  poolName?: string;
  poolId?: string;
}

export default function ShareRankingButton({ poolName, poolId }: ShareRankingButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const title = 'Quiniela FIFA 2026';
    const text = poolName 
      ? `¡Mira cómo va el ranking en mi grupo "${poolName}" de la Quiniela 2026! 🏆⚽`
      : '¡Mira cómo va el ranking global de la Quiniela 2026! 🏆⚽';
    const url = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      // Fallback: Copy to clipboard
      await navigator.clipboard.writeText(`${text}
${url}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <button 
      onClick={handleShare}
      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm ${
        copied 
        ? 'bg-green-500 text-white shadow-green-500/20' 
        : 'bg-white dark:bg-zinc-900 text-gray-500 hover:text-blue-600 border border-gray-100 dark:border-zinc-800'
      }`}
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
      {copied ? '¡Copiado!' : 'Compartir Ranking'}
    </button>
  );
}
