import type { EmailOtpType, SupabaseClient } from "@supabase/supabase-js";

const SIGNUP_OTP_TYPES: EmailOtpType[] = ["email", "signup", "magiclink"];

export async function verifyEmailOtp(
  supabase: SupabaseClient,
  email: string,
  token: string,
  types: EmailOtpType[] = SIGNUP_OTP_TYPES
): Promise<{ ok: true } | { ok: false; message: string }> {
  let lastMessage = "Código incorrecto o caducado.";

  for (const type of types) {
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type,
    });

    if (!error && (data.session || data.user)) {
      return { ok: true };
    }

    if (error?.message) {
      lastMessage = error.message;
    }
  }

  return { ok: false, message: lastMessage };
}
