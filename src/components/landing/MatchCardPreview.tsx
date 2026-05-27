/** Vista previa estática para la landing (sin datos ni Supabase). */
export default function MatchCardPreview() {
  return (
    <div className="relative w-full max-w-sm mx-auto" aria-hidden>
      <div className="absolute -inset-4 bg-gradient-to-br from-blue-500/20 to-green-500/10 blur-2xl rounded-[3rem] pointer-events-none" />
      <div className="relative bg-white dark:bg-zinc-900 rounded-[2.5rem] shadow-2xl border border-gray-100 dark:border-zinc-800 overflow-hidden rotate-1 hover:rotate-0 transition-transform duration-500">
        <div className="bg-green-500 text-white text-[9px] font-black uppercase tracking-[0.25em] py-2 text-center">
          Guardado
        </div>
        <div className="px-6 pt-5 pb-2">
          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest text-center">
            Grupo B · Fase de grupos
          </p>
        </div>
        <div className="px-6 pb-6 flex items-center justify-between gap-3">
          <div className="flex flex-col items-center flex-1 min-w-0">
            <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-zinc-800 border-2 border-blue-500 shadow-lg shadow-blue-500/20 flex items-center justify-center text-2xl mb-2">
              🇪🇸
            </div>
            <span className="text-[10px] font-black uppercase tracking-tight text-gray-900 dark:text-white truncate w-full text-center">
              España
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 text-xl font-black flex items-center justify-center">
              2
            </span>
            <span className="text-gray-300 font-black">:</span>
            <span className="w-11 h-11 rounded-xl bg-gray-50 dark:bg-zinc-800 text-gray-900 dark:text-white text-xl font-black flex items-center justify-center">
              1
            </span>
          </div>
          <div className="flex flex-col items-center flex-1 min-w-0">
            <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 flex items-center justify-center text-2xl mb-2">
              🇧🇷
            </div>
            <span className="text-[10px] font-black uppercase tracking-tight text-gray-500 dark:text-zinc-400 truncate w-full text-center">
              Brasil
            </span>
          </div>
        </div>
        <div className="px-6 pb-5 flex items-center justify-between border-t border-gray-50 dark:border-zinc-800 pt-3">
          <span className="text-[9px] font-bold text-gray-400">+3 pts si aciertas</span>
          <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest">
            Tu ranking #12
          </span>
        </div>
      </div>
    </div>
  );
}
