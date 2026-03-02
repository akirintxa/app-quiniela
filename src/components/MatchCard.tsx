'use client';

import { useState, useEffect } from "react";
import { Match, Prediction } from "@/types";
import { savePrediction } from "@/app/actions";
import { createClient } from "@/utils/supabase/client";
import { calculatePoints } from "@/lib/points";

interface MatchCardProps {
  match: Match & { is_locked?: boolean, is_finished?: boolean };
  userId?: string;
  initialPrediction?: Prediction | null;
  poolId?: string;
}

export default function MatchCard({ match, userId, initialPrediction, poolId }: MatchCardProps) {
  const [scoreA, setScoreA] = useState<number | string>(initialPrediction?.predicted_a ?? "");
  const [scoreB, setScoreB] = useState<number | string>(initialPrediction?.predicted_b ?? "");
  const [winnerId, setWinnerId] = useState<number | null>(initialPrediction?.predicted_winner_id ?? null);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  
  const [showSpy, setShowSpy] = useState(false);
  const [groupPredictions, setGroupPredictions] = useState<any[]>([]);
  const [loadingSpy, setLoadingSpy] = useState(false);

  useEffect(() => {
    setScoreA(initialPrediction?.predicted_a ?? "");
    setScoreB(initialPrediction?.predicted_b ?? "");
    setWinnerId(initialPrediction?.predicted_winner_id ?? null);
  }, [initialPrediction]);

  const teamAName = match.team_a?.name || `Team ${match.team_a_id}`;
  const teamBName = match.team_b?.name || `Team ${match.team_b_id}`;
  const startTime = new Date(match.start_time);
  
  const isMatchStarted = new Date() > startTime;
  const isFinished = match.is_finished;
  const isLive = match.is_locked && !isFinished;
  const isLocked = match.is_locked || isMatchStarted || isFinished;
  const isKnockout = match.stage !== "group";
  const isDraw = scoreA !== "" && scoreB !== "" && Number(scoreA) === Number(scoreB);

  // NUEVA LÓGICA: ¿Ha cambiado el usuario los valores respecto a lo guardado?
  const isModified = 
    scoreA !== (initialPrediction?.predicted_a ?? "") || 
    scoreB !== (initialPrediction?.predicted_b ?? "") ||
    winnerId !== (initialPrediction?.predicted_winner_id ?? null);

  const hasData = scoreA !== "" && scoreB !== "";

  const getFlagUrl = (iso: string) => {
    if (!iso) return null;
    const cleanIso = iso.toLowerCase();
    if (cleanIso === 'gb-sct') return `https://flagcdn.com/w80/gb-sct.png`;
    if (cleanIso === 'gb-eng') return `https://flagcdn.com/w80/gb-eng.png`;
    if (cleanIso === 'gb-wls') return `https://flagcdn.com/w80/gb-wls.png`;
    if (iso.length !== 2) return null; 
    return `https://flagcdn.com/w80/${cleanIso}.png`;
  };

  const handleSave = async () => {
    if (!userId || isLocked) return;
    if (scoreA === "" || scoreB === "") return;
    if (isKnockout && isDraw && !winnerId) {
      alert("En eliminatorias, debes elegir quién pasa de ronda.");
      return;
    }
    setLoading(true);
    try {
      await savePrediction(match.id, Number(scoreA), Number(scoreB), winnerId);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      alert("Error al guardar");
    } finally {
      setLoading(false);
    }
  };

  const fetchGroupPredictions = async () => {
    if (!poolId || showSpy) { setShowSpy(!showSpy); return; }
    setLoadingSpy(true);
    setShowSpy(true);
    const supabase = createClient();
    const { data: members } = await supabase.from('pool_members').select('user_id').eq('pool_id', poolId);
    if (members && members.length > 0) {
      const { data: preds } = await supabase.from('predictions').select(`predicted_a, predicted_b, points_won, user_id, profiles:user_id (nickname)`).eq('match_id', match.id).in('user_id', members.map(m => m.user_id));
      setGroupPredictions(preds || []);
    }
    setLoadingSpy(false);
  };

  const TeamIcon = ({ team, isSelected }: { team: any, isSelected?: boolean }) => {
    const flag = getFlagUrl(team?.iso_code);
    return (
      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-3 border-2 transition-all overflow-hidden ${isSelected ? 'border-blue-500 shadow-lg shadow-blue-500/20' : 'bg-gray-100 dark:bg-zinc-800 border-gray-100 dark:border-zinc-700'}`}>
        {flag ? (
          <img 
            src={flag} 
            alt={team.name} 
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
              (e.target as HTMLImageElement).parentElement!.classList.add('bg-zinc-200', 'dark:bg-zinc-700');
            }}
          />
        ) : (
          <div className="flex flex-col items-center justify-center w-full h-full bg-zinc-100 dark:bg-zinc-800">
            <span className="text-2xl mb-1">⚽</span>
            <span className="text-[8px] font-black text-zinc-400 uppercase tracking-tighter">{team?.iso_code}</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`bg-white dark:bg-zinc-900 rounded-[2.5rem] shadow-sm border transition-all overflow-hidden ${
      isFinished ? 'border-blue-500 ring-4 ring-blue-500/10' : 
      isLive ? 'border-red-500 ring-4 ring-red-500/10' :
      saved ? 'border-green-500 ring-4 ring-green-500/10' : 'border-gray-100 dark:border-zinc-800'
    }`}>
      {/* Header Badges */}
      {isFinished ? (
        <div className="bg-blue-600 text-white text-[10px] font-black uppercase tracking-[0.3em] py-2.5 text-center shadow-inner">Partido Finalizado</div>
      ) : isLive ? (
        <div className="bg-red-600 text-white text-[10px] font-black uppercase tracking-[0.3em] py-2.5 text-center animate-pulse shadow-inner flex items-center justify-center gap-2">
          <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
          En Vivo • Resultado Parcial
        </div>
      ) : null}

      <div className="p-8">
        <div className="flex flex-col items-center">
          <div className="flex justify-between w-full mb-8 px-1">
            <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-lg ${isLive ? 'bg-red-50 text-red-600 dark:bg-red-950/20' : 'bg-blue-50 text-blue-600 dark:bg-blue-900/20'}`}>
              {match.stage.replace("_", " ")} {match.group_id ? `• Grupo ${match.group_id}` : ""}
            </span>
            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
              {startTime.toLocaleDateString([], { day: '2-digit', month: 'short' })} {startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>

          {/* MAIN SCORE UNIT (Only for Live or Finished) */}
          {(isLive || isFinished) && (
            <div className={`mb-6 flex flex-col items-center p-4 rounded-3xl w-full transition-all border-2 ${isLive ? 'bg-red-50/50 border-red-100 dark:bg-red-950/10 dark:border-red-900/20 shadow-lg' : 'bg-gray-50 border-gray-100 dark:bg-zinc-800/50 dark:border-zinc-700'}`}>
              <span className={`text-[9px] font-black uppercase tracking-[0.3em] mb-2 ${isLive ? 'text-red-500' : 'text-gray-400'}`}>
                {isLive ? 'Marcador Actual' : 'Resultado Final'}
              </span>
              <div className="flex items-center gap-6">
                <span className={`text-4xl font-black ${isLive ? 'text-red-600' : 'text-gray-900 dark:text-white'} tracking-tighter`}>{match.result_a ?? 0}</span>
                <span className={`text-xl font-black ${isLive ? 'text-red-300' : 'text-gray-300'}`}>-</span>
                <span className={`text-4xl font-black ${isLive ? 'text-red-600' : 'text-gray-900 dark:text-white'} tracking-tighter`}>{match.result_b ?? 0}</span>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between w-full gap-2 sm:gap-4 mb-8">
            <button 
              disabled={!isDraw || isLocked || !isKnockout}
              onClick={() => setWinnerId(match.team_a_id)}
              className={`flex-1 flex flex-col items-center text-center p-2 rounded-3xl transition-all ${winnerId === match.team_a_id && isDraw ? 'bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-500 scale-105' : 'border-2 border-transparent'}`}
            >
              <TeamIcon team={match.team_a} isSelected={winnerId === match.team_a_id && isDraw} />
              <div className="h-8 flex items-center justify-center">
                <span className="text-[10px] font-black text-gray-900 dark:text-zinc-100 uppercase tracking-tighter leading-tight line-clamp-2">{teamAName}</span>
              </div>
              {isDraw && isKnockout && <span className="text-[8px] font-black mt-2 uppercase text-blue-600 animate-pulse">¿Clasifica?</span>}
            </button>

            <div className="flex flex-col items-center gap-1 flex-shrink-0">
              <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">{isFinished ? 'Tu Pronóstico' : 'Tu Predicción'}</span>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <input type="number" min="0" value={scoreA} onChange={(e) => setScoreA(e.target.value === "" ? "" : Number(e.target.value))} className={`w-12 h-12 sm:w-14 sm:h-14 text-center text-xl sm:text-2xl font-black rounded-2xl outline-none ${isLocked ? 'bg-gray-100 dark:bg-zinc-800 text-gray-400 border-none shadow-inner' : 'bg-white dark:bg-zinc-800 border-2 border-gray-100 focus:border-blue-500 text-gray-900 dark:text-white'}`} placeholder="-" disabled={!userId || loading || isLocked} />
                <span className="text-gray-300 font-black">:</span>
                <input type="number" min="0" value={scoreB} onChange={(e) => setScoreB(e.target.value === "" ? "" : Number(e.target.value))} className={`w-12 h-12 sm:w-14 sm:h-14 text-center text-xl sm:text-2xl font-black rounded-2xl outline-none ${isLocked ? 'bg-gray-100 dark:bg-zinc-800 text-gray-400 border-none shadow-inner' : 'bg-white dark:bg-zinc-800 border-2 border-gray-100 focus:border-blue-500 text-gray-900 dark:text-white'}`} placeholder="-" disabled={!userId || loading || isLocked} />
              </div>
              {initialPrediction?.points_won !== null && initialPrediction?.points_won !== undefined && isFinished && (
                <div className="mt-3 px-3 py-1 bg-green-100 text-green-700 rounded-full text-[8px] font-black uppercase tracking-widest animate-in zoom-in duration-300">+{initialPrediction?.points_won} Puntos</div>
              )}
            </div>

            <button 
              disabled={!isDraw || isLocked || !isKnockout}
              onClick={() => setWinnerId(match.team_b_id)}
              className={`flex-1 flex flex-col items-center text-center p-2 rounded-3xl transition-all ${winnerId === match.team_b_id && isDraw ? 'bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-500 scale-105' : 'border-2 border-transparent'}`}
            >
              <TeamIcon team={match.team_b} isSelected={winnerId === match.team_b_id && isDraw} />
              <div className="h-8 flex items-center justify-center">
                <span className="text-[10px] font-black text-gray-900 dark:text-zinc-100 uppercase tracking-tighter leading-tight line-clamp-2">{teamBName}</span>
              </div>
              {isDraw && isKnockout && <span className="text-[8px] font-black mt-2 uppercase text-blue-600 animate-pulse">¿Clasifica?</span>}
            </button>
          </div>
          
          <div className="w-full flex gap-3">
            {!userId ? (
              <div className="flex-1 py-4 text-center text-[9px] font-black uppercase tracking-widest text-gray-400 bg-gray-50 dark:bg-zinc-800 rounded-2xl border border-dashed">Login para jugar</div>
            ) : isFinished ? (
              <div className="flex-1 py-4 text-center text-[9px] font-black uppercase tracking-widest rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 dark:bg-blue-950/20 dark:border-blue-900/30">Cerrado</div>
            ) : isLocked ? (
              <div className="flex-1 py-4 text-center text-[9px] font-black uppercase tracking-widest rounded-2xl bg-orange-50 text-orange-500 border border-orange-100 dark:bg-orange-950/20 dark:border-orange-900/30 animate-pulse">En Juego</div>
            ) : (
              <button 
                onClick={handleSave} 
                disabled={loading || !hasData || !isModified || (isKnockout && isDraw && !winnerId)} 
                className={`flex-1 py-4 px-6 rounded-2xl text-[9px] font-black transition-all uppercase tracking-[0.2em] shadow-lg ${
                  saved ? 'bg-green-500 text-white shadow-green-500/20' : 
                  (!isModified && hasData) ? 'bg-gray-50 dark:bg-zinc-800 text-gray-400 border border-gray-100 dark:border-zinc-700 shadow-none cursor-default' :
                  (!hasData || (isKnockout && isDraw && !winnerId)) ? 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none' : 
                  'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20 active:scale-95'
                }`}
              >
                {loading ? "..." : saved ? "¡Listo!" : (!isModified && hasData) ? "Guardado" : "Confirmar"}
              </button>
            )}
            {poolId && (
              <button onClick={fetchGroupPredictions} className={`w-16 flex items-center justify-center rounded-2xl border-2 transition-all ${showSpy ? 'bg-zinc-900 text-white border-zinc-900 shadow-xl' : 'bg-white dark:bg-zinc-900 border-gray-100 dark:border-zinc-800 text-gray-400 hover:border-blue-500'}`}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
              </button>
            )}
          </div>
        </div>
      </div>

      {showSpy && (
        <div className="border-t border-gray-50 dark:border-zinc-800 p-8 bg-gray-50/30 dark:bg-zinc-950/20">
          <div className="flex justify-between items-center mb-6">
            <h4 className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-400 flex items-center gap-3">Ranking de Pronósticos</h4>
            {isLive && <span className="text-[8px] font-black text-red-500 uppercase bg-red-50 px-2 py-1 rounded-md animate-pulse">Puntos Live</span>}
          </div>
          {loadingSpy ? (
            <div className="py-6 text-center text-[9px] font-black text-gray-400 animate-pulse uppercase tracking-widest italic">Cargando...</div>
          ) : groupPredictions.length > 0 ? (
            <div className="grid grid-cols-1 gap-3">
              {groupPredictions.map((pred, i) => {
                let displayPoints = pred.points_won;
                if (isLive) displayPoints = calculatePoints(pred as Prediction, match);
                return (
                  <div key={i} className="flex justify-between items-center bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm transition-transform hover:translate-x-1">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-gray-700 dark:text-zinc-300 uppercase tracking-tighter">{pred.profiles?.nickname}</span>
                      {displayPoints !== null && displayPoints !== undefined && <span className={`text-[8px] font-black uppercase tracking-widest ${displayPoints > 0 ? 'text-green-600' : 'text-gray-400'}`}>{displayPoints} Puntos</span>}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="w-10 h-10 flex items-center justify-center bg-gray-50 dark:bg-zinc-800 rounded-xl font-black text-blue-600 text-lg shadow-inner">{pred.predicted_a}</span>
                      <span className="font-black text-gray-200">:</span>
                      <span className="w-10 h-10 flex items-center justify-center bg-gray-50 dark:bg-zinc-800 rounded-xl font-black text-blue-600 text-lg shadow-inner">{pred.predicted_b}</span>
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
