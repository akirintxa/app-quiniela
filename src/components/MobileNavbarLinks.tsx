'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function MobileNavbarLinks() {
  const pathname = usePathname();

  const links = [
    { href: "/", label: "Inicio" },
    { href: "/groups", label: "Ligas" },
    { href: "/ranking", label: "Ranking" },
  ];

  return (
    <div className="sm:hidden flex justify-center gap-8 pb-4 border-t border-gray-50 dark:border-zinc-900 pt-2">
      {links.map((link) => {
        const isActive = link.href === "/" 
          ? pathname === "/" 
          : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`text-[9px] font-black uppercase tracking-widest transition-all ${
              isActive ? 'text-blue-600' : 'text-gray-400'
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </div>
  );
}
