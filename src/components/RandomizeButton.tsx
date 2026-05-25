'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  randomizeAllGroupPredictions,
  randomizeGroupPredictions,
  randomizeKnockoutPredictions,
} from "@/app/actions";

function SparkleIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
    </svg>
  );
}

export default function RandomizeButton({
  allGroups,
  groupId,
  stage,
  compact,
}: {
  allGroups?: boolean;
  groupId?: string;
  stage?: string;
  compact?: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    const context = allGroups
      ? "todos los grupos (A–L)"
      : groupId
        ? `el Grupo ${groupId}`
        : "esta fase";
    if (!confirm(`¿Rellenar ${context} con pronósticos al azar? Se sobrescribirán los que ya tengas.`)) return;

    setLoading(true);
    try {
      if (allGroups) {
        await randomizeAllGroupPredictions();
      } else if (groupId) {
        await randomizeGroupPredictions(groupId);
      } else if (stage) {
        await randomizeKnockoutPredictions(stage);
      }
      router.refresh();
    } catch {
      alert("Error al aleatorizar");
    } finally {
      setLoading(false);
    }
  };

  const label = loading
    ? compact
      ? "…"
      : "Sorteando..."
    : compact
      ? "Ayudaíta"
      : allGroups
        ? "¡Una Ayudaíta! · Todos"
        : "¡Una Ayudaíta!";

  if (compact) {
    return (
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className={`inline-flex items-center gap-1.5 h-10 px-3 rounded-xl border transition-colors active:scale-[0.98] shrink-0 ${
          loading
            ? "border-gray-100 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900 text-gray-300 cursor-wait"
            : "border-orange-200/70 dark:border-orange-900/40 bg-white/80 dark:bg-zinc-900/80 text-orange-600/90 dark:text-orange-400/90 hover:bg-orange-50/80 dark:hover:bg-orange-950/30 hover:border-orange-300/80"
        }`}
        title={allGroups ? "Rellenar los 72 partidos de grupos (A–L) al azar" : "Rellenar al azar"}
      >
        <SparkleIcon
          className={`w-3 h-3 ${loading ? "animate-spin" : "opacity-80"}`}
        />
        <span className="text-[9px] font-bold uppercase tracking-wider">
          {label}
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className={`flex items-center gap-2 px-6 py-3 rounded-2xl border-2 transition-all active:scale-95 shadow-xl ${
        loading
          ? "bg-gray-100 text-gray-400 border-gray-100"
          : "bg-gradient-to-r from-orange-500 to-amber-500 border-orange-400 text-white hover:from-orange-600 hover:to-amber-600 hover:shadow-orange-500/20"
      }`}
      title={allGroups ? "Rellenar los 72 partidos de la fase de grupos (A–L)" : "Rellenar aleatoriamente"}
    >
      <span className="text-[11px] font-black uppercase tracking-widest whitespace-nowrap">
        {loading ? "Sorteando..." : label}
      </span>
      <SparkleIcon className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
    </button>
  );
}
