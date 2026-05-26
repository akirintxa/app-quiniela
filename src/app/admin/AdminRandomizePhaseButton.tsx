'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  randomizePhaseResults,
  type AdminRandomizePhaseParams,
} from "@/app/actions";

type Props = AdminRandomizePhaseParams & {
  label: string;
  pendingCount: number;
};

export default function AdminRandomizePhaseButton({
  label,
  pendingCount,
  ...phaseParams
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleClick = async () => {
    if (pendingCount === 0) {
      setMessage("No hay partidos pendientes en esta fase.");
      return;
    }

    if (
      !confirm(
        `¿Generar resultados aleatorios y finalizar ${pendingCount} partido${pendingCount !== 1 ? "s" : ""} de ${label}? Solo para pruebas.`
      )
    ) {
      return;
    }

    setLoading(true);
    setMessage(null);
    try {
      const res = await randomizePhaseResults(phaseParams);
      if (!res.ok) {
        setMessage(res.error);
        return;
      }
      const skippedNote =
        res.skipped > 0 ? ` (${res.skipped} omitidos sin equipos)` : "";
      setMessage(
        res.finalized > 0
          ? `Finalizados ${res.finalized} partido${res.finalized !== 1 ? "s" : ""}${skippedNote}.`
          : "No había partidos que se pudieran finalizar."
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
        disabled={loading || pendingCount === 0}
        className="px-5 py-3 bg-amber-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-amber-600 shadow-lg shadow-amber-500/25 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {loading ? "Generando…" : `Aleatorizar ${label}`}
      </button>
      {pendingCount > 0 && (
        <span className="text-[9px] font-bold text-amber-700/80 dark:text-amber-400/80 uppercase tracking-widest">
          {pendingCount} pendiente{pendingCount !== 1 ? "s" : ""}
        </span>
      )}
      {message && (
        <p className="text-[9px] font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wide text-right max-w-xs">
          {message}
        </p>
      )}
    </div>
  );
}
