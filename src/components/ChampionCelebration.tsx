"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const STORAGE_PREFIX = "q26_champion_celebration_";

type ChampionCelebrationProps = {
  userId: string;
  teamName: string;
  flagUrl: string | null;
};

function runConfetti(canvas: HTMLCanvasElement, durationMs: number) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return () => {};

  const resize = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  };
  resize();
  window.addEventListener("resize", resize);

  const colors = ["#2563eb", "#f59e0b", "#22c55e", "#ef4444", "#a855f7", "#eab308"];
  const particles = Array.from({ length: 120 }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height - canvas.height,
    w: 6 + Math.random() * 6,
    h: 4 + Math.random() * 4,
    color: colors[Math.floor(Math.random() * colors.length)]!,
    vy: 2 + Math.random() * 4,
    vx: -2 + Math.random() * 4,
    rot: Math.random() * Math.PI,
    vr: -0.15 + Math.random() * 0.3,
  }));

  const start = performance.now();
  let raf = 0;

  const tick = (now: number) => {
    const elapsed = now - start;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const p of particles) {
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vr;
      if (p.y > canvas.height + 20) {
        p.y = -20;
        p.x = Math.random() * canvas.width;
      }
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    }
    if (elapsed < durationMs) {
      raf = requestAnimationFrame(tick);
    }
  };

  raf = requestAnimationFrame(tick);

  return () => {
    cancelAnimationFrame(raf);
    window.removeEventListener("resize", resize);
  };
}

export default function ChampionCelebration({
  userId,
  teamName,
  flagUrl,
}: ChampionCelebrationProps) {
  const storageKey = `${STORAGE_PREFIX}${userId}`;
  const [open, setOpen] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    try {
      if (localStorage.getItem(storageKey) === "1") return;
    } catch {
      return;
    }
    setOpen(true);
  }, [storageKey]);

  useEffect(() => {
    if (!open || !canvasRef.current) return;
    return runConfetti(canvasRef.current, 4500);
  }, [open]);

  const dismiss = useCallback(() => {
    try {
      localStorage.setItem(storageKey, "1");
    } catch {
      /* ignore */
    }
    setOpen(false);
  }, [storageKey]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="champion-celebration-title"
    >
      <canvas
        ref={canvasRef}
        className="pointer-events-none absolute inset-0 h-full w-full"
        aria-hidden
      />
      <button
        type="button"
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        aria-label="Cerrar"
        onClick={dismiss}
      />
      <div className="relative z-10 w-full max-w-md animate-in fade-in zoom-in duration-500">
        <div className="overflow-hidden rounded-[2.5rem] border border-amber-200/80 bg-white shadow-2xl dark:border-amber-900/50 dark:bg-zinc-900">
          <div className="bg-gradient-to-br from-amber-400 via-orange-500 to-blue-600 px-6 py-8 text-center text-white">
            <p className="text-[10px] font-black uppercase tracking-[0.35em] text-white/90">
              Mundial 2026
            </p>
            <p className="mt-3 text-4xl" aria-hidden>
              🏆
            </p>
            <h2
              id="champion-celebration-title"
              className="mt-4 text-xl font-black uppercase tracking-tight sm:text-2xl"
            >
              ¡Tu favorito es campeón!
            </h2>
          </div>
          <div className="flex flex-col items-center px-6 py-8 text-center">
            {flagUrl ? (
              <div className="mb-4 h-20 w-20 overflow-hidden rounded-2xl border-2 border-gray-100 shadow-lg dark:border-zinc-700">
                <img
                  src={flagUrl}
                  alt=""
                  className="h-full w-full object-cover"
                />
              </div>
            ) : null}
            <p className="text-lg font-black uppercase tracking-tight text-gray-900 dark:text-white">
              {teamName}
            </p>
            <p className="mt-3 text-sm font-medium leading-relaxed text-gray-500 dark:text-zinc-400">
              Ganó el Mundial y sumaste{" "}
              <span className="font-black text-amber-600 dark:text-amber-400">
                +15 pts
              </span>{" "}
              de bono favorito.
            </p>
            <button
              type="button"
              onClick={dismiss}
              className="mt-8 w-full rounded-2xl bg-blue-600 px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-white shadow-lg shadow-blue-500/30 transition-transform hover:scale-[1.02] active:scale-95"
            >
              ¡Qué grande!
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
