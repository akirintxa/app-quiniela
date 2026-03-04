'use client';

import { useState, use, useTransition, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { login, signup } from './actions';

function LoginContent() {
  const searchParams = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [localMessage, setLocalMessage] = useState<string | null>(searchParams.get('message'));

  useEffect(() => {
    setLocalMessage(searchParams.get('message'));
  }, [searchParams]);

  const isSuccess = localMessage?.includes('completado') || localMessage?.includes('email') || localMessage?.includes('enviado');

  const handleFormAction = (action: (formData: FormData) => Promise<any>) => {
    return (formData: FormData) => {
      startTransition(async () => {
        await action(formData);
      });
    };
  };

  const clearMessage = () => {
    if (localMessage) setLocalMessage(null);
  };

  return (
    <div className="bg-white dark:bg-zinc-900 py-10 px-8 shadow-2xl shadow-gray-200/50 dark:shadow-none rounded-[3rem] border border-gray-100 dark:border-zinc-800">
      <form className="space-y-6">
        {localMessage && (
          <div className={`mb-6 p-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-center border transition-opacity duration-300 ${
            isSuccess 
            ? 'bg-green-50 dark:bg-green-950/20 border-green-100 dark:border-green-900/30 text-green-600 dark:text-green-400' 
            : 'bg-red-50 dark:bg-red-950/20 border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-400'
          }`}>
            {localMessage}
          </div>
        )}

        <div>
          <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 ml-1" htmlFor="email">
            Correo Electrónico
          </label>
          <input 
            onFocus={clearMessage}
            onChange={clearMessage}
            className="block w-full rounded-2xl px-5 py-4 bg-gray-50 dark:bg-zinc-800 border-none outline-none focus:ring-2 focus:ring-blue-500 font-bold transition-all" 
            name="email" 
            type="email" 
            placeholder="tu@email.com" 
            required 
          />
        </div>

        <div>
          <div className="flex justify-between items-center mb-2 ml-1">
            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400" htmlFor="password">
              Contraseña
            </label>
            <Link href="/forgot-password" className="text-[10px] font-black uppercase tracking-widest text-blue-600 hover:text-blue-500">¿La olvidaste?</Link>
          </div>
          <div className="relative">
            <input 
              onFocus={clearMessage}
              onChange={clearMessage}
              className="block w-full rounded-2xl px-5 py-4 bg-gray-50 dark:bg-zinc-800 border-none outline-none focus:ring-2 focus:ring-blue-500 font-bold transition-all pr-12" 
              type={showPassword ? "text" : "password"} 
              name="password" 
              placeholder="••••••••" 
              required 
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-600 transition-colors">
              {showPassword ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.52 13.1 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/></svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
              )}
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-3 pt-2">
          <button 
            formAction={handleFormAction(login)} 
            disabled={isPending} 
            className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 active:scale-95 disabled:opacity-50"
          >
            {isPending ? 'Preparando...' : 'Entrar a la Cancha'}
          </button>
          <button 
            formAction={handleFormAction(signup)} 
            disabled={isPending} 
            className="w-full bg-zinc-900 dark:bg-white text-white dark:text-black py-4 rounded-2xl font-black uppercase tracking-widest hover:opacity-90 transition-all active:scale-95 disabled:opacity-50"
          >
            {isPending ? 'Registrando...' : 'Registrarme ahora'}
          </button>
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
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="mr-2 transition-transform group-hover:-translate-x-1"><polyline points="15 18 9 12 15 6" /></svg>
        Inicio
      </Link>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-600 rounded-[2rem] shadow-xl shadow-blue-500/20 mb-6 transform -rotate-6 transition-transform hover:rotate-0">
          <span className="text-3xl font-black text-white tracking-tighter">Q26</span>
        </div>
        <h2 className="text-4xl font-black text-gray-900 dark:text-white uppercase tracking-tighter leading-tight">
          LA <span className="text-blue-600">QUINIELA</span>
        </h2>
        <p className="mt-2 text-xs font-black text-gray-400 dark:text-zinc-500 uppercase tracking-[0.3em]">
          Mundial 2026
        </p>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-md">
        <Suspense fallback={<div className="p-12 text-center opacity-50 font-black text-[10px] uppercase tracking-widest">Cargando...</div>}>
          <LoginContent />
        </Suspense>
        <p className="mt-8 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest">Juega con responsabilidad • Mundial 2026</p>
      </div>
    </div>
  );
}
