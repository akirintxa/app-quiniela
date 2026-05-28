"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ProfileMissingField } from "@/lib/profile";

const HIDDEN_PREFIXES = [
  "/profile",
  "/login",
  "/forgot-password",
  "/update-password",
  "/auth/",
  "/join/",
];

type ProfileSetupBannerProps = {
  missing: ProfileMissingField[];
};

function missingMessage(missing: ProfileMissingField[]): string {
  const needsNickname = missing.includes("nickname");
  const needsTeam = missing.includes("favorite_team");
  if (needsNickname && needsTeam) {
    return "Añade tu apodo y tu equipo favorito para que te reconozcan en las ligas y en el ranking.";
  }
  if (needsNickname) {
    return "Añade tu apodo para que te reconozcan en las ligas y en el ranking.";
  }
  return "Elige tu equipo favorito para los puntos extra y tu bandera en el ranking.";
}

export default function ProfileSetupBanner({ missing }: ProfileSetupBannerProps) {
  const pathname = usePathname();

  if (missing.length === 0) return null;
  if (HIDDEN_PREFIXES.some((p) => pathname.startsWith(p))) return null;

  return (
    <div className="bg-red-50 dark:bg-red-950/40 border-b border-red-200 dark:border-red-900/50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <p className="text-sm font-medium text-red-900 dark:text-red-200 leading-snug">
          <span className="font-black uppercase tracking-widest text-[10px] block sm:inline sm:mr-2 mb-1 sm:mb-0">
            Completa tu perfil
          </span>
          {missingMessage(missing)}
        </p>
        <Link
          href="/profile"
          className="shrink-0 text-center bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors"
        >
          Ir a mi perfil
        </Link>
      </div>
    </div>
  );
}
