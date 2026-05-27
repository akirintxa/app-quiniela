import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import {
  findPoolByInviteCode,
  joinPoolByInviteCode,
  joinResultRedirectPath,
  normalizeInviteCode,
  setPendingPoolInviteCookie,
} from "@/lib/pool-invite";

export default async function JoinPoolPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code: rawCode } = await params;
  const code = normalizeInviteCode(rawCode);

  const supabase = await createClient();
  const pool = await findPoolByInviteCode(supabase, code);

  if (!pool) {
    return (
      <div className="min-h-[calc(100vh-80px)] flex flex-col items-center justify-center px-6 font-sans">
        <div className="max-w-md w-full text-center bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-gray-100 dark:border-zinc-800 p-10 shadow-xl">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-red-500 mb-4">
            Invitación no válida
          </p>
          <h1 className="text-2xl font-black uppercase tracking-tight text-gray-900 dark:text-white mb-4">
            Liga no encontrada
          </h1>
          <p className="text-sm font-medium text-gray-500 dark:text-zinc-400 mb-8">
            El código <span className="font-mono font-bold">{code}</span> no
            corresponde a ninguna liga activa.
          </p>
          <Link
            href="/"
            className="inline-block bg-blue-600 text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest"
          >
            Ir al inicio
          </Link>
        </div>
      </div>
    );
  }

  await setPendingPoolInviteCookie(code);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const result = await joinPoolByInviteCode(supabase, user.id, code);
    revalidatePath("/groups");
    revalidatePath(`/groups/${pool.id}`);
    redirect(joinResultRedirectPath(result));
  }

  return (
    <div className="min-h-[calc(100vh-80px)] flex flex-col items-center justify-center px-6 py-12 font-sans">
      <div className="max-w-lg w-full bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-gray-100 dark:border-zinc-800 p-8 sm:p-12 shadow-2xl text-center">
        <span className="inline-block bg-blue-600 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest mb-6">
          Invitación a liga
        </span>
        <h1 className="text-3xl font-black uppercase tracking-tighter text-gray-900 dark:text-white leading-tight mb-3">
          {pool.name}
        </h1>
        <p className="text-sm font-medium text-gray-500 dark:text-zinc-400 mb-2">
          Te han invitado a jugar la quiniela del Mundial 2026.
        </p>
        <p className="text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-widest mb-10">
          Código: <span className="text-blue-600">{pool.invite_code}</span>
        </p>

        <div className="flex flex-col gap-3">
          <Link
            href="/login?mode=signup"
            className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/20"
          >
            Crear cuenta
          </Link>
          <Link
            href="/login?mode=login"
            className="w-full bg-zinc-900 dark:bg-white text-white dark:text-black py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:opacity-90 transition-opacity"
          >
            Ya tengo cuenta
          </Link>
        </div>

        <p className="mt-8 text-[9px] font-medium text-gray-400 dark:text-zinc-500 leading-relaxed">
          Si confirmas tu email al registrarte, entrarás automáticamente a esta
          liga al activar tu cuenta.
        </p>
      </div>
    </div>
  );
}
