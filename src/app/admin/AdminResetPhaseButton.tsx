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
  locked?: boolean;
  lockedReason?: string;
};

export default function AdminResetPhaseButton({
  label,
  resettableCount,
  locked = false,
  lockedReason,
  ...phaseParams
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleClick = async () => {
    if (locked) return;
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
        disabled={loading || resettableCount === 0 || locked}
        title={
          locked
            ? lockedReason
            : "Solo para pruebas: borra marcadores y puntos de toda la fase visible"
        }
        className="px-5 py-3 bg-red-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-red-700 shadow-lg shadow-red-500/25 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {loading ? "Reiniciando…" : `Reiniciar ${label}`}
      </button>
      {locked && lockedReason && (
        <span className="text-[9px] font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-widest text-right max-w-xs leading-snug">
          {lockedReason}
        </span>
      )}
      {!locked && resettableCount > 0 && (
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
