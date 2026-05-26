"use client";

import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { kickPoolMember, renamePool } from "@/app/actions";

type LeagueAdminPanelProps = {
  poolId: number;
  poolName: string;
  isAdmin: boolean;
  myUserId: string;
  creatorId: string;
  members: { id: string; nickname: string }[];
};

export default function LeagueAdminPanel({
  poolId,
  poolName,
  isAdmin,
  myUserId,
  creatorId,
  members,
}: LeagueAdminPanelProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [savingName, setSavingName] = useState(false);
  const [kickingId, setKickingId] = useState<string | null>(null);
  const [name, setName] = useState(poolName);

  useEffect(() => {
    setName(poolName);
  }, [poolName]);

  const canManage = isAdmin;

  const kickable = useMemo(() => {
    return members.filter((m) => m.id !== myUserId && m.id !== creatorId);
  }, [members, myUserId, creatorId]);

  if (!canManage) return null;

  const onRename = async () => {
    const next = name.trim();
    if (!next || next === poolName) {
      setOpen(false);
      return;
    }
    setSavingName(true);
    try {
      await renamePool(poolId, next);
      setOpen(false);
      router.refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Error al renombrar la liga");
    } finally {
      setSavingName(false);
    }
  };

  const onKick = async (userId: string) => {
    if (!confirm("¿Expulsar a este usuario de la liga?")) return;
    setKickingId(userId);
    try {
      await kickPoolMember(poolId, userId);
      setOpen(false);
      router.refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Error al expulsar usuario");
    } finally {
      setKickingId(null);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 text-[9px] font-black uppercase tracking-widest text-gray-400 hover:text-blue-600 hover:border-blue-200 transition-all"
      >
        Administrar
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
        </svg>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center p-0 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150"
          role="dialog"
          aria-modal="true"
          onClick={() => !savingName && setOpen(false)}
        >
          <div
            className="w-full sm:max-w-lg max-h-[90vh] overflow-y-auto bg-white dark:bg-zinc-900 rounded-t-[2rem] sm:rounded-[2rem] shadow-2xl border border-gray-100 dark:border-zinc-800"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 z-10 flex items-center justify-between gap-4 px-5 py-4 bg-white/95 dark:bg-zinc-900/95 backdrop-blur border-b border-gray-100 dark:border-zinc-800">
              <div className="min-w-0">
                <p className="text-[9px] font-black uppercase tracking-[0.25em] text-gray-400">
                  Admin de liga
                </p>
                <h2 className="text-sm font-black truncate">{poolName}</h2>
              </div>
              <button
                type="button"
                onClick={() => !savingName && setOpen(false)}
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

            <div className="p-5 sm:p-6 space-y-8">
              <div className="space-y-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                  Cambiar nombre
                </p>
                <div className="flex gap-2">
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="flex-1 px-4 py-3 rounded-2xl bg-gray-50 dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 text-sm font-bold outline-none focus:border-blue-500"
                    placeholder="Nombre de la liga"
                  />
                  <button
                    type="button"
                    onClick={onRename}
                    disabled={savingName}
                    className={`px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                      savingName
                        ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                        : "bg-blue-600 text-white hover:bg-blue-700 active:scale-95"
                    }`}
                  >
                    {savingName ? "..." : "Guardar"}
                  </button>
                </div>
                <p className="text-[9px] font-bold text-gray-400 leading-relaxed">
                  El creador de la liga no se puede expulsar desde aquí.
                </p>
              </div>

              <div className="space-y-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                  Expulsar usuarios
                </p>
                {kickable.length === 0 ? (
                  <p className="text-[9px] font-bold text-gray-400">
                    No hay usuarios para expulsar.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {kickable.map((m) => (
                      <div
                        key={m.id}
                        className="flex items-center justify-between gap-3 bg-gray-50 dark:bg-zinc-800/60 border border-gray-100 dark:border-zinc-800 rounded-2xl px-4 py-3"
                      >
                        <span className="text-[10px] font-black uppercase tracking-tighter truncate">
                          {m.nickname}
                        </span>
                        <button
                          type="button"
                          disabled={kickingId === m.id}
                          onClick={() => onKick(m.id)}
                          className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                            kickingId === m.id
                              ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                              : "bg-red-600 text-white hover:bg-red-700 active:scale-95"
                          }`}
                        >
                          {kickingId === m.id ? "..." : "Expulsar"}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

