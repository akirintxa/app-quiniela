"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  swapAllInvertedFutureGroupMatches,
  swapMatchSidesAdmin,
} from "@/app/actions";
import type { InvertedMatchAuditRow } from "@/lib/score-providers/match-side-alignment";

function formatMatchDate(iso: string): string {
  return new Date(iso).toLocaleString("es-VE", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Caracas",
  });
}

export default function AdminSideAlignmentPanel({
  rows,
}: {
  rows: InvertedMatchAuditRow[];
}) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<number | null>(null);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSwapOne = async (row: InvertedMatchAuditRow) => {
    const label = `#${row.matchId} (${row.teamAName} vs ${row.teamBName})`;
    if (
      !confirm(
        `¿Invertir lados de ${label}?\n\nLocal FIFA: ${row.fifaHomeName} · Visitante FIFA: ${row.fifaAwayName}\n\nSe espejarán también las ${row.predictionCount} predicción(es) existentes. El pronóstico de cada usuario sigue siendo el mismo en términos de equipos.`
      )
    ) {
      return;
    }

    setLoadingId(row.matchId);
    setMessage(null);
    try {
      const res = await swapMatchSidesAdmin(row.matchId);
      if (!res.ok) {
        setMessage(res.error);
        return;
      }
      setMessage(`Partido #${row.matchId} invertido.`);
      router.refresh();
    } finally {
      setLoadingId(null);
    }
  };

  const handleSwapAll = async () => {
    if (rows.length === 0) return;
    const withPreds = rows.filter((r) => r.predictionCount > 0).length;
    if (
      !confirm(
        `¿Invertir los ${rows.length} partidos detectados como invertidos respecto a FIFA?\n\n${withPreds} tienen predicciones (se espejarán automáticamente). Solo afecta partidos de grupo no finalizados.`
      )
    ) {
      return;
    }

    setBulkLoading(true);
    setMessage(null);
    try {
      const res = await swapAllInvertedFutureGroupMatches();
      if (!res.ok) {
        setMessage(res.error);
        return;
      }
      const errPart =
        res.errors.length > 0 ? ` Errores: ${res.errors.join("; ")}` : "";
      setMessage(`Listo: ${res.swapped} partido(s) invertido(s).${errPart}`);
      router.refresh();
    } finally {
      setBulkLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-[2rem] border border-blue-100 dark:border-blue-900/40 bg-blue-50/50 dark:bg-blue-950/20 p-6">
        <p className="text-[10px] font-black uppercase tracking-widest text-blue-800 dark:text-blue-300 mb-2">
          Alineación local / visitante (FIFA)
        </p>
        <p className="text-xs text-blue-900/80 dark:text-blue-200/80 leading-relaxed max-w-3xl">
          Compara el orden en pantalla (equipo A izquierda, B derecha) con el
          local FIFA de worldcup26. Invertir intercambia equipos y espeja
          predicciones y marcadores en vivo; no cambia el significado del
          pronóstico ni los puntos ya calculados. Solo partidos de grupo sin
          cerrar.
        </p>
      </div>

      {rows.length > 0 && (
        <div className="flex justify-end">
          <button
            type="button"
            disabled={bulkLoading || loadingId !== null}
            onClick={() => void handleSwapAll()}
            className="text-xs font-black bg-blue-600 text-white px-6 py-3 rounded-2xl shadow-sm uppercase tracking-widest hover:bg-blue-700 disabled:opacity-50"
          >
            {bulkLoading
              ? "Invirtiendo…"
              : `Invertir todos (${rows.length})`}
          </button>
        </div>
      )}

      {message && (
        <p className="text-xs font-bold text-blue-800 dark:text-blue-300 px-2">
          {message}
        </p>
      )}

      <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] shadow-xl border border-gray-100 dark:border-zinc-800 overflow-hidden">
        {rows.length === 0 ? (
          <p className="p-16 text-center text-gray-400 font-bold text-sm">
            Ningún partido futuro de grupo aparece invertido respecto a FIFA.
          </p>
        ) : (
          <div className="divide-y divide-gray-50 dark:divide-zinc-800">
            {rows.map((row) => (
              <div
                key={row.matchId}
                className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
              >
                <div className="min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">
                    #{row.matchId} · API #{row.apiFixtureId} · Grupo {row.groupId}{" "}
                    · {formatMatchDate(row.startTime)}
                    {row.isLocked ? " · Cerrado" : ""}
                    {row.hasScore ? " · Con marcador" : ""}
                  </p>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">
                    En app: {row.teamAName}{" "}
                    <span className="text-gray-400 font-normal">vs</span>{" "}
                    {row.teamBName}
                  </p>
                  <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
                    FIFA local: {row.fifaHomeName} · visitante: {row.fifaAwayName}
                  </p>
                  <p className="text-[10px] text-gray-500 mt-1">
                    {row.predictionCount} predicción
                    {row.predictionCount !== 1 ? "es" : ""}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={loadingId !== null || bulkLoading}
                  onClick={() => void handleSwapOne(row)}
                  className="shrink-0 text-[10px] font-black uppercase tracking-widest px-5 py-3 rounded-xl border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/30 disabled:opacity-50"
                >
                  {loadingId === row.matchId ? "Invirtiendo…" : "Invertir lados"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
