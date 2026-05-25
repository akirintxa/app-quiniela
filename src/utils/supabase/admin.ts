import { createClient } from "@supabase/supabase-js";

/**
 * Cliente con service role solo en el servidor, tras validar ADMIN_EMAIL.
 * Bypasea RLS para actualizar marcadores y repartir puntos a todos los usuarios.
 */
export function createServiceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Falta SUPABASE_SERVICE_ROLE_KEY en el entorno (Vercel / .env.local)"
    );
  }

  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
