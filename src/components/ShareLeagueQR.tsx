"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { getJoinUrl } from "@/lib/join-url";

export default function ShareLeagueQR({
  inviteCode,
  poolName,
}: {
  inviteCode: string;
  poolName: string;
}) {
  const [open, setOpen] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const joinUrl = getJoinUrl(inviteCode);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    QRCode.toDataURL(joinUrl, {
      width: 240,
      margin: 2,
      color: { dark: "#000000", light: "#ffffff" },
    }).then((url) => {
      if (!cancelled) setQrDataUrl(url);
    });
    return () => {
      cancelled = true;
    };
  }, [open, joinUrl]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(joinUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy link", err);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2 rounded-full border bg-white dark:bg-zinc-900 border-gray-100 dark:border-zinc-800 text-gray-400 hover:border-blue-500 hover:text-blue-600 transition-all active:scale-95"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect width="5" height="5" x="3" y="3" rx="1" />
          <rect width="5" height="5" x="16" y="3" rx="1" />
          <rect width="5" height="5" x="3" y="16" rx="1" />
          <path d="M21 16h-3a2 2 0 0 0-2 2v3" />
          <path d="M21 21v.01" />
          <path d="M12 7v3a2 2 0 0 1-2 2H7" />
          <path d="M3 12h.01" />
          <path d="M12 3h.01" />
          <path d="M12 16v.01" />
          <path d="M16 12h1" />
          <path d="M21 12v.01" />
          <path d="M12 21v-1" />
        </svg>
        <span className="text-[10px] font-black uppercase tracking-widest">
          Compartir
        </span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="share-league-title"
          onClick={() => setOpen(false)}
        >
          <div
            className="relative w-full max-w-sm bg-white dark:bg-zinc-900 rounded-[2rem] border border-gray-100 dark:border-zinc-800 p-8 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300 p-1"
              aria-label="Cerrar"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
            </button>

            <h2
              id="share-league-title"
              className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-600 mb-2"
            >
              Compartir liga
            </h2>
            <p className="text-xl font-black uppercase tracking-tight text-gray-900 dark:text-white mb-3 pr-6 leading-tight">
              {poolName}
            </p>
            <p className="text-sm font-medium text-gray-500 dark:text-zinc-400 mb-6 pr-6">
              Escanea el QR o copia el enlace para invitar jugadores.
            </p>

            <div className="flex justify-center mb-6">
              {qrDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={qrDataUrl}
                  alt="Código QR para unirse a la liga"
                  className="rounded-xl border border-gray-100 dark:border-zinc-800"
                  width={240}
                  height={240}
                />
              ) : (
                <div className="w-[240px] h-[240px] rounded-xl bg-gray-50 dark:bg-zinc-800 animate-pulse" />
              )}
            </div>

            <p className="text-[9px] font-mono text-gray-400 dark:text-zinc-500 break-all text-center mb-4 px-2">
              {joinUrl}
            </p>

            <button
              type="button"
              onClick={handleCopyLink}
              className={`w-full py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                copied
                  ? "bg-green-50 text-green-600 border border-green-200"
                  : "bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-500/20"
              }`}
            >
              {copied ? "Enlace copiado" : "Copiar enlace"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
