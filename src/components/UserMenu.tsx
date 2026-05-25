'use client';

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { fetchProfileFields, getFavoriteTeamFlagUrl } from "@/lib/profile";

type UserMenuProps = {
  userId: string;
  email?: string | null;
  initialNickname?: string | null;
  initialFlagUrl?: string | null;
};

export default function UserMenu({
  userId,
  email,
  initialNickname,
  initialFlagUrl,
}: UserMenuProps) {
  const [displayName, setDisplayName] = useState(
    initialNickname || email?.split("@")[0] || "Usuario"
  );
  const [flagUrl, setFlagUrl] = useState<string | null>(initialFlagUrl ?? null);

  const loadProfile = useCallback(async () => {
    try {
      const supabase = createClient();
      const fields = await fetchProfileFields(supabase, userId);
      if (!fields) return;
      if (fields.nickname) setDisplayName(fields.nickname);
      setFlagUrl(getFavoriteTeamFlagUrl(fields.favoriteTeam, 40));
    } catch (err) {
      console.error("UserMenu profile load:", err);
    }
  }, [userId]);

  useEffect(() => {
    const onProfileUpdated = () => {
      void loadProfile();
    };
    window.addEventListener("profile-updated", onProfileUpdated);
    return () => window.removeEventListener("profile-updated", onProfileUpdated);
  }, [loadProfile]);

  return (
    <div className="flex items-center gap-2 sm:gap-4">
      <Link
        href="/profile"
        className="flex items-center gap-3 bg-gray-50 dark:bg-zinc-900 p-1 rounded-full border border-gray-100 dark:border-zinc-800 shadow-sm pl-4 pr-2 hover:border-blue-500 transition-all group"
      >
        <span className="text-[10px] font-black text-gray-900 dark:text-zinc-100 uppercase tracking-tighter group-hover:text-blue-600">
          {displayName}
        </span>
        <div className="w-8 h-6 rounded-md overflow-hidden border border-gray-200 dark:border-zinc-700 bg-gray-100 dark:bg-zinc-800 flex items-center justify-center shrink-0">
          {flagUrl ? (
            <img src={flagUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="text-[9px] font-black text-gray-400 uppercase">
              {displayName.substring(0, 1)}
            </span>
          )}
        </div>
      </Link>
      <form action="/auth/signout" method="post">
        <button
          type="submit"
          title="Cerrar Sesión"
          className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-full transition-all"
        >
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
          >
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
        </button>
      </form>
    </div>
  );
}
