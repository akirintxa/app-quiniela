"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

const REFRESH_DEBOUNCE_MS = 60_000;

export default function RealtimeRankingListener() {
  const router = useRouter();
  const supabase = createClient();
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastRefreshRef = useRef(0);

  useEffect(() => {
    const scheduleRefresh = () => {
      if (typeof document !== "undefined" && document.hidden) {
        return;
      }

      const now = Date.now();
      const elapsed = now - lastRefreshRef.current;

      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
        refreshTimerRef.current = null;
      }

      if (elapsed >= REFRESH_DEBOUNCE_MS) {
        lastRefreshRef.current = now;
        router.refresh();
        return;
      }

      refreshTimerRef.current = setTimeout(() => {
        lastRefreshRef.current = Date.now();
        refreshTimerRef.current = null;
        router.refresh();
      }, REFRESH_DEBOUNCE_MS - elapsed);
    };

    const channel = supabase
      .channel("db-realtime-sync")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "predictions" },
        scheduleRefresh
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "matches" },
        scheduleRefresh
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "profiles" },
        scheduleRefresh
      )
      .subscribe();

    return () => {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }
      supabase.removeChannel(channel);
    };
  }, [router, supabase]);

  return null;
}
