'use client';

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Match, Prediction } from "@/types";
import { savePrediction, fetchPoolMatchPredictions } from "@/app/actions";
import { getKnockoutPenaltyWinnerDisplayName } from "@/lib/match-admin";
import { formatMatchDateShort, formatMatchTime } from "@/lib/match-datetime";
import {
  calculatePoints,
  formatPointsBreakdown,
  getPointsBreakdown,
  knockoutResolvedFromMatch,
} from "@/lib/points";
import { useAutoSavePrediction } from "@/hooks/useAutoSavePrediction";
import { isMatchClosedForPredictions } from "@/lib/prediction";
import type { MatchOutcomeSummary } from "@/lib/pool-outcome-summary";
import MatchOutcomeSummaryBar from "@/components/MatchOutcomeSummary";

interface MatchCardProps {
  match: Match & {
    is_locked?: boolean;
    is_finished?: boolean;
    knockout_slot_a_id?: number | null;
    knockout_slot_b_id?: number | null;
    placeholder_a?: string;
    placeholder_b?: string;
    bracket_label_a?: string;
    bracket_label_b?: string;
    is_confirmed_a?: boolean;
    is_confirmed_b?: boolean;
    is_projected_a?: boolean;
    is_projected_b?: boolean;
    ghost_team_a?: string;
    ghost_team_b?: string;
  };
  userId?: string;
  initialPrediction?: Prediction | null;
  poolId?: string;
  poolMembers?: { id: string; nickname: string }[];
  leagueOutcomeSummary?: MatchOutcomeSummary;
  phaseCompleteByUser?: Record<string, boolean>;
  suppressSave?: boolean;
  controlledDraft?: {
    scoreA: number | string;
    scoreB: number | string;
    winnerId: number | null;
  };
  onDraftChange?: (draft: {
    scoreA: number | string;
    scoreB: number | string;
    winnerId: number | null;
  }) => void;
}

