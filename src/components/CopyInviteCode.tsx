
'use client';

import { useState } from "react";

export default function CopyInviteCode({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy!", err);
    }
  };

  return (
    <button 
      onClick={handleCopy}
      className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all active:scale-95 ${
        copied 
          ? 'bg-green-50 border-green-200 text-green-600' 
          : 'bg-white dark:bg-zinc-900 border-gray-100 dark:border-zinc-800 text-gray-400 hover:border-blue-500 hover:text-blue-600'
      }`}
    >
      <span className="text-[10px] font-black uppercase tracking-widest">
        Código: <span className={copied ? 'text-green-600' : 'text-blue-600'}>{code}</span>
      </span>
      {copied ? (
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
      )}
    </button>
  );
}
