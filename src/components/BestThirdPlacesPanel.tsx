"use client";

import { useState } from "react";
import type {
  BestThirdPlacesView,
  BestThirdRow,
  BestThirdSlotRow,
} from "@/lib/best-thirds-view";
import { getTeamFlagUrl } from "@/lib/team-flag";

type BestThirdPlacesPanelProps = {
  predicted: BestThirdPlacesView;
  real: BestThirdPlacesView;
};

function Flag({ isoCode, name }: { isoCode: string; name: string }) {
  const url = getTeamFlagUrl({ iso_code: isoCode, name }, 40);
  if (!url) {
    return (
      <span className="w-6 h-4 rounded bg-gray-200 dark:bg-zinc-700 shrink-0" />
    );
  }
  return (
    <img
      src={url}
      alt=""
      className="w-6 h-4 object-cover rounded shrink-0"
      loading="lazy"
    />
  );
}

function cleanTeamName(name: string): string {
  return name.replace(/[\u{1F1E6}-\u{1F1FF}]/gu, "").trim() || name;
}

function RankingTable({ rows }: { rows: BestThirdRow[] }) {
  if (rows.length === 0) {
    return (
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest py-4 text-center">
        Aún no hay terceros calculables. Completa predicciones de grupos.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto -mx-1">
      <table className="w-full min-w-[280px] text-left border-collapse">
        <thead>
          <tr className="text-[8px] font-black uppercase tracking-widest text-gray-400">
            <th className="py-2 px-2">#</th>
            <th className="py-2 px-2">Equipo</th>
            <th className="py-2 px-1 text-center">Pts</th>
            <th className="py-2 px-1 text-center">DG</th>
            <th className="py-2 px-1 text-center">GF</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={`${row.groupId}-${row.rank}`}
              className={`border-t border-gray-100 dark:border-zinc-800 ${
                row.qualifies
                  ? "bg-green-50/80 dark:bg-green-950/25"
                  : row.rank > 8
                    ? "opacity-50"
                    : ""
              }`}
            >
              <td className="py-2.5 px-2 text-[10px] font-black">{row.rank}</td>
              <td className="py-2.5 px-2">
                <div className="flex items-center gap-2 min-w-0">
                  <Flag isoCode={row.isoCode} name={row.teamName} />
                  <div className="min-w-0">
                    <span className="text-[9px] font-black text-orange-600 dark:text-orange-400">
                      3{row.groupId}
                    </span>
                    <span className="text-[10px] font-bold text-gray-800 dark:text-zinc-200 block truncate max-w-[140px] sm:max-w-none">
                      {cleanTeamName(row.teamName)}
                    </span>
                  </div>
                </div>
              </td>
              <td className="py-2.5 px-1 text-center text-[10px] font-black">
                {row.points}
              </td>
              <td className="py-2.5 px-1 text-center text-[10px] font-bold text-gray-500">
                {row.gd > 0 ? `+${row.gd}` : row.gd}
              </td>
              <td className="py-2.5 px-1 text-center text-[10px] font-bold text-gray-500">
                {row.gf}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SlotsList({
  slots,
  canAssign,
}: {
  slots: BestThirdSlotRow[];
  canAssign: boolean;
}) {
  if (!canAssign) {
    return (
      <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest leading-relaxed">
        Necesitas al menos 8 terceros de grupos completos para asignar cruces de
        dieciseisavos (Anexo C FIFA).
      </p>
    );
  }

  return (
    <ul className="space-y-2">
      {slots.map((slot) => (
        <li
          key={slot.annexColumn}
          className="flex items-center gap-3 bg-white/80 dark:bg-zinc-900/60 rounded-xl px-3 py-2.5 border border-orange-100/80 dark:border-orange-900/30"
        >
          <span className="text-[9px] font-black text-orange-600 shrink-0 w-8">
            {slot.opponentLabel}
          </span>
          <span className="text-gray-300 dark:text-zinc-600">vs</span>
          {slot.teamName ? (
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <Flag isoCode={slot.isoCode ?? ""} name={slot.teamName} />
              <span className="text-[10px] font-bold truncate">
                <span className="text-orange-600 font-black">
                  3{slot.thirdGroupId}
                </span>{" "}
                {cleanTeamName(slot.teamName)}
              </span>
            </div>
          ) : (
            <span className="text-[10px] font-bold text-gray-400">—</span>
          )}
        </li>
      ))}
    </ul>
  );
}

export default function BestThirdPlacesPanel({
  predicted,
  real,
}: BestThirdPlacesPanelProps) {
  const [tab, setTab] = useState<"predicted" | "real">("predicted");
  const view = tab === "predicted" ? predicted : real;
  const realAvailable = real.hasOfficialGroupResults;

  return (
    <div>
      <div className="flex gap-2 mb-4">
        <button
          type="button"
          onClick={() => setTab("predicted")}
          className={`flex-1 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
            tab === "predicted"
              ? "bg-orange-600 text-white shadow-md"
              : "bg-white dark:bg-zinc-800 text-gray-400 border border-gray-100 dark:border-zinc-700"
          }`}
        >
          Tus predicciones
        </button>
        <button
          type="button"
          onClick={() => realAvailable && setTab("real")}
          disabled={!realAvailable}
          className={`flex-1 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
            tab === "real"
              ? "bg-orange-600 text-white shadow-md"
              : realAvailable
                ? "bg-white dark:bg-zinc-800 text-gray-400 border border-gray-100 dark:border-zinc-700"
                : "bg-gray-100 dark:bg-zinc-900 text-gray-300 cursor-not-allowed"
          }`}
        >
          Resultados reales
        </button>
      </div>

      <p className="text-[9px] font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-widest mb-4 leading-relaxed">
        {view.completedGroupsCount}/12 grupos con predicción completa ·{" "}
        {view.thirdPlacesCount} terceros en juego · Criterio: pts → DG → GF
      </p>

      <p className="text-[9px] font-black uppercase tracking-[0.2em] text-orange-700 dark:text-orange-400 mb-2">
        Ranking de terceros
      </p>
      <RankingTable rows={view.ranked} />

      <p className="mt-5 text-[9px] font-black uppercase tracking-[0.2em] text-orange-700 dark:text-orange-400 mb-2">
        Asignación a dieciseisavos
      </p>
      <SlotsList slots={view.slots} canAssign={view.canAssign} />

      {view.canAssign && view.combinationId && (
        <p className="mt-4 text-[8px] font-bold text-gray-400 uppercase tracking-widest">
          Anexo C FIFA · combinación #{view.combinationId} · Grupos 3.º:{" "}
          {view.qualifyingGroupLetters.join(", ")}
        </p>
      )}
    </div>
  );
}
