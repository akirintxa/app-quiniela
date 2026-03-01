
import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="min-h-[80vh] flex flex-col items-center justify-center px-6 text-center">
      <div className="mb-8 relative">
        <span className="text-[12rem] font-black text-gray-100 dark:text-zinc-900 leading-none">404</span>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-32 h-32 bg-blue-600 rounded-[2.5rem] flex items-center justify-center rotate-12 shadow-2xl shadow-blue-500/40">
            <span className="text-5xl">⚽</span>
          </div>
        </div>
      </div>
      
      <h1 className="text-4xl font-black text-gray-900 dark:text-white uppercase tracking-tighter mb-4">
        ¡Fuera de Juego!
      </h1>
      <p className="text-gray-500 dark:text-zinc-400 font-bold uppercase text-xs tracking-[0.3em] max-w-xs mx-auto mb-10">
        La página o el grupo que buscas no está en esta cancha.
      </p>
      
      <Link 
        href="/" 
        className="bg-blue-600 hover:bg-blue-700 text-white px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-lg shadow-blue-500/20 active:scale-95"
      >
        Volver al Partido
      </Link>
    </main>
  );
}
