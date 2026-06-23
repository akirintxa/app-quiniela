import type { MatchSyncStatus } from "@/lib/match-sync-status";

type Props = {
  status: MatchSyncStatus;
  variant?: "admin" | "navbar";
};

export default function MatchSyncStatus({ status, variant = "admin" }: Props) {
  const { autoSyncEnabled, formattedAt, relativeLabel } = status;

  if (variant === "navbar") {
    if (!formattedAt) return null;

    return (
      <span
        className="hidden lg:inline text-[8px] font-bold uppercase tracking-widest text-gray-400 dark:text-zinc-500 tabular-nums"
        title={`Última actualización de partidos: ${formattedAt} (Caracas)`}
      >
        <span
          className={`inline-block w-1.5 h-1.5 rounded-full mr-1.5 align-middle ${
            autoSyncEnabled ? "bg-green-500" : "bg-gray-300 dark:bg-zinc-600"
          }`}
        />
        Sync {relativeLabel}
      </span>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 py-3 text-right max-w-sm">
      <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 dark:text-zinc-500">
        Estado del sync
      </p>
      <p className="text-[10px] font-bold text-gray-700 dark:text-zinc-200 mt-1 leading-snug">
        {autoSyncEnabled ? (
          <span className="text-green-600 dark:text-green-400">Automático activo</span>
        ) : (
          <span className="text-amber-600 dark:text-amber-400">Solo manual</span>
        )}
        {formattedAt ? (
          <>
            {" · "}
            <span className="text-gray-500 dark:text-zinc-400">{relativeLabel}</span>
          </>
        ) : null}
      </p>
      <p className="text-[9px] font-bold text-gray-400 dark:text-zinc-500 mt-1 tabular-nums">
        {formattedAt ? (
          <>Última actualización: {formattedAt} (Caracas)</>
        ) : (
          <>Aún no hay partidos actualizados en BD</>
        )}
      </p>
    </div>
  );
}
