'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function NavbarLinks() {
  const pathname = usePathname();

  const links = [
    { href: "/", label: "Mis Predicciones" },
    { href: "/groups", label: "Mis Ligas" },
    { href: "/ranking", label: "Ranking" },
  ];

  return (
    <div className="hidden sm:flex items-center gap-6 mr-4">
      {links.map((link) => {
        const isActive = link.href === "/" 
          ? pathname === "/" 
          : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`text-[10px] font-black uppercase tracking-widest transition-all relative group ${
              isActive ? 'text-blue-600' : 'text-gray-500 hover:text-blue-600'
            }`}
          >
            {link.label}
            {isActive && (
              <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 bg-blue-600 rounded-full animate-in zoom-in duration-300"></span>
            )}
          </Link>
        );
      })}
    </div>
  );
}
