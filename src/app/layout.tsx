import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { headers } from "next/headers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FIFA World Cup 2026 | Quiniela Oficial",
  description: "Predice los resultados del Mundial 2026 y compite con tus amigos.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headerList = await headers();
  const pathname = headerList.get("x-current-path") || "";
  
  // Lista de rutas donde NO queremos mostrar el Navbar
  const authRoutes = ['/login', '/forgot-password', '/update-password'];
  const isAuthPage = authRoutes.some(route => pathname.includes(pathname)); 
  // Nota: Usar x-current-path requiere un middleware. 
  // Vamos a usar una solución más sencilla: pasar el Navbar a las páginas individuales o agruparlas.
  
  return (
    <html lang="es">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-50 dark:bg-black text-gray-900 dark:text-zinc-100`}>
        {/* El Navbar se mostrará en todas las páginas excepto las de auth */}
        {children}
      </body>
    </html>
  );
}
