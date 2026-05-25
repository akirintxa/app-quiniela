"use client";

import { useCallback, useEffect, useState } from "react";
import ScoringRules from "./ScoringRules";

type ScoringRulesButtonProps = {
  /** Tamaño del botón circular */
  size?: "sm" | "md";
  className?: string;
};

export default function ScoringRulesButton({
  size = "md",
  className = "",
}: ScoringRulesButtonProps) {
  const [open, setOpen] = useState(false);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open, close]);

  const dim = size === "sm" ? "w-7 h-7" : "w-10 h-10";
  const icon = size === "sm" ? 14 : 18;

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          setOpen(true);
        }}
        aria-label="Ver sistema de puntos"
        title="Sistema de puntos"
        className={`inline-flex items-center justify-center rounded-full border border-blue-200 dark:border-blue-800/60 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 hover:scale-105 active:scale-95 transition-all shadow-sm ${dim} ${className}`}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width={icon}
          height={icon}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M12 16v-4" />
          <path d="M12 8h.01" />
        </svg>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-6 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
          aria-labelledby="scoring-rules-title"
          onClick={close}
        >
          <div
            className="relative w-full sm:max-w-lg max-h-[90vh] sm:max-h-[85vh] overflow-y-auto bg-white dark:bg-zinc-900 rounded-t-[2rem] sm:rounded-[2rem] shadow-2xl border border-gray-100 dark:border-zinc-800 animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 z-10 flex items-center justify-between gap-4 px-5 py-4 bg-white/95 dark:bg-zinc-900/95 backdrop-blur border-b border-gray-100 dark:border-zinc-800 rounded-t-[2rem] sm:rounded-t-[2rem]">
              <h2
                id="scoring-rules-title"
                className="text-[10px] font-black uppercase tracking-[0.25em] text-gray-900 dark:text-white"
              >
                Sistema de puntos
              </h2>
              <button
                type="button"
                onClick={close}
                aria-label="Cerrar"
                className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-100 dark:bg-zinc-800 text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                >
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              </button>
            </div>
            <div className="p-5 sm:p-6">
              <ScoringRules embedded />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
