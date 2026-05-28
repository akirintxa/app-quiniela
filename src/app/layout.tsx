import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";
import Navbar from "@/components/Navbar";
import ChampionCelebrationLoader from "@/components/ChampionCelebrationLoader";
import ProfileSetupBanner from "@/components/ProfileSetupBanner";
import { createClient } from "@/utils/supabase/server";
import { fetchProfileFields, getProfileMissing } from "@/lib/profile";

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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let profileMissing: ReturnType<typeof getProfileMissing> = [];
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const fields = await fetchProfileFields(supabase, user.id);
      profileMissing = getProfileMissing(fields);
    }
  } catch {
    // No bloquear el layout si falla la lectura del perfil
  }

  return (
    <html lang="es">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-50 dark:bg-black text-gray-900 dark:text-zinc-100`}>
        <Navbar />
        {profileMissing.length > 0 && (
          <ProfileSetupBanner missing={profileMissing} />
        )}
        <Suspense fallback={null}>
          <ChampionCelebrationLoader />
        </Suspense>
        {children}
      </body>
    </html>
  );
}
