'use client';

import { use } from 'react';
import { updatePassword } from '../login/actions';

export default function UpdatePasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ message: string }>;
}) {
  const resolvedSearchParams = use(searchParams);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black flex flex-col justify-center py-12 px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-600 rounded-[2rem] shadow-xl shadow-blue-500/20 mb-6 transform -rotate-6 transition-transform hover:rotate-0">
          <span className="text-3xl font-black text-white tracking-tighter">Q26</span>
        </div>
        <h2 className="text-4xl font-black text-gray-900 dark:text-white uppercase tracking-tighter leading-tight">
          NUEVA <span className="text-blue-600">CONTRASEÑA</span>
        </h2>
        <p className="mt-2 text-xs font-black text-gray-400 dark:text-zinc-500 uppercase tracking-[0.3em]">
          Establece tu nueva clave de acceso
        </p>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-zinc-900 py-10 px-8 shadow-2xl shadow-gray-200/50 dark:shadow-none rounded-[3rem] border border-gray-100 dark:border-zinc-800">
          <form className="space-y-6">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 ml-1" htmlFor="password">
                Nueva Contraseña
              </label>
              <input className="block w-full rounded-2xl px-5 py-4 bg-gray-50 dark:bg-zinc-800 border-none outline-none focus:ring-2 focus:ring-blue-500 font-bold transition-all" name="password" type="password" placeholder="••••••••" required />
            </div>

            <div className="pt-2">
              <button formAction={updatePassword} className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 active:scale-95">Guardar Nueva Clave</button>
            </div>

            {resolvedSearchParams?.message && (
              <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-400 text-center rounded-2xl text-[10px] font-black uppercase tracking-widest">
                {resolvedSearchParams.message}
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
