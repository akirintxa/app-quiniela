'use client';

import { TeamStats } from "@/lib/standings";

export default function GroupStandings({ stats }: { stats: TeamStats[] }) {
  const getFlagUrl = (team: any) => {
    if (!team?.iso_code) return null;
    const name = (team.name || "").toLowerCase();
    const code = team.iso_code.toLowerCase();
    
    // Casos especiales para el Reino Unido
    if (name.includes("scot") || name.includes("escoc")) return "https://flagcdn.com/w80/gb-sct.png";
    if (name.includes("engl") || name.includes("ingla")) return "https://flagcdn.com/w80/gb-eng.png";
    if (name.includes("wale") || name.includes("gale")) return "https://flagcdn.com/w80/gb-wls.png";
    
    // Si no es un código de 2 letras (placeholder), no hay bandera
    if (code.length !== 2) return null;
    return `https://flagcdn.com/w80/${code}.png`;
  };

  const BallIcon = () => (
    <div className="flex items-center justify-center w-full h-full bg-gray-200 dark:bg-zinc-800 text-zinc-400">
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-50">
        <circle cx="12" cy="12" r="10"/><path d="m12 2 3.5 3.5L12 9 8.5 5.5 12 2Z"/><path d="m12 22-3.5-3.5L12 15l3.5 3.5L12 22Z"/><path d="m2 12 3.5-3.5L9 12l-3.5 3.5L2 12Z"/><path d="m22 12-3.5 3.5L15 12l3.5-3.5L22 12Z"/>
      </svg>
    </div>
  );

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-[2rem] shadow-xl border border-gray-100 dark:border-zinc-800 overflow-hidden mb-10">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[500px]">
          <thead>
            <tr className="bg-gray-50 dark:bg-zinc-800/50">
              <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-gray-400">Pos</th>
              <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-gray-400">Equipo</th>
              <th className="px-4 py-4 text-center text-[9px] font-black uppercase tracking-widest text-gray-400">PJ</th>
              <th className="px-4 py-4 text-center text-[9px] font-black uppercase tracking-widest text-gray-400">G</th>
              <th className="px-4 py-4 text-center text-[9px] font-black uppercase tracking-widest text-gray-400">E</th>
              <th className="px-4 py-4 text-center text-[9px] font-black uppercase tracking-widest text-gray-400">P</th>
              <th className="px-4 py-4 text-center text-[9px] font-black uppercase tracking-widest text-gray-400">DG</th>
              <th className="px-6 py-4 text-right text-[9px] font-black uppercase tracking-widest text-gray-400">Pts</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-zinc-800">
            {stats.map((s, index) => {
              const flag = getFlagUrl(s.team);
              return (
                <tr key={s.team.id} className="hover:bg-gray-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                  <td className="px-6 py-4 text-[10px] font-black text-gray-400">{index + 1}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-6 bg-gray-100 dark:bg-zinc-800 rounded-sm overflow-hidden flex-shrink-0 border border-gray-100 dark:border-zinc-700">
                        {flag ? (
                          <img src={flag} alt={s.team.name} className="w-full h-full object-cover" onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                            (e.target as HTMLImageElement).parentElement!.classList.add('bg-gray-200');
                          }} />
                        ) : <BallIcon />}
                      </div>
                      <span className="text-xs font-black uppercase tracking-tighter text-gray-900 dark:text-white truncate">{s.team.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-center text-xs font-bold text-gray-500">{s.played}</td>
                  <td className="px-4 py-4 text-center text-xs font-bold text-gray-500">{s.won}</td>
                  <td className="px-4 py-4 text-center text-xs font-bold text-gray-500">{s.drawn}</td>
                  <td className="px-4 py-4 text-center text-xs font-bold text-gray-500">{s.lost}</td>
                  <td className="px-4 py-4 text-center text-xs font-black text-gray-400">{s.gd > 0 ? `+${s.gd}` : s.gd}</td>
                  <td className="px-6 py-4 text-right font-black text-blue-600 dark:text-blue-400 text-sm">{s.points}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
