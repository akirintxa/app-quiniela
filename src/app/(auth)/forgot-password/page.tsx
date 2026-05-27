'use client';

import { useTransition, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { forgotPassword } from '../login/actions';
import { maskEmail } from '@/lib/mask-email';
import { normalizeAuthEmail } from '@/lib/normalize-auth-email';

function ForgotPasswordContent() {
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const status = searchParams.get('status');
  const emailParam = normalizeAuthEmail(searchParams.get('email') ?? '');
  const errorMessage = searchParams.get('error');
  const isSent = status === 'sent' && !!emailParam;

  const handleFormAction = (action: (formData: FormData) => Promise<void>) => {
    return (formData: FormData) => {
      startTransition(async () => {
        await action(formData);
      });
    };
  };

  if (isSent) {
    const masked = maskEmail(emailParam);
    return (
      <div className="bg-white dark:bg-zinc-900 py-10 px-8 shadow-2xl shadow-gray-200/50 dark:shadow-none rounded-[3rem] border border-gray-100 dark:border-zinc-800 text-center">
        <div className="w-14 h-14 mx-auto mb-6 rounded-2xl bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center text-blue-600">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect width="20" height="16" x="2" y="4" rx="2" />
            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
          </svg>
        </div>
        <p className="text-[10px] font-black uppercase tracking-widest text-blue-600 mb-4">
          Revisa tu correo
        </p>
        <p className="text-sm font-medium text-gray-600 dark:text-zinc-400 leading-relaxed mb-2">
          Si existe una cuenta con{' '}
          <span className="font-mono text-gray-900 dark:text-white">{masked}</span>,
          recibirás un enlace para restablecer la contraseña.
        </p>
        <p className="text-[10px] font-medium text-gray-400 dark:text-zinc-500 mb-8">
          Haz clic en el enlace del correo (puedes abrirlo en el móvil).
        </p>
        <Link
          href="/login"
          className="w-full inline-block bg-blue-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20"
        >
          Volver al login
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-zinc-900 py-10 px-8 shadow-2xl shadow-gray-200/50 dark:shadow-none rounded-[3rem] border border-gray-100 dark:border-zinc-800">
      <form className="space-y-6">
        {errorMessage && (
          <div className="p-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-center border bg-red-50 dark:bg-red-950/20 border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-400">
            {errorMessage}
          </div>
        )}

        <div>
          <label
            className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 ml-1"
            htmlFor="email"
          >
            Correo Electrónico
          </label>
          <input
            className="block w-full rounded-2xl px-5 py-4 bg-gray-50 dark:bg-zinc-800 border-none outline-none focus:ring-2 focus:ring-blue-500 font-bold transition-all"
            name="email"
            id="email"
            type="email"
            placeholder="tu@email.com"
            defaultValue={emailParam}
            required
          />
        </div>

        <div className="pt-2">
          <button
            formAction={handleFormAction(forgotPassword)}
            disabled={isPending}
            className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 active:scale-95 disabled:opacity-50"
          >
            {isPending ? 'Enviando...' : 'Enviar enlace'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black flex flex-col justify-center py-12 px-6 lg:px-8 font-sans">
      <Link
        href="/login"
        className="absolute left-8 top-8 py-2 px-4 rounded-2xl no-underline text-gray-500 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 flex items-center group text-xs font-black uppercase tracking-widest hover:border-blue-500 transition-all shadow-sm"
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
          className="mr-2 transition-transform group-hover:-translate-x-1"
        >
          <polyline points="15 18 9 12 15 6" />
        </svg>
        Volver
      </Link>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-600 rounded-[2rem] shadow-xl shadow-blue-500/20 mb-6 transform -rotate-6 transition-transform hover:rotate-0">
          <span className="text-3xl font-black text-white tracking-tighter">
            Q26
          </span>
        </div>
        <h2 className="text-4xl font-black text-gray-900 dark:text-white uppercase tracking-tighter leading-tight">
          RECUPERAR <span className="text-blue-600">ACCESO</span>
        </h2>
        <p className="mt-2 text-xs font-black text-gray-400 dark:text-zinc-500 uppercase tracking-[0.3em]">
          Te enviaremos un enlace por correo
        </p>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-md">
        <Suspense
          fallback={
            <div className="p-12 text-center opacity-50 font-black text-[10px] uppercase tracking-widest">
              Cargando...
            </div>
          }
        >
          <ForgotPasswordContent />
        </Suspense>
      </div>
    </div>
  );
}
