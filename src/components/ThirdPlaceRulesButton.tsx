"use client";

import { useCallback, useEffect, useState } from "react";
import BestThirdPlacesPanel from "./BestThirdPlacesPanel";
import type { BestThirdPlacesView } from "@/lib/best-thirds-view";

type ThirdPlaceRulesButtonProps = {
  predicted: BestThirdPlacesView;
  real: BestThirdPlacesView;
  size?: "sm" | "md";
  className?: string;
};

export default function ThirdPlaceRulesButton({
  predicted,
  real,
  size = "md",
  className = "",
}: ThirdPlaceRulesButtonProps) {
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
        aria-label="Ver mejores terceros"
        title="Mejores terceros"
        className={`inline-flex items-center justify-center rounded-full border border-orange-200 dark:border-orange-800/60 bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-900/50 hover:scale-105 active:scale-95 transition-all shadow-sm ${dim} ${className}`}
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
          <path d="M8 6h13" />
          <path d="M8 12h13" />
          <path d="M8 18h13" />
          <path d="M3 6h.01" />
          <path d="M3 12h.01" />
          <path d="M3 18h.01" />
        </svg>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-6 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
          aria-labelledby="best-thirds-title"
          onClick={close}
        >
          <div
            className="relative w-full sm:max-w-md max-h-[90vh] sm:max-h-[85vh] overflow-y-auto bg-white dark:bg-zinc-900 rounded-t-[2rem] sm:rounded-[2rem] shadow-2xl border border-gray-100 dark:border-zinc-800 animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 z-10 flex items-center justify-between gap-4 px-5 py-4 bg-white/95 dark:bg-zinc-900/95 backdrop-blur border-b border-gray-100 dark:border-zinc-800">
              <h2
                id="best-thirds-title"
                className="text-[10px] font-black uppercase tracking-[0.25em] text-gray-900 dark:text-white"
              >
                Mejores terceros
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
              <BestThirdPlacesPanel predicted={predicted} real={real} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
