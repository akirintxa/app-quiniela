"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { recalculateAllPoints } from "@/app/actions";

export default function AdminRecalculatePointsButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleClick = async () => {
    if (
      !confirm(
        "¿Recalcular los puntos de TODOS los partidos con marcador? Aplica las reglas actuales (p. ej. diferencia con signo). No cambia los resultados."
      )
    ) {
      return;
    }

    setLoading(true);
    setMessage(null);
    try {
      const res = await recalculateAllPoints();
      if (!res.ok) {
        setMessage(res.error);
        return;
      }
      setMessage(
        `Listo: ${res.matches} partido${res.matches !== 1 ? "s" : ""}, ${res.predictions} predicción${res.predictions !== 1 ? "es" : ""} actualizada${res.predictions !== 1 ? "s" : ""}.`
      );
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        disabled={loading}
        onClick={() => void handleClick()}
        className="text-xs font-black bg-amber-50 dark:bg-amber-950/40 px-6 py-3 rounded-2xl border border-amber-200 dark:border-amber-900/50 shadow-sm uppercase tracking-widest text-amber-800 dark:text-amber-300 hover:border-amber-400 disabled:opacity-50"
      >
        {loading ? "Recalculando…" : "Recalcular puntos"}
      </button>
      {message && (
        <p className="text-[9px] font-bold text-amber-700 dark:text-amber-400 max-w-xs text-right leading-snug">
          {message}
        </p>
      )}
    </div>
  );
}
