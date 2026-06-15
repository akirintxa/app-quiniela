"use client";

import { useState } from "react";
import {
  formatStandingsShareText,
  whatsAppShareUrl,
  type StandingsShareRow,
} from "@/lib/share-standings";

type ShareStandingsButtonProps = {
  title: string;
  rows: StandingsShareRow[];
  pageUrl?: string;
  className?: string;
  compact?: boolean;
};

export default function ShareStandingsButton({
  title,
  rows,
  pageUrl,
  className = "",
  compact = false,
}: ShareStandingsButtonProps) {
  const [status, setStatus] = useState<"idle" | "copied" | "error">("idle");

  const buildText = () => {
    const url =
      pageUrl ??
      (typeof window !== "undefined" ? window.location.href : "");
    return formatStandingsShareText(title, rows, url);
  };

  const handleShare = async () => {
    if (rows.length === 0) return;

    const text = buildText();
    const shareTitle = `${title} — Ranking Q26`;

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: shareTitle, text });
        return;
      } catch (err) {
        if ((err as Error)?.name === "AbortError") return;
      }
    }

    try {
      await navigator.clipboard.writeText(text);
      setStatus("copied");
      setTimeout(() => setStatus("idle"), 2000);
    } catch {
      window.open(whatsAppShareUrl(text), "_blank", "noopener,noreferrer");
      setStatus("idle");
    }
  };

  const disabled = rows.length === 0;
  const label =
    status === "copied"
      ? "¡Copiado!"
      : compact
        ? "Compartir"
        : "Compartir tabla";

  return (
    <button
      type="button"
      onClick={handleShare}
      disabled={disabled}
      title={
        disabled
          ? "No hay jugadores en el ranking"
          : "Compartir tabla por WhatsApp o copiar texto"
      }
      className={`flex items-center gap-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed ${
        status === "copied"
          ? "bg-green-500 text-white shadow-green-500/20"
          : "bg-white dark:bg-zinc-900 text-gray-500 hover:text-green-600 border border-gray-100 dark:border-zinc-800"
      } ${compact ? "px-3 py-1.5" : "px-4 py-2"} ${className}`}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={compact ? 12 : 14}
        height={compact ? 12 : 14}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
        <polyline points="16 6 12 2 8 6" />
        <line x1="12" y1="2" x2="12" y2="15" />
      </svg>
      {label}
    </button>
  );
}
