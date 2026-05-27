'use client';

import { useState, useTransition, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { login, signup, verifySignupOtp, resendSignupOtp } from './actions';
import PasswordInput from '@/components/PasswordInput';
import OtpCodeInput from '@/components/OtpCodeInput';
import { maskEmail } from '@/lib/mask-email';
import { normalizeAuthEmail } from '@/lib/normalize-auth-email';

type AuthMode = 'login' | 'signup';

const ERROR_COPY: Record<string, string> = {
  invalid_credentials: 'Email o contraseña incorrectos.',
  already_registered:
    'Este correo ya está registrado. Entra con tu contraseña o recupera el acceso.',
};

function LoginContent() {
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const initialMode: AuthMode =
    searchParams.get('mode') === 'signup' ? 'signup' : 'login';
  const [mode, setMode] = useState<AuthMode>(initialMode);

  const errorCode = searchParams.get('error');
  const status = searchParams.get('status');
  const legacyMessage = searchParams.get('message');
  const prefilledEmail = normalizeAuthEmail(searchParams.get('email') ?? '');

  const awaitingOtp = status === 'awaiting_otp' && !!prefilledEmail;

  useEffect(() => {
    if (!awaitingOtp) {
      setMode(searchParams.get('mode') === 'signup' ? 'signup' : 'login');
    }
  }, [searchParams, awaitingOtp]);

  const isLegacySuccess =
    !!legacyMessage &&
    (legacyMessage.includes('Registro') ||
      legacyMessage.includes('completado') ||
      legacyMessage.toLowerCase().includes('revisa tu email'));

  const errorText =
    (errorCode && ERROR_COPY[errorCode]) ||
    (legacyMessage && !isLegacySuccess && status !== 'awaiting_otp'
      ? legacyMessage
      : null);

  const otpMessage =
    awaitingOtp && legacyMessage ? legacyMessage : null;

  const successText =
    status === 'confirm_email'
      ? 'Registro casi listo. Revisa tu email para activar tu cuenta.'
      : isLegacySuccess && !awaitingOtp
        ? legacyMessage
        : null;

  const showSignupAfterFailedLogin =
    mode === 'login' && errorCode === 'invalid_credentials' && !awaitingOtp;

  const handleFormAction = (action: (formData: FormData) => Promise<void>) => {
    return (formData: FormData) => {
      startTransition(async () => {
        await action(formData);
      });
    };
  };

  const setAuthMode = (next: AuthMode) => {
    setMode(next);
  };

  if (awaitingOtp) {
    return (
      <div className="bg-white dark:bg-zinc-900 py-10 px-8 shadow-2xl shadow-gray-200/50 dark:shadow-none rounded-[3rem] border border-gray-100 dark:border-zinc-800">
        <div className="text-center mb-6">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-600 mb-3">
            Confirma tu cuenta
          </p>
          <p className="text-sm font-medium text-gray-600 dark:text-zinc-400 leading-relaxed">
            Te enviamos un código de <strong>6 dígitos</strong> a{' '}
            <span className="font-mono text-gray-900 dark:text-white">
              {maskEmail(prefilledEmail)}
            </span>
          </p>
          <p className="mt-3 text-[9px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-widest">
            Puedes abrir el correo en otro móvil y pegar el código aquí
          </p>
          <p className="mt-2 text-[9px] font-medium text-gray-400 dark:text-zinc-500 leading-relaxed">
            Puede llegar 1 o 2 correos. Usa el código del email{' '}
            <strong>«Your Magic Link»</strong> (Tu código para entrar en Q26). Si solo
            llega uno de confirmación, prueba ese código o pulsa Reenviar.
          </p>
        </div>

        <form className="space-y-6">
          <input type="hidden" name="email" value={prefilledEmail} />

          {otpMessage && (
            <div
              className={`p-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-center border ${
                otpMessage.toLowerCase().includes('nuevo')
                  ? 'bg-green-50 dark:bg-green-950/20 border-green-100 dark:border-green-900/30 text-green-600'
                  : 'bg-red-50 dark:bg-red-950/20 border-red-100 dark:border-red-900/30 text-red-600'
              }`}
            >
              {otpMessage}
            </div>
          )}

          <div>
            <label
              className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 ml-1 text-center"
              htmlFor="token"
            >
              Código de verificación
            </label>
            <OtpCodeInput autoFocus />
          </div>

          <button
            formAction={handleFormAction(verifySignupOtp)}
            disabled={isPending}
            className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 active:scale-95 disabled:opacity-50"
          >
            {isPending ? 'Verificando...' : 'Confirmar y entrar'}
          </button>

          <button
            type="submit"
            formAction={handleFormAction(resendSignupOtp)}
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
            Volver al inicio de sesión
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-zinc-900 py-10 px-8 shadow-2xl shadow-gray-200/50 dark:shadow-none rounded-[3rem] border border-gray-100 dark:border-zinc-800">
      <div className="flex rounded-2xl bg-gray-50 dark:bg-zinc-800 p-1 mb-6">
        <button
          type="button"
          onClick={() => setAuthMode('login')}
          className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
            mode === 'login'
              ? 'bg-white dark:bg-zinc-900 text-blue-600 shadow-sm'
              : 'text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300'
          }`}
        >
          Entrar
        </button>
        <button
          type="button"
          onClick={() => setAuthMode('signup')}
          className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
            mode === 'signup'
              ? 'bg-white dark:bg-zinc-900 text-blue-600 shadow-sm'
              : 'text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300'
          }`}
        >
          Crear cuenta
        </button>
      </div>

      <form className="space-y-6">
        {successText && (
          <div className="p-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-center border bg-green-50 dark:bg-green-950/20 border-green-100 dark:border-green-900/30 text-green-600 dark:text-green-400">
            {successText}
          </div>
        )}

        {errorText && (
          <div className="p-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-center border bg-red-50 dark:bg-red-950/20 border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-400">
            {errorText}
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
            key={`email-${prefilledEmail}`}
            className="block w-full rounded-2xl px-5 py-4 bg-gray-50 dark:bg-zinc-800 border-none outline-none focus:ring-2 focus:ring-blue-500 font-bold transition-all"
            name="email"
            id="email"
            type="email"
            placeholder="tu@email.com"
            defaultValue={prefilledEmail}
            required
          />
        </div>

        <div>
          <div className="flex justify-between items-center mb-2 ml-1">
            <label
              className="block text-[10px] font-black uppercase tracking-widest text-gray-400"
              htmlFor="password"
            >
              Contraseña
            </label>
            {mode === 'login' && (
              <Link
                href="/forgot-password"
                className="text-[10px] font-black uppercase tracking-widest text-blue-600 hover:text-blue-500"
              >
                ¿La olvidaste?
              </Link>
            )}
          </div>
          <PasswordInput id="password" name="password" />
        </div>

        <div className="flex flex-col gap-3 pt-2">
          {mode === 'login' ? (
            <button
              formAction={handleFormAction(login)}
              disabled={isPending}
              className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 active:scale-95 disabled:opacity-50"
            >
              {isPending ? 'Entrando...' : 'Entrar a la Cancha'}
            </button>
          ) : (
            <button
              formAction={handleFormAction(signup)}
              disabled={isPending}
              className="w-full bg-zinc-900 dark:bg-white text-white dark:text-black py-4 rounded-2xl font-black uppercase tracking-widest hover:opacity-90 transition-all active:scale-95 disabled:opacity-50"
            >
              {isPending ? 'Registrando...' : 'Crear mi cuenta'}
            </button>
          )}

          {showSignupAfterFailedLogin && (
            <div className="pt-2 border-t border-gray-100 dark:border-zinc-800 space-y-3">
              <p className="text-[9px] font-bold text-gray-400 dark:text-zinc-500 text-center uppercase tracking-widest">
                ¿Eres nuevo?
              </p>
              <button
                formAction={handleFormAction(signup)}
                disabled={isPending}
                className="w-full py-3 rounded-2xl border border-gray-200 dark:border-zinc-700 text-[10px] font-black uppercase tracking-widest text-gray-600 dark:text-zinc-300 hover:border-blue-500 hover:text-blue-600 transition-all disabled:opacity-50"
              >
                {isPending ? 'Registrando...' : 'Crear cuenta con este email'}
              </button>
            </div>
          )}
        </div>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black flex flex-col justify-center py-12 px-6 lg:px-8 font-sans">
      <Link
        href="/"
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
        Inicio
      </Link>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-600 rounded-[2rem] shadow-xl shadow-blue-500/20 mb-6 transform -rotate-6 transition-transform hover:rotate-0">
          <span className="text-3xl font-black text-white tracking-tighter">
            Q26
          </span>
        </div>
        <h2 className="text-4xl font-black text-gray-900 dark:text-white uppercase tracking-tighter leading-tight">
          LA <span className="text-blue-600">QUINIELA</span>
        </h2>
        <p className="mt-2 text-xs font-black text-gray-400 dark:text-zinc-500 uppercase tracking-[0.3em]">
          Mundial 2026
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
          <LoginContent />
        </Suspense>
        <p className="mt-8 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest">
          Juega con responsabilidad • Mundial 2026
        </p>
      </div>
    </div>
  );
}
