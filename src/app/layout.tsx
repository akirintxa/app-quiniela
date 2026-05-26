import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";
import Navbar from "@/components/Navbar";
import ChampionCelebrationLoader from "@/components/ChampionCelebrationLoader";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Q26 - La Quiniela",
  description: "Predice los resultados del Mundial 2026 y compite con tus amigos.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-50 dark:bg-black text-gray-900 dark:text-zinc-100`}>
        <Navbar />
        <Suspense fallback={null}>
          <ChampionCelebrationLoader />
        </Suspense>
        {children}
      </body>
    </html>
  );
}
