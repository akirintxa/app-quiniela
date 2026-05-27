'use client';

import { useTransition, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  forgotPassword,
  verifyRecoveryOtp,
  resendRecoveryOtp,
} from '../login/actions';
import { maskEmail } from '@/lib/mask-email';
import { normalizeAuthEmail } from '@/lib/normalize-auth-email';
import OtpCodeInput from '@/components/OtpCodeInput';

function ForgotPasswordContent() {
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const status = searchParams.get('status');
  const emailParam = normalizeAuthEmail(searchParams.get('email') ?? '');
  const errorMessage = searchParams.get('error');
  const infoMessage = searchParams.get('message');
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
      <div className="bg-white dark:bg-zinc-900 py-10 px-8 shadow-2xl shadow-gray-200/50 dark:shadow-none rounded-[3rem] border border-gray-100 dark:border-zinc-800">
        <div className="text-center mb-6">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-600 mb-3">
            Código enviado
          </p>
          <p className="text-sm font-medium text-gray-600 dark:text-zinc-400 leading-relaxed">
            Si existe una cuenta con{' '}
            <span className="font-mono text-gray-900 dark:text-white">
              {masked}
            </span>
            , recibirás un código de <strong>6 dígitos</strong>.
          </p>
          <p className="mt-3 text-[9px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-widest">
            Pégalo aquí — puedes leer el correo en otro dispositivo
          </p>
        </div>

        <form className="space-y-6">
          <input type="hidden" name="email" value={emailParam} />

          {errorMessage && (
            <div className="p-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-center border bg-red-50 dark:bg-red-950/20 border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-400">
              {errorMessage}
            </div>
          )}

          {infoMessage && (
            <div className="p-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-center border bg-green-50 dark:bg-green-950/20 border-green-100 dark:border-green-900/30 text-green-600 dark:text-green-400">
              {infoMessage}
            </div>
          )}

          <div>
            <label
              className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 text-center"
              htmlFor="token"
            >
              Código de recuperación
            </label>
            <OtpCodeInput autoFocus />
          </div>

          <button
            formAction={handleFormAction(verifyRecoveryOtp)}
            disabled={isPending}
            className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 active:scale-95 disabled:opacity-50"
          >
            {isPending ? 'Verificando...' : 'Continuar'}
          </button>

          <button
            type="submit"
            formAction={handleFormAction(resendRecoveryOtp)}
            disabled={isPending}
            className="w-full py-3 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-blue-600 transition-colors disabled:opacity-50"
          >
            Reenviar código
          </button>
        </form>

        <p className="mt-6 text-center">
          <Link
            href="/login"
            className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-blue-600"
          >
            Volver al login
          </Link>
        </p>
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
            {isPending ? 'Enviando...' : 'Enviar código'}
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
          Te enviaremos un código de 6 dígitos
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
