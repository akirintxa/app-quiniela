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
  viewModelToMatchCard,
} from "@/lib/knockout-ui";
import KnockoutMatchCard from "./KnockoutMatchCard";

type DraftUpdate = Pick<MatchDraft, "scoreA" | "scoreB" | "winnerId">;

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
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<"idle" | "saved" | "error">("idle");

  useEffect(() => {
    setDrafts(() => {
      const next: Record<number, MatchDraft> = {};
      for (const vm of viewModels) {
        next[vm.match.id] = draftFromPrediction(vm.userPrediction);
      }
      return next;
    });
  }, [viewModels]);

  const updateDraft = useCallback((matchId: number, update: DraftUpdate) => {
    setDrafts((prev) => ({
      ...prev,
      [matchId]: { ...prev[matchId], ...update },
    }));
    setFeedback("idle");
  }, []);

  const dirtyItems = useMemo(() => {
    return viewModels.filter((vm) => {
      const d = drafts[vm.match.id];
      if (!d || !isDraftDirty(d)) return false;
      return isDraftValid(d, true);
    });
  }, [viewModels, drafts]);

  const dirtyCount = dirtyItems.length;

  const handleSaveAll = async () => {
    if (!userId || dirtyCount === 0) return;
    setSaving(true);
    setFeedback("idle");
    try {
      const payload = dirtyItems.map((vm) => {
        const d = drafts[vm.match.id]!;
        const match = viewModelToMatchCard(vm);
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
      setFeedback("saved");
      router.refresh();
      setTimeout(() => setFeedback("idle"), 2500);
    } catch {
      setFeedback("error");
      alert("Error al guardar la fase. Inténtalo de nuevo.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <KnockoutStageContext.Provider value={{ drafts, updateDraft }}>
      {userId && (
        <div className="sticky top-2 z-20 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-[2rem] bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 shadow-lg">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-900 dark:text-white">
              {stageLabel}
            </p>
            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
              {dirtyCount > 0
                ? `${dirtyCount} partido${dirtyCount !== 1 ? "s" : ""} con cambios sin guardar`
                : "Sin cambios pendientes"}
            </p>
          </div>
          <button
            type="button"
            onClick={handleSaveAll}
            disabled={saving || dirtyCount === 0}
            className={`px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all shadow-lg ${
              feedback === "saved"
                ? "bg-green-500 text-white shadow-green-500/20"
                : dirtyCount === 0
                  ? "bg-gray-100 dark:bg-zinc-800 text-gray-400 cursor-default shadow-none"
                  : "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20 active:scale-95"
            }`}
          >
            {saving
              ? "Guardando..."
              : feedback === "saved"
                ? "¡Fase guardada!"
                : `Guardar fase (${dirtyCount})`}
          </button>
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
