"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  resetPhaseResults,
  type AdminResetPhaseParams,
} from "@/app/actions";

type Props = AdminResetPhaseParams & {
  label: string;
  resettableCount: number;
};

export default function AdminResetPhaseButton({
  label,
  resettableCount,
  ...phaseParams
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleClick = async () => {
    if (resettableCount === 0) {
      setMessage("No hay partidos con resultado en esta vista.");
      return;
    }

    if (
      !confirm(
        `¿Reiniciar TODA la fase «${label}»? Se borrarán marcadores, estados y puntos (${resettableCount} partido${resettableCount !== 1 ? "s" : ""} con datos). Las predicciones de los usuarios no se borran.`
      )
    ) {
      return;
    }

    setLoading(true);
    setMessage(null);
    try {
      const res = await resetPhaseResults(phaseParams);
      if (!res.ok) {
        setMessage(res.error);
        return;
      }
      setMessage(
        res.reset > 0
          ? `Reiniciados ${res.reset} partido${res.reset !== 1 ? "s" : ""}.`
          : "No había partidos en esta fase."
      );
      router.refresh();
    } catch {
      setMessage("Error de red o servidor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={loading || resettableCount === 0}
        className="px-5 py-3 bg-red-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-red-700 shadow-lg shadow-red-500/25 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {loading ? "Reiniciando…" : `Reiniciar ${label}`}
      </button>
      {resettableCount > 0 && (
        <span className="text-[9px] font-bold text-red-700/80 dark:text-red-400/80 uppercase tracking-widest">
          {resettableCount} con resultado
        </span>
      )}
      {message && (
        <p className="text-[9px] font-bold text-red-800 dark:text-red-300 uppercase tracking-wide text-right max-w-xs">
          {message}
        </p>
      )}
    </div>
  );
}
