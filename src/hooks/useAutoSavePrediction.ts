'use client';

import { useCallback, useEffect, useRef, useState } from "react";

export type AutoSaveStatus = "idle" | "pending" | "saving" | "saved" | "error";

const DEFAULT_DEBOUNCE_MS = 600;
const SAVED_DISPLAY_MS = 2500;

export function useAutoSavePrediction<T>(options: {
  enabled: boolean;
  debounceMs?: number;
  onSave: (payload: T) => Promise<void>;
  serialize: (payload: T) => string;
}) {
  const { enabled, debounceMs = DEFAULT_DEBOUNCE_MS, onSave, serialize } = options;

  const [status, setStatus] = useState<AutoSaveStatus>("idle");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingPayloadRef = useRef<T | null>(null);
  const lastSavedKeyRef = useRef<string | null>(null);
  const savingRef = useRef(false);
  const onSaveRef = useRef(onSave);
  onSaveRef.current = onSave;

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const runSave = useCallback(
    async (payload: T) => {
      const key = serialize(payload);
      if (key === lastSavedKeyRef.current) {
        pendingPayloadRef.current = null;
        setStatus("saved");
        return;
      }

      if (savingRef.current) {
        pendingPayloadRef.current = payload;
        return;
      }

      savingRef.current = true;
      setStatus("saving");
      try {
        await onSaveRef.current(payload);
        lastSavedKeyRef.current = key;
        pendingPayloadRef.current = null;
        setStatus("saved");
      } catch {
        setStatus("error");
      } finally {
        savingRef.current = false;
        const pending = pendingPayloadRef.current;
        if (pending) {
          pendingPayloadRef.current = null;
          void runSave(pending);
        }
      }
    },
    [serialize]
  );

  const scheduleSave = useCallback(
    (payload: T | null) => {
      if (!enabled) {
        clearTimer();
        pendingPayloadRef.current = null;
        return;
      }

      if (payload === null) {
        clearTimer();
        pendingPayloadRef.current = null;
        setStatus((s) => (s === "pending" ? "idle" : s));
        return;
      }

      const key = serialize(payload);
      if (key === lastSavedKeyRef.current) {
        clearTimer();
        pendingPayloadRef.current = null;
        setStatus("saved");
        return;
      }

      pendingPayloadRef.current = payload;
      setStatus("pending");
      clearTimer();
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        const toSave = pendingPayloadRef.current;
        if (toSave) void runSave(toSave);
      }, debounceMs);
    },
    [enabled, debounceMs, clearTimer, runSave, serialize]
  );

  const flush = useCallback(() => {
    clearTimer();
    const toSave = pendingPayloadRef.current;
    if (toSave && enabled) void runSave(toSave);
  }, [clearTimer, enabled, runSave]);

  const retry = useCallback(() => {
    const toSave = pendingPayloadRef.current;
    if (toSave && enabled) void runSave(toSave);
    else if (enabled && status === "error") {
      setStatus("idle");
    }
  }, [enabled, runSave, status]);

  const syncSavedKey = useCallback(
    (payload: T) => {
      lastSavedKeyRef.current = serialize(payload);
      pendingPayloadRef.current = null;
      clearTimer();
    },
    [clearTimer, serialize]
  );

  useEffect(() => {
    return () => {
      clearTimer();
      const toSave = pendingPayloadRef.current;
      if (toSave && enabled) {
        void onSaveRef.current(toSave).catch(() => {});
      }
    };
  }, [clearTimer, enabled]);

  useEffect(() => {
    if (status !== "saved") return;
    const t = setTimeout(
      () => setStatus((s) => (s === "saved" ? "idle" : s)),
      SAVED_DISPLAY_MS
    );
    return () => clearTimeout(t);
  }, [status]);

  return {
    status,
    scheduleSave,
    flush,
    retry,
    syncSavedKey,
    isBusy: status === "pending" || status === "saving",
  };
}
