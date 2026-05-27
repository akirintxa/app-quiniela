import { cookies } from "next/headers";
import { normalizeAuthEmail } from "@/lib/normalize-auth-email";

export { normalizeAuthEmail };

export const PENDING_SIGNUP_EMAIL_COOKIE = "pending_signup_email";
export const PENDING_RECOVERY_EMAIL_COOKIE = "pending_recovery_email";
const MAX_AGE = 60 * 60; // 1 hour

export async function setPendingSignupEmail(email: string) {
  const jar = await cookies();
  const isProd = process.env.NODE_ENV === "production";
  jar.set(PENDING_SIGNUP_EMAIL_COOKIE, normalizeAuthEmail(email), {
    httpOnly: true,
    sameSite: "lax",
    secure: isProd,
    maxAge: MAX_AGE,
    path: "/",
  });
}

export async function getPendingSignupEmail(): Promise<string | null> {
  const jar = await cookies();
  const value = jar.get(PENDING_SIGNUP_EMAIL_COOKIE)?.value;
  return value ? normalizeAuthEmail(value) : null;
}

export async function clearPendingSignupEmail() {
  const jar = await cookies();
  jar.delete(PENDING_SIGNUP_EMAIL_COOKIE);
}

export async function setPendingRecoveryEmail(email: string) {
  const jar = await cookies();
  const isProd = process.env.NODE_ENV === "production";
  jar.set(PENDING_RECOVERY_EMAIL_COOKIE, normalizeAuthEmail(email), {
    httpOnly: true,
    sameSite: "lax",
    secure: isProd,
    maxAge: MAX_AGE,
    path: "/",
  });
}

export async function getPendingRecoveryEmail(): Promise<string | null> {
  const jar = await cookies();
  const value = jar.get(PENDING_RECOVERY_EMAIL_COOKIE)?.value;
  return value ? normalizeAuthEmail(value) : null;
}

export async function clearPendingRecoveryEmail() {
  const jar = await cookies();
  jar.delete(PENDING_RECOVERY_EMAIL_COOKIE);
}
