import Link from "next/link";
import MatchCardPreview from "@/components/landing/MatchCardPreview";

const STEPS = [
  {
    n: "01",
    title: "Crea tu cuenta",
    text: "Regístrate en un minuto y confirma tu email con el enlace del correo.",
  },
  {
    n: "02",
    title: "Entra a una liga",
    text: "Escanea el QR de un amigo o usa su código de invitación.",
  },
  {
    n: "03",
    title: "Predice y compite",
    text: "Marca resultados, sube en el ranking global y en tu liga privada.",
  },
] as const;

const FEATURES = [
  {
    color: "bg-blue-600 shadow-blue-500/20",
    title: "Ligas privadas",
    text: "Oficina, familia o amigos: cada liga con su código y QR para invitar.",
    icon: (
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    ),
    extra: (
      <>
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </>
    ),
  },
  {
    color: "bg-green-500 shadow-green-500/20",
    title: "Ranking en vivo",
    text: "Sigue tu posición global y la de tu liga cuando se actualizan los resultados.",
    icon: <line x1="12" y1="20" x2="12" y2="10" />,
    extra: (
      <>
        <line x1="18" y1="20" x2="18" y2="4" />
        <line x1="6" y1="20" x2="6" y2="16" />
      </>
    ),
  },
  {
    color: "bg-orange-500 shadow-orange-500/20",
    title: "Una ayudaíta",
    text: "¿Poco tiempo? Rellena predicciones al azar en un clic y ajústalas después.",
    icon: <path d="m12 14 4-4 4 4-4 4-4-4Z" />,
    extra: <path d="M3.34 19a10 10 0 1 1 17.32 0" />,
  },
] as const;

export default function LandingPage() {
  return (
    <div className="min-h-[calc(100vh-80px)] flex flex-col font-sans overflow-hidden bg-white dark:bg-black">
      <section className="relative pt-12 pb-20 sm:pt-16 sm:pb-28 px-6 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-6xl pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-green-500/10 blur-[120px] rounded-full" />
        </div>

        <div className="max-w-6xl mx-auto relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 px-4 py-2 rounded-full mb-6 border border-blue-100 dark:border-blue-800/30">
                <span className="w-2 h-2 bg-blue-600 rounded-full" />
                <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400">
                  Mundial 2026
                </span>
              </div>

              <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tighter text-gray-900 dark:text-white uppercase leading-[0.95] mb-5">
                Tu quiniela del{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-400">
                  Mundial 2026
                </span>
              </h1>

              <p className="text-base sm:text-lg font-medium text-gray-600 dark:text-zinc-400 mb-8 leading-relaxed max-w-lg mx-auto lg:mx-0">
                Crea ligas privadas, invita con QR y demuestra quién sabe más de
                fútbol entre tus amigos.
              </p>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center lg:justify-start gap-3 mb-8">
                <Link
                  href="/login?mode=signup"
                  className="text-center bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-blue-500/30 transition-all hover:scale-[1.02] active:scale-95"
                >
                  Empezar a jugar
                </Link>
                <Link
                  href="/login"
                  className="text-center bg-gray-100 dark:bg-zinc-900 text-gray-900 dark:text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs border border-gray-200 dark:border-zinc-800 transition-all hover:bg-gray-200 dark:hover:bg-zinc-800"
                >
                  Ya tengo cuenta
                </Link>
              </div>

              <p className="text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-widest">
                Ligas privadas · Predicciones · Ranking con tus amigos
              </p>
            </div>

            <div className="lg:pl-4">
              <MatchCardPreview />
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 px-6 bg-gray-50/80 dark:bg-zinc-950/80 border-y border-gray-100 dark:border-zinc-900">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-center text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 mb-10">
            Cómo funciona
          </h2>
          <ol className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {STEPS.map((step) => (
              <li key={step.n} className="text-center sm:text-left">
                <span className="inline-block text-3xl font-black text-blue-600/30 dark:text-blue-500/40 mb-3">
                  {step.n}
                </span>
                <h3 className="text-sm font-black uppercase tracking-tight text-gray-900 dark:text-white mb-2">
                  {step.title}
                </h3>
                <p className="text-sm font-medium text-gray-500 dark:text-zinc-400 leading-relaxed">
                  {step.text}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="bg-white dark:bg-zinc-900 p-8 sm:p-10 rounded-[2.5rem] shadow-lg border border-gray-100 dark:border-zinc-800 transition-transform hover:-translate-y-1"
            >
              <div
                className={`w-14 h-14 ${f.color} rounded-2xl flex items-center justify-center mb-6 shadow-lg`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  {f.icon}
                  {f.extra}
                </svg>
              </div>
              <h3 className="text-lg font-black uppercase tracking-tight mb-3 text-gray-900 dark:text-white">
                {f.title}
              </h3>
              <p className="text-sm font-medium text-gray-500 dark:text-zinc-400 leading-relaxed">
                {f.text}
              </p>
            </div>
          ))}
        </div>
      </section>

      <footer className="py-10 px-6 border-t border-gray-100 dark:border-zinc-900 bg-white dark:bg-black">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <p className="text-[10px] font-black text-gray-300 dark:text-zinc-600 uppercase tracking-[0.4em]">
            Q26 — Quiniela 2026
          </p>
          <nav className="flex flex-wrap items-center justify-center gap-6">
            <Link
              href="/login?mode=signup"
              className="text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-blue-600 transition-colors"
            >
              Crear cuenta
            </Link>
            <Link
              href="/login"
              className="text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-blue-600 transition-colors"
            >
              Entrar
            </Link>
          </nav>
        </div>
        <p className="text-center mt-6 text-[9px] text-gray-400 dark:text-zinc-600">
          Juega con responsabilidad
        </p>
      </footer>
    </div>
  );
}
