'use client';

import { use } from 'react';
import Link from 'next/link';
import { forgotPassword } from '../login/actions';

export default function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ message: string }>;
}) {
  const resolvedSearchParams = use(searchParams);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black flex flex-col justify-center py-12 px-6 lg:px-8 font-sans">
      <Link
        href="/login"
        className="absolute left-8 top-8 py-2 px-4 rounded-2xl no-underline text-gray-500 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 flex items-center group text-xs font-black uppercase tracking-widest hover:border-blue-500 transition-all shadow-sm"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="mr-2 transition-transform group-hover:-translate-x-1"><polyline points="15 18 9 12 15 6" /></svg>
        Volver
      </Link>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-600 rounded-[2rem] shadow-xl shadow-blue-500/20 mb-6 transform -rotate-6 transition-transform hover:rotate-0">
          <span className="text-3xl font-black text-white tracking-tighter">Q26</span>
        </div>
        <h2 className="text-4xl font-black text-gray-900 dark:text-white uppercase tracking-tighter leading-tight">
          RECUPERAR <span className="text-blue-600">ACCESO</span>
        </h2>
        <p className="mt-2 text-xs font-black text-gray-400 dark:text-zinc-500 uppercase tracking-[0.3em]">
          Te enviaremos un enlace de entrada
        </p>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-zinc-900 py-10 px-8 shadow-2xl shadow-gray-200/50 dark:shadow-none rounded-[3rem] border border-gray-100 dark:border-zinc-800">
          <form className="space-y-6">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 ml-1" htmlFor="email">
                Correo Electrónico
              </label>
              <input className="block w-full rounded-2xl px-5 py-4 bg-gray-50 dark:bg-zinc-800 border-none outline-none focus:ring-2 focus:ring-blue-500 font-bold transition-all" name="email" type="email" placeholder="tu@email.com" required />
            </div>

            <div className="pt-2">
              <button formAction={forgotPassword} className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 active:scale-95">Enviar Enlace</button>
            </div>

            {resolvedSearchParams?.message && (
              <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/30 text-blue-600 dark:text-blue-400 text-center rounded-2xl text-[10px] font-black uppercase tracking-widest">
                {resolvedSearchParams.message}
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
