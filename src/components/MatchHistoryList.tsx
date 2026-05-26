import type { MatchHistoryRow } from "@/lib/match-history";

export default function MatchHistoryList({ rows }: { rows: MatchHistoryRow[] }) {
  return (
    <div className="space-y-3">
      {rows.map((h, i) => (
        <div
          key={i}
          className={`flex items-center justify-between p-4 rounded-2xl border ${
            h.kind === "bonus"
              ? "bg-orange-50/80 dark:bg-orange-950/20 border-orange-100 dark:border-orange-900/40"
              : "bg-gray-50 dark:bg-zinc-800/40 border-gray-100 dark:border-zinc-800/50"
          }`}
        >
          <div className="flex flex-col min-w-0">
            <span
              className={`text-[10px] font-black uppercase mb-1 ${
                h.kind === "bonus"
                  ? "text-orange-700 dark:text-orange-400"
                  : "text-gray-400"
              }`}
            >
              {h.match}
            </span>
            {h.kind === "match" ? (
              <>
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-xs font-bold text-gray-500 italic">
                    Pred:{" "}
                    <span className="text-gray-900 dark:text-white not-italic">
                      {h.pred}
                    </span>
                  </span>
                  <span className="w-px h-3 bg-gray-200 dark:bg-zinc-700" />
                  <span className="text-xs font-bold text-gray-500 italic">
                    Res:{" "}
                    <span className="text-blue-600 not-italic">{h.res}</span>
                  </span>
                </div>
                {h.breakdown && (
                  <span className="text-[8px] font-bold text-gray-400 uppercase mt-1 tracking-wider">
                    {h.breakdown}
                  </span>
                )}
              </>
            ) : (
              <span className="text-xs font-bold text-gray-600 dark:text-zinc-300">
                {h.pred} · {h.res}
              </span>
            )}
          </div>
          <div className="text-right shrink-0 ml-3">
            <div className="font-black text-lg tracking-tighter leading-none">
              {h.total}{" "}
              <span className="text-[10px] text-gray-400">PTS</span>
            </div>
            <span
              className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                h.pts > 0
                  ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                  : "bg-gray-100 text-gray-400 dark:bg-zinc-800"
              }`}
            >
              +{h.pts}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
