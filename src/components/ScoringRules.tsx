"use client";

import { FAVORITE_BONUS_RULES } from "@/lib/favorite-bonus";
import {
  KNOCKOUT_QUALIFIER_RULE,
  MAX_POINTS_KNOCKOUT_MATCH,
  MAX_POINTS_PER_MATCH,
  SCORING_RULES,
} from "@/lib/points";

export default function ScoringRules({
  compact,
  embedded,
}: {
  compact?: boolean;
  embedded?: boolean;
}) {
  if (compact) {
    return (
      <p className="text-[9px] font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-widest leading-relaxed">
        Grupos: hasta{" "}
        <span className="text-blue-600">+{MAX_POINTS_PER_MATCH}</span> (+2 ganador
        · +1 dif · +1A · +1B). Eliminatorias: hasta{" "}
        <span className="text-blue-600">+{MAX_POINTS_KNOCKOUT_MATCH}</span> (+2
        clasificado si aciertas quién pasa)
      </p>
    );
  }

  return (
    <div
      className={`rounded-[2rem] border border-blue-100 dark:border-blue-900/40 bg-blue-50/60 dark:bg-blue-950/20 p-5 sm:p-6 ${embedded ? "border-0 bg-transparent p-0" : "mb-8"}`}
    >
      {!embedded && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
          <h2 className="text-[10px] font-black uppercase tracking-[0.25em] text-blue-800 dark:text-blue-300">
            Sistema de puntos
          </h2>
          <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">
            Grupos +{MAX_POINTS_PER_MATCH} · KO +{MAX_POINTS_KNOCKOUT_MATCH}
          </span>
        </div>
      )}
      {embedded && (
        <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-4">
          Grupos +{MAX_POINTS_PER_MATCH} / partido · Eliminatorias +{MAX_POINTS_KNOCKOUT_MATCH}{" "}
          / partido
        </p>
      )}
      <p className="text-[9px] font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-widest mb-3">
        Por partido (grupos y eliminatorias)
      </p>
      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {SCORING_RULES.map((rule) => (
          <li
            key={rule.label}
            className="flex items-start gap-3 bg-white/80 dark:bg-zinc-900/60 rounded-2xl px-4 py-3 border border-blue-100/80 dark:border-zinc-800"
          >
            <span className="text-lg font-black text-blue-600 leading-none shrink-0">
              +{rule.points}
            </span>
            <div>
              <p className="text-[10px] font-black uppercase tracking-tight text-gray-900 dark:text-white">
                {rule.label}
              </p>
              <p className="text-[9px] font-bold text-gray-500 dark:text-zinc-400 mt-0.5 leading-snug">
                {rule.detail}
              </p>
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-5 text-[9px] font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-widest mb-3">
        Solo eliminatorias (16vos en adelante)
      </p>
      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <li className="flex items-start gap-3 bg-indigo-50/80 dark:bg-indigo-950/20 rounded-2xl px-4 py-3 border border-indigo-100/80 dark:border-indigo-900/40">
          <span className="text-lg font-black text-indigo-600 leading-none shrink-0">
            +{KNOCKOUT_QUALIFIER_RULE.points}
          </span>
          <div>
            <p className="text-[10px] font-black uppercase tracking-tight text-gray-900 dark:text-white">
              {KNOCKOUT_QUALIFIER_RULE.label}
            </p>
            <p className="text-[9px] font-bold text-gray-500 dark:text-zinc-400 mt-0.5 leading-snug">
              {KNOCKOUT_QUALIFIER_RULE.detail}
            </p>
          </div>
        </li>
      </ul>
      <p className="mt-4 text-[8px] font-bold text-gray-500 dark:text-zinc-500 uppercase tracking-widest leading-relaxed">
        En eliminatorias, el marcador 90&apos; (+ prórroga si aplica) puntúa como en
        grupos (empate 1-1 = +2 de resultado aunque falle el equipo de penales). El
        +2 clasificado es aparte: aciertas quién pasa de ronda, aunque no aciertes el
        marcador.
      </p>
      <p className="mt-5 text-[9px] font-black uppercase tracking-[0.2em] text-orange-700 dark:text-orange-400">
        Bono equipo favorito
      </p>
      <ul className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
        {FAVORITE_BONUS_RULES.map((rule) => (
          <li
            key={rule.key}
            className="flex items-start gap-3 bg-orange-50/80 dark:bg-orange-950/20 rounded-2xl px-4 py-3 border border-orange-100/80 dark:border-orange-900/40"
          >
            <span className="text-lg font-black text-orange-600 leading-none shrink-0">
              +{rule.points}
            </span>
            <div>
              <p className="text-[10px] font-black uppercase tracking-tight text-gray-900 dark:text-white">
                {rule.label}
              </p>
              <p className="text-[9px] font-bold text-gray-500 dark:text-zinc-400 mt-0.5 leading-snug">
                {rule.detail}
              </p>
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-[8px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-widest leading-relaxed">
        Pleno por partido en grupos = +5. En eliminatorias, pleno de marcador + acierto
        de clasificado = +7. Los bonos de favorito se suman al ranking cuando tu equipo
        avanza o es campeón (resultado real).
      </p>
    </div>
  );
}
