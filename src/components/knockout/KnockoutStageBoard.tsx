'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { saveStagePredictions } from "@/app/actions";
import { KnockoutMatchViewModel } from "@/types/knockout";
import {
  draftFromPrediction,
  isDraftDirty,
  isDraftValid,
  MatchDraft,
} from "@/lib/knockout-ui";
import KnockoutMatchCard from "./KnockoutMatchCard";

const AUTO_SAVE_DEBOUNCE_MS = 600;

type DraftUpdate = Pick<MatchDraft, "scoreA" | "scoreB" | "winnerId">;

type StageSaveStatus = "idle" | "pending" | "saving" | "saved" | "error";

interface KnockoutStageContextValue {
  drafts: Record<number, MatchDraft>;
  updateDraft: (matchId: number, update: DraftUpdate) => void;
}

const KnockoutStageContext = createContext<KnockoutStageContextValue | null>(null);

export function useKnockoutStage() {
  const ctx = useContext(KnockoutStageContext);
  if (!ctx) throw new Error("useKnockoutStage debe usarse dentro de KnockoutStageBoard");
  return ctx;
}

interface KnockoutStageBoardProps {
  viewModels: KnockoutMatchViewModel[];
  userId?: string;
  stageLabel: string;
}

export default function KnockoutStageBoard({
  viewModels,
  userId,
  stageLabel,
}: KnockoutStageBoardProps) {
  const router = useRouter();
  const [drafts, setDrafts] = useState<Record<number, MatchDraft>>(() => {
    const init: Record<number, MatchDraft> = {};
    for (const vm of viewModels) {
      init[vm.match.id] = draftFromPrediction(vm.userPrediction);
    }
    return init;
  });
  const [saveStatus, setSaveStatus] = useState<StageSaveStatus>("idle");

  useEffect(() => {
    setDrafts(() => {
      const next: Record<number, MatchDraft> = {};
      for (const vm of viewModels) {
        next[vm.match.id] = draftFromPrediction(vm.userPrediction);
      }
      return next;
    });
    setSaveStatus("idle");
  }, [viewModels]);

  const updateDraft = useCallback((matchId: number, update: DraftUpdate) => {
    setDrafts((prev) => ({
      ...prev,
      [matchId]: { ...prev[matchId], ...update },
    }));
    setSaveStatus((s) => (s === "saved" ? "idle" : s));
  }, []);

  const dirtyItems = useMemo(() => {
    return viewModels.filter((vm) => {
      const d = drafts[vm.match.id];
      if (!d || !isDraftDirty(d)) return false;
      return isDraftValid(d, true);
    });
  }, [viewModels, drafts]);

  const dirtyCount = dirtyItems.length;

  const dirtySignature = useMemo(
    () =>
      dirtyItems
        .map((vm) => {
          const d = drafts[vm.match.id]!;
          return `${vm.match.id}:${d.scoreA}:${d.scoreB}:${d.winnerId ?? ""}`;
        })
        .sort()
        .join("|"),
    [dirtyItems, drafts]
  );

  const persistDirty = useCallback(async () => {
    if (!userId || dirtyItems.length === 0) return;

    setSaveStatus("saving");
    try {
      const payload = dirtyItems.map((vm) => {
        const d = drafts[vm.match.id]!;
        return {
          matchId: vm.match.id,
          scoreA: Number(d.scoreA),
          scoreB: Number(d.scoreB),
          winnerId:
            Number(d.scoreA) === Number(d.scoreB) ? d.winnerId : null,
        };
      });
      await saveStagePredictions(payload);
      setDrafts((prev) => {
        const next = { ...prev };
        for (const vm of dirtyItems) {
          const d = next[vm.match.id];
          if (d) {
            next[vm.match.id] = {
              ...d,
              savedScoreA: d.scoreA,
              savedScoreB: d.scoreB,
              savedWinnerId: d.winnerId,
            };
          }
        }
        return next;
      });
      setSaveStatus("saved");
      router.refresh();
      setTimeout(() => setSaveStatus("idle"), 2500);
    } catch {
      setSaveStatus("error");
    }
  }, [dirtyItems, drafts, router, userId]);

  useEffect(() => {
    if (!userId || dirtyCount === 0) {
      setSaveStatus((s) => (s === "pending" ? "idle" : s));
      return;
    }

    setSaveStatus("pending");
    const timer = setTimeout(() => {
      void persistDirty();
    }, AUTO_SAVE_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [dirtySignature, dirtyCount, userId, persistDirty]);

  useEffect(() => {
    if (!userId) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (
        dirtyCount > 0 ||
        saveStatus === "pending" ||
        saveStatus === "saving"
      ) {
        e.preventDefault();
      }
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [userId, dirtyCount, saveStatus]);

  const statusMessage = (() => {
    if (saveStatus === "saving") return "Guardando fase…";
    if (saveStatus === "pending")
      return `${dirtyCount} cambio${dirtyCount !== 1 ? "s" : ""} — guardando en breve…`;
    if (saveStatus === "saved") return "Fase guardada";
    if (saveStatus === "error")
      return "Error al guardar — se reintentará al editar";
    if (dirtyCount > 0)
      return `${dirtyCount} partido${dirtyCount !== 1 ? "s" : ""} con cambios pendientes`;
    return "Autoguardado activo · sin cambios pendientes";
  })();

  return (
    <KnockoutStageContext.Provider value={{ drafts, updateDraft }}>
      {userId && (
        <div className="sticky top-2 z-20 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-[2rem] bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 shadow-lg">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-900 dark:text-white">
              {stageLabel}
            </p>
            <p
              className={`text-[9px] font-bold uppercase tracking-widest mt-0.5 ${
                saveStatus === "error"
                  ? "text-red-500"
                  : saveStatus === "saved"
                    ? "text-green-600"
                    : saveStatus === "pending" || saveStatus === "saving"
                      ? "text-blue-500"
                      : "text-gray-400"
              }`}
            >
              {statusMessage}
            </p>
          </div>
          {saveStatus === "error" && dirtyCount > 0 && (
            <button
              type="button"
              onClick={() => void persistDirty()}
              className="px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] bg-red-600 text-white hover:bg-red-700"
            >
              Reintentar ahora
            </button>
          )}
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {viewModels.map((vm) => (
          <KnockoutMatchCard key={vm.match.id} viewModel={vm} userId={userId} />
        ))}
      </div>
    </KnockoutStageContext.Provider>
  );
}