export default function MatchCard({
  match,
  userId,
  initialPrediction,
  poolId,
  poolMembers,
  leagueOutcomeSummary,
  phaseCompleteByUser,
  suppressSave = false,
  controlledDraft,
  onDraftChange,
}: MatchCardProps) {
  const router = useRouter();
  const isControlled = controlledDraft !== undefined;
  const [scoreA, setScoreA] = useState<number | string>(initialPrediction?.predicted_a ?? "");
  const [scoreB, setScoreB] = useState<number | string>(initialPrediction?.predicted_b ?? "");
  const [winnerId, setWinnerId] = useState<number | null>(initialPrediction?.predicted_winner_id ?? null);

  const effectiveScoreA = isControlled ? controlledDraft.scoreA : scoreA;
  const effectiveScoreB = isControlled ? controlledDraft.scoreB : scoreB;
  const effectiveWinnerId = isControlled ? controlledDraft.winnerId : winnerId;

  const patchScores = (
    patch: Partial<{ scoreA: number | string; scoreB: number | string; winnerId: number | null }>
  ) => {
    const next = {
      scoreA: patch.scoreA ?? effectiveScoreA,
      scoreB: patch.scoreB ?? effectiveScoreB,
      winnerId: patch.winnerId !== undefined ? patch.winnerId : effectiveWinnerId,
    };
    if (isControlled) {
      onDraftChange?.(next);
    } else {
      setScoreA(next.scoreA);
      setScoreB(next.scoreB);
      setWinnerId(next.winnerId);
    }
  };
  
  const [showSpy, setShowSpy] = useState(false);
  const [groupPredictions, setGroupPredictions] = useState<{
    predicted_a: number | null;
    predicted_b: number | null;
    predicted_winner_id: number | null;
    points_won: number | null;
    user_id: string;
    nickname: string;
    phaseComplete: boolean;
  }[]>([]);
  const [loadingSpy, setLoadingSpy] = useState(false);

  const isKnockout = match.stage !== "group";
  const knockoutResolved = isKnockout ? knockoutResolvedFromMatch(match) : null;
  const isDraw =
    effectiveScoreA !== "" &&
    effectiveScoreB !== "" &&
    Number(effectiveScoreA) === Number(effectiveScoreB);

  const slotLabelA = match.bracket_label_a;
  const slotLabelB = match.bracket_label_b;
  const slotResolvedA =
    Boolean(match.is_confirmed_a) || Boolean(match.is_projected_a);
  const slotResolvedB =
    Boolean(match.is_confirmed_b) || Boolean(match.is_projected_b);
  const showBracketSlotA = isKnockout && Boolean(slotLabelA) && !slotResolvedA;
  const showBracketSlotB = isKnockout && Boolean(slotLabelB) && !slotResolvedB;

  const teamAName = showBracketSlotA
    ? slotLabelA!
    : match.team_a?.name || slotLabelA || `Equipo ${match.team_a_id}`;
  const teamBName = showBracketSlotB
    ? slotLabelB!
    : match.team_b?.name || slotLabelB || `Equipo ${match.team_b_id}`;

  const pA = slotLabelA || match.placeholder_a;
  const pB = slotLabelB || match.placeholder_b;
  const expectedMatchup = isKnockout ? `${pA || "?"} vs ${pB || "?"}` : null;


  const isModified =
    effectiveScoreA !== (initialPrediction?.predicted_a ?? "") ||
    effectiveScoreB !== (initialPrediction?.predicted_b ?? "") ||
    effectiveWinnerId !== (initialPrediction?.predicted_winner_id ?? null);

  useEffect(() => {
    if (isControlled) return;
    if (isModified) return;
    setScoreA(initialPrediction?.predicted_a ?? "");
    setScoreB(initialPrediction?.predicted_b ?? "");
    setWinnerId(initialPrediction?.predicted_winner_id ?? null);
  }, [
    isControlled,
    isModified,
    match.id,
    initialPrediction?.predicted_a,
    initialPrediction?.predicted_b,
    initialPrediction?.predicted_winner_id,
  ]);

  const hasData = effectiveScoreA !== "" && effectiveScoreB !== "";

  const startTime = new Date(match.start_time);
  const isKickoff = new Date() >= startTime;
  const isFinished = match.is_finished;
  const isLocked = isMatchClosedForPredictions(match);
  const isLive =
    match.is_locked &&
    !isFinished &&
    isKickoff &&
    match.result_a !== null &&
    match.result_b !== null;

  // Indicacion para eliminatorias: si el marcador real fue empate y hubo definicion por penales.
  const matchIsDraw =
    match.result_a !== null &&
    match.result_b !== null &&
    match.result_a === match.result_b;
  const decidedOnPenalties =
    isKnockout && isFinished && matchIsDraw && match.winner_id != null;
  const penaltyWinnerName = decidedOnPenalties
    ? getKnockoutPenaltyWinnerDisplayName(match, {
        teamAName: teamAName,
        teamBName: teamBName,
      })
    : null;

  type SavePayload = {
    scoreA: number;
    scoreB: number;
    winnerId: number | null;
  };

  const autoSaveEnabled =
    !suppressSave && !isControlled && Boolean(userId) && !isLocked;

  const savePayload = useMemo((): SavePayload | null => {
    if (!autoSaveEnabled || !hasData) return null;
    if (isKnockout && isDraw && !effectiveWinnerId) return null;
    if (!isModified) return null;
    return {
      scoreA: Number(effectiveScoreA),
      scoreB: Number(effectiveScoreB),
      winnerId: effectiveWinnerId,
    };
  }, [
    autoSaveEnabled,
    hasData,
    isKnockout,
    isDraw,
    effectiveWinnerId,
    isModified,
    effectiveScoreA,
    effectiveScoreB,
  ]);

  const onAutoSave = useCallback(
    async (payload: SavePayload) => {
      await savePrediction(
        match.id,
        payload.scoreA,
        payload.scoreB,
        payload.winnerId
      );
      router.refresh();
    },
    [match.id, router]
  );

  const { status: saveStatus, scheduleSave, flush, retry, syncSavedKey, isBusy } =
    useAutoSavePrediction<SavePayload>({
      enabled: autoSaveEnabled,
      onSave: onAutoSave,
      serialize: (p) => `${p.scoreA}:${p.scoreB}:${p.winnerId ?? ""}`,
    });

  useEffect(() => {
    scheduleSave(savePayload);
  }, [savePayload, scheduleSave]);

  useEffect(() => {
    if (isControlled || !initialPrediction) return;
    if (isModified) return;
    if (
      initialPrediction.predicted_a == null ||
      initialPrediction.predicted_b == null
    ) {
      return;
    }
    syncSavedKey({
      scoreA: initialPrediction.predicted_a,
      scoreB: initialPrediction.predicted_b,
      winnerId: initialPrediction.predicted_winner_id ?? null,
    });
  }, [
    initialPrediction?.predicted_a,
    initialPrediction?.predicted_b,
    initialPrediction?.predicted_winner_id,
    isControlled,
    isModified,
    syncSavedKey,
  ]);

  useEffect(() => {
    if (!autoSaveEnabled) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isBusy || savePayload) {
        e.preventDefault();
      }
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [autoSaveEnabled, isBusy, savePayload]);

  const showSavedState =
    saveStatus === "saved" ||
    (saveStatus === "idle" && !isModified && hasData);

  const getStageName = (stage: string, groupId: string | null) => {
    if (stage === 'group') return groupId ? `Grupo ${groupId}` : 'Fase de Grupos';
    const stages: Record<string, string> = {
      round_32: "Dieciseisavos",
      round_16: "Octavos",
      quarter_final: "Cuartos",
      semi_final: "Semifinal",
      third_place: "3er Puesto",
      final: "Final",
    };
    return stages[stage] || stage;
  };

  const getFlagUrl = (team: any) => {
    if (!team?.iso_code) return null;
    const name = (team.name || "").toLowerCase();
    const code = team.iso_code.toLowerCase();
    
    // Si es un código especial del Reino Unido
    const special: Record<string, string> = { 'gb-sct': 'gb-sct', 'gb-eng': 'gb-eng', 'gb-wls': 'gb-wls' };
    if (special[code]) return `https://flagcdn.com/w160/${special[code]}.png`;
    
    // Casos especiales por nombre (fallback)
    if (name.includes("scot") || name.includes("escoc")) return "https://flagcdn.com/w160/gb-sct.png";
    if (name.includes("engl") || name.includes("ingla")) return "https://flagcdn.com/w160/gb-eng.png";
    
    // Si no es un código de 2 letras y no es especial, no hay bandera
    if (code.length !== 2) return null;
    return `https://flagcdn.com/w160/${code}.png`;
  };

  const fetchGroupPredictions = async () => {
    if (!poolId || !poolMembers?.length) return;
    if (showSpy) { setShowSpy(false); return; }

    setLoadingSpy(true);
    setShowSpy(true);

    try {
      const sortedPreds = await fetchPoolMatchPredictions(
        poolId,
        match.id,
        poolMembers,
        phaseCompleteByUser ?? {}
      );
      setGroupPredictions(sortedPreds);
    } catch (error) {
      console.error("Error fetching group predictions:", error);
    } finally {
      setLoadingSpy(false);
    }
  };

  const BallIcon = ({ size = 28 }: { size?: number }) => (
    <div className="flex flex-col items-center justify-center w-full h-full bg-gray-200 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-600">
      <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-40">
        <circle cx="12" cy="12" r="10"/><path d="m12 2 3.5 3.5L12 9 8.5 5.5 12 2Z"/><path d="m12 22-3.5-3.5L12 15l3.5 3.5L12 22Z"/><path d="m2 12 3.5-3.5L9 12l-3.5 3.5L2 12Z"/><path d="m22 12-3.5 3.5L15 12l3.5-3.5L22 12Z"/>
      </svg>
    </div>
  );

  const BracketSlotBox = ({ label }: { label: string }) => (
    <div className="w-9 h-9 sm:w-16 sm:h-16 shrink-0 rounded-xl sm:rounded-2xl flex items-center justify-center sm:mb-3 border-2 border-dashed border-gray-200 dark:border-zinc-700 bg-gray-50/80 dark:bg-zinc-800/50 px-0.5 sm:px-1">
      <span className="text-[6px] sm:text-[7px] font-black text-gray-500 dark:text-zinc-400 uppercase tracking-tight text-center leading-tight line-clamp-3">
        {label}
      </span>
    </div>
  );

  const TeamIcon = ({
    team,
    isSelected,
    isConfirmed,
    isProjected,
    bracketOnly,
    bracketLabel,
  }: {
    team: { name: string; iso_code?: string } | null | undefined;
    isSelected?: boolean;
    isConfirmed?: boolean;
    isProjected?: boolean;
    bracketOnly?: boolean;
    bracketLabel?: string;
  }) => {
    if (bracketOnly && bracketLabel) {
      return (
        <div className="relative group/icon">
          <BracketSlotBox label={bracketLabel} />
        </div>
      );
    }
    if (!team) {
      return (
        <div className="relative group/icon shrink-0">
          <div className="w-9 h-9 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl flex items-center justify-center sm:mb-3 border-2 bg-gray-100 dark:bg-zinc-800 border-gray-100 dark:border-zinc-700">
            <BallIcon size={18} />
          </div>
        </div>
      );
    }
    const flag = getFlagUrl(team);
    return (
      <div className="relative group/icon shrink-0">
        <div className={`w-9 h-9 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl flex items-center justify-center sm:mb-3 border-2 transition-all overflow-hidden ${isSelected ? 'border-blue-500 shadow-lg shadow-blue-500/20' : 'bg-gray-100 dark:bg-zinc-800 border-gray-100 dark:border-zinc-700'}`}>
          {flag ? (
            <img src={flag} alt={team.name} className="w-full h-full object-cover" onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
              const parent = (e.target as HTMLImageElement).parentElement;
              if (parent) parent.classList.add('bg-gray-200');
            }} />
          ) : <BallIcon size={18} />}
        </div>
        {isKnockout && team && (isConfirmed || isProjected) && (
          <div
            className={`absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 w-3 h-3 sm:w-4 sm:h-4 rounded-full border-2 border-white dark:border-zinc-900 flex items-center justify-center shadow-sm ${
              isConfirmed ? "bg-green-500" : "bg-blue-400 animate-pulse"
            }`}
            title={isConfirmed ? "Clasificado (oficial)" : "Clasificado (tu pronóstico)"}
          >
            {isConfirmed ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
            ) : (
              <span className="w-1 h-1 bg-white rounded-full"></span>
            )}
          </div>
        )}
      </div>
    );
  };

  const dateLabel = formatMatchDateShort(match.start_time);
  const timeLabel = formatMatchTime(match.start_time);

  return (
    <div
      className={`bg-white dark:bg-zinc-900 rounded-2xl sm:rounded-[3rem] shadow-sm border transition-all overflow-hidden h-full ${
        isFinished
          ? "border-blue-500 ring-2 sm:ring-4 ring-blue-500/10"
          : isLive
            ? "border-red-500 ring-2 sm:ring-4 ring-red-500/10"
            : showSavedState
              ? "border-green-500 ring-2 sm:ring-4 ring-green-500/10"
              : "border-gray-100 dark:border-zinc-800"
      }`}
    >
      {isFinished ? (
        <div className="bg-blue-600 text-white text-[8px] sm:text-[10px] font-black uppercase tracking-[0.2em] sm:tracking-[0.3em] py-1.5 sm:py-2.5 text-center shadow-inner">
          Finalizado
        </div>
      ) : isLive ? (
        <div className="bg-red-600 text-white text-[8px] sm:text-[10px] font-black uppercase tracking-[0.2em] sm:tracking-[0.3em] py-1.5 sm:py-2.5 text-center animate-pulse shadow-inner flex items-center justify-center gap-1.5">
          <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-white rounded-full"></span>
          En vivo
        </div>
      ) : null}

      <div className="relative p-3 pt-7 sm:p-8 sm:pt-8">
        <div className="absolute top-2 left-2 right-2 flex items-start justify-between gap-1 pointer-events-none z-10">
          <div className="flex items-center gap-1 min-w-0">
            <span
              className={`text-[7px] sm:text-[9px] font-black uppercase tracking-wider sm:tracking-widest px-1.5 sm:px-3 py-0.5 sm:py-1 rounded-md sm:rounded-lg truncate max-w-[5.5rem] sm:max-w-none ${
                isLive
                  ? "bg-red-50 text-red-600 dark:bg-red-950/20"
                  : "bg-blue-50 text-blue-600 dark:bg-blue-900/20"
              }`}
            >
              {getStageName(match.stage, match.group_id)}
            </span>
            {isKnockout && (
              <span className="hidden sm:inline text-[9px] font-black text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded-lg">
                #{match.id}
              </span>
            )}
          </div>
          <span className="text-[7px] sm:text-[9px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wide shrink-0 tabular-nums">
            {dateLabel} {timeLabel}
          </span>
        </div>

        {expectedMatchup && (
          <p className="hidden sm:block text-[8px] font-black text-gray-400 bg-gray-50 dark:bg-zinc-800/50 px-2 py-1 rounded-md border border-gray-100 dark:border-zinc-800 mb-3 text-center">
            {expectedMatchup}
          </p>
        )}

        <div className="flex flex-col items-center">
          {(isLive || isFinished) && (
            <div
              className={`mb-2 sm:mb-6 flex flex-col sm:flex-col items-center p-2 sm:p-4 rounded-xl sm:rounded-3xl w-full transition-all border ${
                isLive
                  ? "bg-red-50/50 border-red-100 dark:bg-red-950/10 dark:border-red-900/20"
                  : "bg-gray-50 border-gray-100 dark:bg-zinc-800/50 dark:border-zinc-700"
              }`}
            >
              <span
                className={`text-[7px] sm:text-[9px] font-black uppercase tracking-widest mb-0.5 sm:mb-2 ${
                  isLive ? "text-red-500" : "text-gray-400"
                }`}
              >
                {isLive ? "Marcador" : "Resultado"}
              </span>
              <div className="flex items-center gap-2 sm:gap-6">
                <span
                  className={`text-xl sm:text-4xl font-black tracking-tighter ${
                    isLive ? "text-red-600" : "text-gray-900 dark:text-white"
                  }`}
                >
                  {match.result_a ?? 0}
                </span>
                <span
                  className={`text-sm sm:text-xl font-black ${
                    isLive ? "text-red-300" : "text-gray-300"
                  }`}
                >
                  -
                </span>
                <span
                  className={`text-xl sm:text-4xl font-black tracking-tighter ${
                    isLive ? "text-red-600" : "text-gray-900 dark:text-white"
                  }`}
                >
                  {match.result_b ?? 0}
                </span>
              </div>
              {decidedOnPenalties && (
                <div className="mt-1 sm:mt-3 text-[7px] sm:text-[8px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 rounded-lg sm:rounded-xl px-2 py-0.5 sm:px-3 sm:py-1 text-center leading-tight">
                  {penaltyWinnerName
                    ? `Penales: ${penaltyWinnerName}`
                    : "Penales"}
                </div>
              )}
            </div>
          )}

          <div className="flex items-center justify-between w-full gap-1 sm:gap-4 mb-2 sm:mb-8 mt-1 sm:mt-0">
            <button
              type="button"
              disabled={!isDraw || isLocked || !isKnockout || showBracketSlotA}
              onClick={() => patchScores({ winnerId: match.team_a_id })}
              className={`flex-1 min-w-0 flex flex-row sm:flex-col items-center sm:text-center gap-1 sm:gap-0 p-1 sm:p-2 rounded-xl sm:rounded-3xl transition-all ${
                effectiveWinnerId === match.team_a_id && isDraw
                  ? "bg-blue-50 dark:bg-blue-900/20 border border-blue-500 sm:border-2 sm:scale-105"
                  : "border border-transparent"
              }`}
            >
              <TeamIcon
                team={match.team_a}
                isSelected={effectiveWinnerId === match.team_a_id && isDraw}
                isConfirmed={match.is_confirmed_a}
                isProjected={match.is_projected_a}
                bracketOnly={showBracketSlotA}
                bracketLabel={slotLabelA}
              />
              <div
                className={`flex flex-col items-start sm:items-center justify-center min-w-0 flex-1 ${showBracketSlotA ? "min-h-0" : "sm:h-8"}`}
              >
                {!showBracketSlotA && (
                  <span className="text-[8px] sm:text-[10px] font-black text-gray-900 dark:text-zinc-100 uppercase tracking-tight leading-tight line-clamp-2 sm:line-clamp-2 w-full text-left sm:text-center">
                    {teamAName}
                  </span>
                )}
                {match.ghost_team_a && (
                  <span className="hidden sm:block text-[7px] font-bold text-gray-400 uppercase tracking-widest line-clamp-1 mt-0.5">
                    Pronóstico: {match.ghost_team_a}
                  </span>
                )}
              </div>
              {isDraw && isKnockout && (
                <span className="hidden sm:inline text-[8px] font-black mt-2 uppercase text-blue-600 animate-pulse">
                  ¿Clasifica?
                </span>
              )}
            </button>

            <div className="flex flex-col items-center gap-0.5 sm:gap-1 shrink-0 px-0.5">
              <span className="hidden sm:block text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">
                {isFinished ? "Tu Pronóstico" : "Tu Predicción"}
              </span>
              <div className="flex items-center gap-1 sm:gap-2">
                <input
                  type="number"
                  min="0"
                  value={effectiveScoreA}
                  onChange={(e) =>
                    patchScores({
                      scoreA:
                        e.target.value === "" ? "" : Number(e.target.value),
                    })
                  }
                  onBlur={() => flush()}
                  className={`w-9 h-9 sm:w-14 sm:h-14 text-center text-base sm:text-2xl font-black rounded-lg sm:rounded-2xl outline-none ${
                    isLocked
                      ? "bg-gray-100 dark:bg-zinc-800 text-gray-400 border-none shadow-inner"
                      : "bg-white dark:bg-zinc-800 border border-gray-100 sm:border-2 focus:border-blue-500 text-gray-900 dark:text-white"
                  }`}
                  placeholder="-"
                  disabled={!userId || isLocked}
                />
                <span className="text-gray-300 font-black text-sm sm:text-base">
                  :
                </span>
                <input
                  type="number"
                  min="0"
                  value={effectiveScoreB}
                  onChange={(e) =>
                    patchScores({
                      scoreB:
                        e.target.value === "" ? "" : Number(e.target.value),
                    })
                  }
                  onBlur={() => flush()}
                  className={`w-9 h-9 sm:w-14 sm:h-14 text-center text-base sm:text-2xl font-black rounded-lg sm:rounded-2xl outline-none ${
                    isLocked
                      ? "bg-gray-100 dark:bg-zinc-800 text-gray-400 border-none shadow-inner"
                      : "bg-white dark:bg-zinc-800 border border-gray-100 sm:border-2 focus:border-blue-500 text-gray-900 dark:text-white"
                  }`}
                  placeholder="-"
                  disabled={!userId || isLocked}
                />
              </div>
              {initialPrediction?.points_won != null && isFinished && (
                <div className="mt-1 sm:mt-3 flex flex-col items-center gap-0.5 sm:gap-1">
                  <div className="px-1.5 sm:px-3 py-0.5 bg-green-100 text-green-700 rounded-full text-[7px] sm:text-[8px] font-black uppercase tracking-widest">
                    +{initialPrediction.points_won} pts
                  </div>
                  {initialPrediction.predicted_a != null &&
                    initialPrediction.predicted_b != null &&
                    match.result_a != null &&
                    match.result_b != null && (
                      <span className="hidden sm:block text-[7px] font-bold text-gray-400 uppercase tracking-wider text-center">
                        {formatPointsBreakdown(
                          getPointsBreakdown(
                            initialPrediction,
                            match,
                            knockoutResolved
                          )
                        )}
                      </span>
                    )}
                </div>
              )}
            </div>

            <button
              type="button"
              disabled={!isDraw || isLocked || !isKnockout || showBracketSlotB}
              onClick={() => patchScores({ winnerId: match.team_b_id })}
              className={`flex-1 min-w-0 flex flex-row-reverse sm:flex-col items-center sm:text-center gap-1 sm:gap-0 p-1 sm:p-2 rounded-xl sm:rounded-3xl transition-all ${
                effectiveWinnerId === match.team_b_id && isDraw
                  ? "bg-blue-50 dark:bg-blue-900/20 border border-blue-500 sm:border-2 sm:scale-105"
                  : "border border-transparent"
              }`}
            >
              <TeamIcon
                team={match.team_b}
                isSelected={effectiveWinnerId === match.team_b_id && isDraw}
                isConfirmed={match.is_confirmed_b}
                isProjected={match.is_projected_b}
                bracketOnly={showBracketSlotB}
                bracketLabel={slotLabelB}
              />
              <div
                className={`flex flex-col items-end sm:items-center justify-center min-w-0 flex-1 ${showBracketSlotB ? "min-h-0" : "sm:h-8"}`}
              >
                {!showBracketSlotB && (
                  <span className="text-[8px] sm:text-[10px] font-black text-gray-900 dark:text-zinc-100 uppercase tracking-tight leading-tight line-clamp-2 sm:line-clamp-2 w-full text-right sm:text-center">
                    {teamBName}
                  </span>
                )}
                {match.ghost_team_b && (
                  <span className="hidden sm:block text-[7px] font-bold text-gray-400 uppercase tracking-widest line-clamp-1 mt-0.5">
                    Pronóstico: {match.ghost_team_b}
                  </span>
                )}
              </div>
              {isDraw && isKnockout && (
                <span className="hidden sm:inline text-[8px] font-black mt-2 uppercase text-blue-600 animate-pulse">
                  ¿Clasifica?
                </span>
              )}
            </button>
          </div>

          {poolId && isLocked && leagueOutcomeSummary && (
            <MatchOutcomeSummaryBar summary={leagueOutcomeSummary} />
          )}

          {!suppressSave && (
          <div className="w-full flex gap-1.5 sm:gap-3">
            {!userId ? (
              <div className="flex-1 py-2 sm:py-4 text-center text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-gray-400 bg-gray-50 dark:bg-zinc-800 rounded-xl sm:rounded-2xl border border-dashed">
                Entrar
              </div>
            ) : isFinished ? (
              <div className="flex-1 py-2 sm:py-4 text-center text-[8px] sm:text-[9px] font-black uppercase tracking-widest rounded-xl sm:rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 dark:bg-blue-950/20 dark:border-blue-900/30">
                Cerrado
              </div>
            ) : isLocked ? (
              <div className="flex-1 py-2 sm:py-4 text-center text-[8px] sm:text-[9px] font-black uppercase tracking-widest rounded-xl sm:rounded-2xl bg-orange-50 text-orange-500 border border-orange-100 dark:bg-orange-950/20 dark:border-orange-900/30 animate-pulse">
                En juego
              </div>
            ) : (
              <div
                className={`flex-1 py-2 sm:py-4 px-2 sm:px-6 rounded-xl sm:rounded-2xl text-[8px] sm:text-[9px] font-black uppercase tracking-wide sm:tracking-[0.2em] flex items-center justify-center min-h-[2rem] sm:min-h-[3.25rem] ${
                  saveStatus === "error"
                    ? "bg-red-50 dark:bg-red-950/20 text-red-600 border border-red-100 dark:border-red-900/30"
                    : showSavedState
                      ? "bg-green-50 dark:bg-green-950/20 text-green-600 border border-green-100 dark:border-green-900/30"
                      : saveStatus === "pending" || saveStatus === "saving"
                        ? "bg-blue-50 dark:bg-blue-950/20 text-blue-600 border border-blue-100 dark:border-blue-900/30"
                        : "bg-gray-50 dark:bg-zinc-800 text-gray-400 border border-gray-100 dark:border-zinc-700"
                }`}
              >
                {saveStatus === "saving" && "Guardando…"}
                {saveStatus === "pending" && "Guardando en breve…"}
                {saveStatus === "saved" && "Guardado"}
                {saveStatus === "error" && (
                  <button
                    type="button"
                    onClick={retry}
                    className="underline hover:no-underline"
                  >
                    Error — Reintentar
                  </button>
                )}
                {saveStatus === "idle" && showSavedState && "Guardado"}
                {saveStatus === "idle" &&
                  !showSavedState &&
                  isKnockout &&
                  isDraw &&
                  !effectiveWinnerId &&
                  hasData &&
                  "Elige quién pasa"}
                {saveStatus === "idle" &&
                  !showSavedState &&
                  !(isKnockout && isDraw && !effectiveWinnerId && hasData) &&
                  !hasData &&
                  "Autoguardado al completar"}
                {saveStatus === "idle" &&
                  !showSavedState &&
                  hasData &&
                  isModified &&
                  !(isKnockout && isDraw && !effectiveWinnerId) &&
                  "Pendiente de guardar"}
              </div>
            )}
            {poolId && poolMembers && poolMembers.length > 0 && (
              <button
                type="button"
                onClick={fetchGroupPredictions}
                className={`w-10 sm:w-16 shrink-0 flex items-center justify-center rounded-xl sm:rounded-2xl border transition-all ${
                  showSpy
                    ? "bg-zinc-900 text-white border-zinc-900 shadow-xl"
                    : "bg-white dark:bg-zinc-900 border-gray-100 dark:border-zinc-800 text-gray-400 hover:border-blue-500"
                }`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="sm:w-5 sm:h-5"
                >
                  <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              </button>
            )}
          </div>
          )}
        </div>
      </div>

      {showSpy && (
        <div className="border-t border-gray-50 dark:border-zinc-800 p-3 sm:p-8 bg-gray-50/30 dark:bg-zinc-950/20 col-span-full">
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-center mb-3 sm:mb-6">
            <h4 className="text-[8px] sm:text-[9px] font-black uppercase tracking-[0.2em] sm:tracking-[0.3em] text-gray-400">
              Pronósticos de la liga
            </h4>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[7px] font-bold text-gray-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500" /> ok
              </span>
              <span className="text-[7px] font-bold text-gray-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-500" /> pendiente
              </span>
              {isLive && (
                <span className="text-[8px] font-black text-red-500 uppercase bg-red-50 px-2 py-1 rounded-md animate-pulse">
                  Live
                </span>
              )}
            </div>
          </div>
          {loadingSpy ? (
            <div className="py-6 text-center text-[9px] font-black text-gray-400 animate-pulse uppercase tracking-widest italic">Cargando...</div>
          ) : groupPredictions.length > 0 ? (
            <div className="grid grid-cols-1 gap-3">
              {groupPredictions.map((pred) => {
                const hasPrediction =
                  pred.predicted_a != null && pred.predicted_b != null;
                let displayPoints = pred.points_won;
                if (isLive && hasPrediction) {
                  displayPoints = calculatePoints(pred, match, knockoutResolved);
                }
                return (
                  <div
                    key={pred.user_id}
                    className={`bg-white dark:bg-zinc-900 p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm ${
                      poolId
                        ? "flex flex-col gap-2"
                        : "flex justify-between items-center transition-transform hover:translate-x-1"
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0 w-full">
                      <span
                        className={`w-2.5 h-2.5 rounded-full shrink-0 border-2 border-white dark:border-zinc-900 shadow-sm ${
                          pred.phaseComplete ? "bg-green-500" : "bg-orange-500"
                        }`}
                        title={
                          pred.phaseComplete
                            ? "Fase completa"
                            : "Fase incompleta"
                        }
                      />
                      <div className="flex flex-col min-w-0 flex-1">
                        <span className="text-[10px] sm:text-[11px] font-black text-gray-700 dark:text-zinc-300 uppercase tracking-tight leading-tight break-words">
                          {pred.nickname}
                        </span>
                        {displayPoints !== null && displayPoints !== undefined && (
                          <span
                            className={`text-[8px] font-black uppercase tracking-widest ${
                              displayPoints > 0
                                ? "text-green-600"
                                : "text-gray-400"
                            }`}
                          >
                            {displayPoints} pts
                          </span>
                        )}
                      </div>
                    </div>
                    <div
                      className={`flex items-center gap-2 shrink-0 ${
                        poolId ? "justify-center w-full" : "gap-3"
                      }`}
                    >
                      {hasPrediction ? (
                        <>
                          <span className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center bg-gray-50 dark:bg-zinc-800 rounded-lg sm:rounded-xl font-black text-blue-600 text-base sm:text-lg shadow-inner">
                            {pred.predicted_a}
                          </span>
                          <span className="font-black text-gray-200">:</span>
                          <span className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center bg-gray-50 dark:bg-zinc-800 rounded-lg sm:rounded-xl font-black text-blue-600 text-base sm:text-lg shadow-inner">
                            {pred.predicted_b}
                          </span>
                        </>
                      ) : (
                        <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest italic px-2">
                          Sin predicción
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="py-6 text-center text-[9px] font-black text-gray-300 uppercase italic">Nadie ha predicho</p>
          )}
        </div>
      )}
    </div>
  );
}
