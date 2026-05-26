"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

export default function AdminRefreshButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(() => router.refresh())}
      className="text-xs font-black bg-white dark:bg-zinc-900 px-6 py-3 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm uppercase tracking-widest text-gray-600 dark:text-zinc-300 hover:border-blue-200 dark:hover:border-zinc-600 disabled:opacity-50"
    >
      Refrescar
    </button>
  );
}
