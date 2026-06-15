import type { MatchOutcomeSummary } from "@/lib/pool-outcome-summary";

type MatchOutcomeSummaryProps = {
  summary: MatchOutcomeSummary;
};

function shortLabel(name: string, max = 12): string {
  if (name.length <= max) return name;
  return `${name.slice(0, max - 1)}…`;
}

export default function MatchOutcomeSummaryBar({
  summary,
}: MatchOutcomeSummaryProps) {
  const {
    teamALabel,
    teamBLabel,
    teamACount,
    drawCount,
    teamBCount,
    pendingCount,
    memberCount,
    isGroupStage,
  } = summary;

  const voted = teamACount + drawCount + teamBCount;
  const showDraw = isGroupStage || drawCount > 0;
  const totalForBar = Math.max(voted, 1);

  const segments = [
    {
      key: "teamA",
      count: teamACount,
      label: shortLabel(teamALabel),
      className: "bg-blue-500",
    },
    ...(showDraw
      ? [
          {
            key: "draw",
            count: drawCount,
            label: "Empate",
            className: "bg-gray-400 dark:bg-zinc-500",
          },
        ]
      : []),
    {
      key: "teamB",
      count: teamBCount,
      label: shortLabel(teamBLabel),
      className: "bg-red-500",
    },
  ].filter((segment) => segment.count > 0 || voted === 0);

  return (
    <div className="w-full mt-3 sm:mt-4 rounded-xl sm:rounded-2xl border border-gray-100 dark:border-zinc-800 bg-gray-50/80 dark:bg-zinc-950/40 p-2.5 sm:p-4">
      <div className="flex items-center justify-between gap-2 mb-2">
        <p className="text-[7px] sm:text-[8px] font-black uppercase tracking-[0.2em] text-gray-400">
          Apuestas de la liga
        </p>
        <p className="text-[7px] sm:text-[8px] font-bold text-gray-400 tabular-nums">
          {voted}/{memberCount}
        </p>
      </div>

      {voted > 0 ? (
        <>
          <div className="flex h-2 sm:h-2.5 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-zinc-800">
            {segments.map((segment) =>
              segment.count > 0 ? (
                <div
                  key={segment.key}
                  className={`${segment.className} transition-all`}
                  style={{
                    width: `${(segment.count / totalForBar) * 100}%`,
                  }}
                  title={`${segment.label}: ${segment.count}`}
                />
              ) : null
            )}
          </div>

          <div
            className={`mt-2 grid gap-1.5 ${
              showDraw ? "grid-cols-3" : "grid-cols-2"
            }`}
          >
            <div className="text-center min-w-0">
              <p className="text-[13px] sm:text-base font-black text-blue-600 tabular-nums">
                {teamACount}
              </p>
              <p className="text-[6px] sm:text-[7px] font-black uppercase tracking-tight text-gray-400 truncate px-0.5">
                {shortLabel(teamALabel, 10)}
              </p>
            </div>
            {showDraw && (
              <div className="text-center">
                <p className="text-[13px] sm:text-base font-black text-gray-500 tabular-nums">
                  {drawCount}
                </p>
                <p className="text-[6px] sm:text-[7px] font-black uppercase tracking-tight text-gray-400">
                  Empate
                </p>
              </div>
            )}
            <div className="text-center min-w-0">
              <p className="text-[13px] sm:text-base font-black text-red-500 tabular-nums">
                {teamBCount}
              </p>
              <p className="text-[6px] sm:text-[7px] font-black uppercase tracking-tight text-gray-400 truncate px-0.5">
                {shortLabel(teamBLabel, 10)}
              </p>
            </div>
          </div>
        </>
      ) : (
        <p className="text-[8px] sm:text-[9px] font-bold text-gray-400 uppercase tracking-widest text-center py-1">
          Nadie ha pronosticado aún
        </p>
      )}

      {pendingCount > 0 && (
        <p className="mt-2 text-[7px] sm:text-[8px] font-bold text-orange-500 uppercase tracking-widest text-center">
          {pendingCount} sin pronóstico
        </p>
      )}
    </div>
  );
}
