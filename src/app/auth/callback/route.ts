import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import type { EmailOtpType } from "@supabase/supabase-js";
import {
  consumePendingPoolInvite,
  getPendingPoolInviteCode,
  joinResultRedirectPath,
} from "@/lib/pool-invite";

const LINK_ERROR_MESSAGE =
  "No se pudo validar el enlace del correo. Puede haber caducado o ya haberse usado. Inicia sesión o regístrate de nuevo para recibir otro email.";

function loginRedirect(origin: string, message: string) {
  return NextResponse.redirect(
    `${origin}/login?message=${encodeURIComponent(message)}`
  );
}

function isEmailOtpType(value: string | null): value is EmailOtpType {
  return (
    value === "signup" ||
    value === "invite" ||
    value === "magiclink" ||
    value === "recovery" ||
    value === "email" ||
    value === "email_change"
  );
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const token_hash = requestUrl.searchParams.get("token_hash");
  const typeParam = requestUrl.searchParams.get("type");
  let next = requestUrl.searchParams.get("next") ?? "/";
  const origin = requestUrl.origin;
  const authError = requestUrl.searchParams.get("error");
  const errorCode = requestUrl.searchParams.get("error_code");

  if (authError) {
    const message =
      errorCode === "otp_expired"
        ? "El enlace ha caducado. Solicita un nuevo correo de confirmación o recuperación."
        : LINK_ERROR_MESSAGE;
    return loginRedirect(origin, message);
  }

  const supabase = await createClient();

  if (token_hash && isEmailOtpType(typeParam)) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash,
      type: typeParam,
    });
    if (error) {
      console.error("auth/callback verifyOtp:", error.message);
      return loginRedirect(origin, LINK_ERROR_MESSAGE);
    }
    if (typeParam === "recovery" && !requestUrl.searchParams.has("next")) {
      next = "/update-password";
    }
  } else if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      console.error("auth/callback exchangeCodeForSession:", error.message);
      return loginRedirect(
        origin,
        "No se pudo completar el acceso. Abre el enlace en el mismo navegador donde te registraste o solicita un nuevo correo."
      );
    }
  } else {
    return loginRedirect(origin, LINK_ERROR_MESSAGE);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const pendingCode = await getPendingPoolInviteCode();
    if (pendingCode) {
      const result = await consumePendingPoolInvite(supabase, user.id);
      if (result) {
        revalidatePath("/groups");
        if (result.ok) revalidatePath(`/groups/${result.poolId}`);
        return NextResponse.redirect(
          `${origin}${joinResultRedirectPath(result)}`
        );
      }
    }

    if (next === "/join/complete") {
      return NextResponse.redirect(`${origin}/join/complete`);
    }
  }

  if (!next.startsWith("/")) {
    next = "/";
  }

  return NextResponse.redirect(`${origin}${next}`);
}
