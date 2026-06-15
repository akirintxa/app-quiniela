"use client";

import { useMemo, useState, type ReactNode } from "react";
import {
  buildPoolEffectivenessTable,
  buildPoolPointsTimeline,
  buildPoolRankTimeline,
  buildMemberStyleMap,
  chartLineStyle,
  selectChartMemberIds,
  type PoolMemberEffectiveness,
  type MemberChartStyle,
  type PoolRankTimelineStep,
  type PoolTimelineStep,
} from "@/lib/pool-analytics";
import type { Match, Prediction } from "@/types";

type Member = { id: string; nickname: string };

type PoolAnalyticsPanelProps = {
  members: Member[];
  predictions: Prediction[];
  finishedMatches: Match[];
  currentUserId: string;
};

function ChevronIcon({ open }: { open: boolean }) {
  return (
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
      className={`shrink-0 text-gray-400 transition-transform duration-200 ${
        open ? "rotate-90" : ""
      }`}
      aria-hidden
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

function CollapsibleSection({
  title,
  subtitle,
  defaultOpen = false,
  headerAction,
  children,
}: {
  title: string;
  subtitle?: string;
  defaultOpen?: boolean;
  headerAction?: ReactNode;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] shadow-xl border border-gray-100 dark:border-zinc-800 overflow-hidden">
      <div className="flex items-stretch gap-2 p-4 sm:p-6 border-b border-transparent">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="flex flex-1 items-start gap-3 min-w-0 text-left rounded-2xl hover:bg-gray-50/80 dark:hover:bg-zinc-800/40 px-2 py-1 -mx-2 transition-colors"
        >
          <ChevronIcon open={open} />
          <div className="min-w-0 flex-1">
            <h3 className="text-xs font-black uppercase tracking-[0.25em] text-gray-900 dark:text-white">
              {title}
            </h3>
            {subtitle ? (
              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1">
                {subtitle}
              </p>
            ) : null}
          </div>
        </button>
        {headerAction ? (
          <div
            className="shrink-0 self-center"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            {headerAction}
          </div>
        ) : null}
      </div>
      {open ? <div className="px-6 sm:px-8 pb-6 sm:pb-8 pt-0">{children}</div> : null}
    </div>
  );
}

function finalTotalsFromTimeline(steps: PoolTimelineStep[]): Record<string, number> {
  const last = steps[steps.length - 1];
  return last?.cumulativeByUser ?? {};
}

function PointsLineChart({
  steps,
  visibleIds,
  members,
  currentUserId,
  styleMap,
}: {
  steps: PoolTimelineStep[];
  visibleIds: string[];
  members: Member[];
  currentUserId: string;
  styleMap: Map<string, MemberChartStyle>;
}) {
  const nicknameById = useMemo(
    () => new Map(members.map((m) => [m.id, m.nickname])),
    [members]
  );

  const width = 640;
  const height = 260;
  const padL = 44;
  const padR = 12;
  const padT = 40;
  const padB = 36;
  const innerW = width - padL - padR;
  const innerH = height - padT - padB;

  const maxY = useMemo(() => {
    let max = 1;
    for (const step of steps) {
      for (const id of visibleIds) {
        max = Math.max(max, step.cumulativeByUser[id] ?? 0);
      }
    }
    return max;
  }, [steps, visibleIds]);

  const xAt = (i: number) =>
    padL + (steps.length <= 1 ? 0 : (i / (steps.length - 1)) * innerW);
  const yAt = (v: number) => padT + innerH - (v / maxY) * innerH;

  return (
    <div className="w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full min-w-[320px] max-h-[300px]"
        role="img"
        aria-label="Evolución de puntos en la liga"
      >
        {[0, 0.25, 0.5, 0.75, 1].map((t) => {
          const y = padT + innerH * (1 - t);
          const val = Math.round(maxY * t);
          return (
            <g key={t}>
              <line
                x1={padL}
                y1={y}
                x2={width - padR}
                y2={y}
                className="stroke-gray-100 dark:stroke-zinc-800"
                strokeWidth={1}
              />
              <text
                x={padL - 6}
                y={y + 4}
                textAnchor="end"
                className="fill-gray-400 text-[9px] font-bold"
              >
                {val}
              </text>
            </g>
          );
        })}

        {visibleIds.map((userId) => {
          const isMe = userId === currentUserId;
          const line = chartLineStyle(userId, currentUserId, styleMap);
          const points = steps.map((s) => s.cumulativeByUser[userId] ?? 0);
          const d = points
            .map((v, i) => `${i === 0 ? "M" : "L"} ${xAt(i)} ${yAt(v)}`)
            .join(" ");

          return (
            <path
              key={userId}
              d={d}
              fill="none"
              stroke={line.color}
              strokeWidth={isMe ? 3.5 : 2.25}
              strokeDasharray={line.strokeDasharray}
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={isMe ? 1 : 0.92}
            />
          );
        })}

        {steps.map((step, i) =>
          i === 0 || i % Math.ceil(steps.length / 8) === 0 || i === steps.length - 1 ? (
            <text
              key={step.matchId}
              x={xAt(i)}
              y={height - 8}
              textAnchor="middle"
              className="fill-gray-400 text-[7px] font-bold uppercase"
            >
              {step.label.length > 8 ? step.label.slice(0, 7) + "…" : step.label}
            </text>
          ) : null
        )}
      </svg>

      <ul className="flex flex-wrap gap-x-4 gap-y-2 mt-3">
        {visibleIds.map((userId) => {
          const isMe = userId === currentUserId;
          const line = chartLineStyle(userId, currentUserId, styleMap);
          const total = steps[steps.length - 1]?.cumulativeByUser[userId] ?? 0;
          return (
            <li key={userId} className="flex items-center gap-2 text-[10px] font-bold uppercase">
              <span
                className="w-3.5 h-3.5 rounded-full shrink-0 ring-1 ring-black/10 dark:ring-white/20"
                style={{ backgroundColor: line.color }}
              />
              <span className={isMe ? "text-gray-900 dark:text-white font-black" : "text-gray-600 dark:text-zinc-300"}>
                {nicknameById.get(userId) ?? "Usuario"}
                {isMe ? " (tú)" : ""} · {total}G
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}



function RankPositionLineChart({
  steps,
  visibleIds,
  members,
  currentUserId,
  memberCount,
  styleMap,
}: {
  steps: PoolRankTimelineStep[];
  visibleIds: string[];
  members: Member[];
  currentUserId: string;
  memberCount: number;
  styleMap: Map<string, MemberChartStyle>;
}) {
  const nicknameById = useMemo(
    () => new Map(members.map((m) => [m.id, m.nickname])),
    [members]
  );

  const width = 640;
  const height = 260;
  const padL = 44;
  const padR = 12;
  const padT = 40;
  const padB = 36;
  const innerW = width - padL - padR;
  const innerH = height - padT - padB;
  const maxRank = Math.max(memberCount, 2);

  const yTicks = useMemo(() => {
    if (memberCount <= 8) {
      return Array.from({ length: memberCount }, (_, i) => i + 1);
    }
    return [1, Math.ceil(memberCount / 2), memberCount];
  }, [memberCount]);

  const xAt = (i: number) =>
    padL + (steps.length <= 1 ? 0 : (i / (steps.length - 1)) * innerW);
  const yAt = (rank: number) =>
    padT + ((rank - 1) / (maxRank - 1)) * innerH;

  return (
    <div className="w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full min-w-[320px] max-h-[300px]"
        role="img"
        aria-label="Evolución de posición en la liga"
      >
        {yTicks.map((rank) => {
          const y = yAt(rank);
          return (
            <g key={rank}>
              <line
                x1={padL}
                y1={y}
                x2={width - padR}
                y2={y}
                className="stroke-gray-100 dark:stroke-zinc-800"
                strokeWidth={1}
              />
              <text
                x={padL - 6}
                y={y + 4}
                textAnchor="end"
                className="fill-gray-400 text-[9px] font-bold"
              >
                {rank}º
              </text>
            </g>
          );
        })}

        {visibleIds.map((userId) => {
          const isMe = userId === currentUserId;
          const line = chartLineStyle(userId, currentUserId, styleMap);
          const ranks = steps.map((s) => s.rankByUser[userId] ?? memberCount);
          const d = ranks
            .map((r, i) => `${i === 0 ? "M" : "L"} ${xAt(i)} ${yAt(r)}`)
            .join(" ");

          return (
            <path
              key={userId}
              d={d}
              fill="none"
              stroke={line.color}
              strokeWidth={isMe ? 3.5 : 2.25}
              strokeDasharray={line.strokeDasharray}
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={isMe ? 1 : 0.92}
            />
          );
        })}

        {steps.map((step, i) =>
          i === 0 || i % Math.ceil(steps.length / 8) === 0 || i === steps.length - 1 ? (
            <text
              key={step.matchId}
              x={xAt(i)}
              y={height - 8}
              textAnchor="middle"
              className="fill-gray-400 text-[7px] font-bold uppercase"
            >
              {step.label.length > 8 ? step.label.slice(0, 7) + "…" : step.label}
            </text>
          ) : null
        )}
      </svg>

      <ul className="flex flex-wrap gap-x-4 gap-y-2 mt-3">
        {visibleIds.map((userId) => {
          const isMe = userId === currentUserId;
          const line = chartLineStyle(userId, currentUserId, styleMap);
          const rank = steps[steps.length - 1]?.rankByUser[userId] ?? "—";
          return (
            <li key={userId} className="flex items-center gap-2 text-[10px] font-bold uppercase">
              <span
                className="w-3.5 h-3.5 rounded-full shrink-0 ring-1 ring-black/10 dark:ring-white/20"
                style={{ backgroundColor: line.color }}
              />
              <span className={isMe ? "text-gray-900 dark:text-white font-black" : "text-gray-600 dark:text-zinc-300"}>
                {nicknameById.get(userId) ?? "Usuario"}
                {isMe ? " (tú)" : ""} · {rank}º
              </span>
            </li>
          );
        })}
      </ul>
      <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mt-3">
        1º arriba = mejor posición · empates comparten puesto (1, 1, 3…)
      </p>
    </div>
  );
}

function EffectivenessTable({
  rows,
  members,
  currentUserId,
}: {
  rows: PoolMemberEffectiveness[];
  members: Member[];
  currentUserId: string;
}) {
  const nicknameById = new Map(members.map((m) => [m.id, m.nickname]));
  const sorted = [...rows].sort((a, b) => b.ganadores - a.ganadores || b.plenos - a.plenos);

  return (
    <div className="overflow-x-auto -mx-2 sm:mx-0">
      <table className="w-full text-left text-[10px] font-bold uppercase tracking-wide min-w-[520px]">
        <thead>
          <tr className="text-gray-400 border-b border-gray-100 dark:border-zinc-800">
            <th className="py-3 px-2">Jugador</th>
            <th className="py-3 px-2 text-center">Jugados</th>
            <th className="py-3 px-2 text-center">Plenos</th>
            <th className="py-3 px-2 text-center">Ganadores</th>
            <th className="py-3 px-2 text-center">%</th>
            <th className="py-3 px-2 text-center">Dif.</th>
            <th className="py-3 px-2 text-center">Loc.</th>
            <th className="py-3 px-2 text-center">Vis.</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50 dark:divide-zinc-800">
          {sorted.map((row) => {
            const isMe = row.userId === currentUserId;
            return (
              <tr
                key={row.userId}
                className={isMe ? "bg-blue-50/80 dark:bg-blue-950/20" : undefined}
              >
                <td className="py-3 px-2 truncate max-w-[8rem]">
                  {nicknameById.get(row.userId) ?? "Usuario"}
                  {isMe ? " · tú" : ""}
                </td>
                <td className="py-3 px-2 text-center tabular-nums">{row.played}</td>
                <td className="py-3 px-2 text-center tabular-nums">{row.plenos}</td>
                <td className="py-3 px-2 text-center tabular-nums">{row.ganadores}</td>
                <td className="py-3 px-2 text-center tabular-nums">{row.effectivenessPct}%</td>
                <td className="py-3 px-2 text-center tabular-nums">{row.diferencias}</td>
                <td className="py-3 px-2 text-center tabular-nums">{row.golesLocal}</td>
                <td className="py-3 px-2 text-center tabular-nums">{row.golesVisita}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default function PoolAnalyticsPanel({
  members,
  predictions,
  finishedMatches,
  currentUserId,
}: PoolAnalyticsPanelProps) {
  const memberIds = members.map((m) => m.id);

  const timeline = useMemo(
    () => buildPoolPointsTimeline(finishedMatches, predictions, memberIds),
    [finishedMatches, predictions, memberIds]
  );

  const rankTimeline = useMemo(
    () => buildPoolRankTimeline(timeline, memberIds),
    [timeline, memberIds]
  );

  const matchesById = useMemo(
    () => new Map(finishedMatches.map((m) => [m.id, m])),
    [finishedMatches]
  );

  const effectiveness = useMemo(
    () => buildPoolEffectivenessTable(memberIds, predictions, matchesById),
    [memberIds, predictions, matchesById]
  );

  const styleMap = useMemo(() => buildMemberStyleMap(members), [members]);

  const finalTotals = useMemo(() => finalTotalsFromTimeline(timeline), [timeline]);
  const [showAllLines, setShowAllLines] = useState(false);

  const visibleIds = useMemo(() => {
    if (showAllLines || memberIds.length <= 8) return memberIds;
    return selectChartMemberIds(memberIds, finalTotals, currentUserId, 6);
  }, [showAllLines, memberIds, finalTotals, currentUserId]);

  if (finishedMatches.length === 0) {
    return (
      <div className="rounded-[2rem] border border-dashed border-gray-200 dark:border-zinc-700 p-8 text-center">
        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
          Sin partidos finalizados aún — las estadísticas aparecerán aquí
        </p>
      </div>
    );
  }

  const showAllLinesButton =
    memberIds.length > 8 ? (
      <button
        type="button"
        onClick={() => setShowAllLines((v) => !v)}
        className="text-[9px] font-black uppercase tracking-widest px-4 py-2 rounded-xl border border-gray-200 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-800"
      >
        {showAllLines ? "Top 6 + tú" : `Ver los ${memberIds.length}`}
      </button>
    ) : null;

  return (
    <div className="space-y-4">
      <CollapsibleSection
        title="Evolución de puntos"
        subtitle="Puntos de partido acumulados · sin bono favorito"
        defaultOpen={false}
        headerAction={showAllLinesButton}
      >
        <PointsLineChart
          steps={timeline}
          visibleIds={visibleIds}
          members={members}
          currentUserId={currentUserId}
          styleMap={styleMap}
        />
      </CollapsibleSection>

      <CollapsibleSection
        title="Evolución de posición"
        subtitle="Tras cada partido finalizado · según puntos de partido (sin bono favorito)"
        defaultOpen={false}
        headerAction={showAllLinesButton}
      >
        <RankPositionLineChart
          steps={rankTimeline}
          visibleIds={visibleIds}
          members={members}
          currentUserId={currentUserId}
          memberCount={memberIds.length}
          styleMap={styleMap}
        />
      </CollapsibleSection>

      <CollapsibleSection
        title="Efectividad en la liga"
        subtitle="Plenos, ganadores (1X2), diferencia, goles local y visita"
        defaultOpen={false}
      >
        <EffectivenessTable
          rows={effectiveness}
          members={members}
          currentUserId={currentUserId}
        />
      </CollapsibleSection>
    </div>
  );
}
