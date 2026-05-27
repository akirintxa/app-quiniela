import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Envía OTP de 6 dígitos usando la plantilla "Magic Link" de Supabase.
 * El código de {{ .Token }} en "Confirm signup" (tras signUp) a menudo no valida con verifyOtp.
 */
export async function sendLoginOtpEmail(
  supabase: SupabaseClient,
  email: string
) {
  return supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: false,
    },
  });
}
