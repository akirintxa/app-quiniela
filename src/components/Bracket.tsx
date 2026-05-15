
'use client';

import { Match, Team } from "@/types";

interface BracketProps {
  matches: Match[];
}

export default function Bracket({ matches }: BracketProps) {
  const getStageMatches = (stage: string) => matches.filter(m => m.stage === stage);

  const stages = [
    { id: 'round_32', label: '1/16' },
    { id: 'round_16', label: '1/8' },
    { id: 'quarter_final', label: '1/4' },
    { id: 'semi_final', label: '1/2' },
    { id: 'final', label: 'Final' }
  ];

  return (
    <div className="flex flex-col gap-12 overflow-x-auto pb-12 no-scrollbar">
      <div className="flex gap-8 min-w-max px-4">
        {stages.map(stage => (
          <div key={stage.id} className="flex flex-col gap-4 w-48">
            <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400 text-center mb-4 bg-gray-50 dark:bg-zinc-900 py-2 rounded-xl">
              {stage.label}
            </h3>
            <div className="flex flex-col gap-4">
              {getStageMatches(stage.id).length > 0 ? (
                getStageMatches(stage.id).map(match => (
                  <div key={match.id} className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-2xl p-3 shadow-sm hover:border-blue-500 transition-all group">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[9px] font-black uppercase truncate text-gray-700 dark:text-zinc-300">
                          {match.team_a?.name || '???'}
                        </span>
                        <span className="text-xs font-black text-blue-600">
                          {match.result_a !== null ? match.result_a : '-'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[9px] font-black uppercase truncate text-gray-700 dark:text-zinc-300">
                          {match.team_b?.name || '???'}
                        </span>
                        <span className="text-xs font-black text-blue-600">
                          {match.result_b !== null ? match.result_b : '-'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="h-24 border-2 border-dashed border-gray-100 dark:border-zinc-800 rounded-2xl flex items-center justify-center">
                   <span className="text-[8px] font-black text-gray-300 uppercase tracking-widest">Sin asignar</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
