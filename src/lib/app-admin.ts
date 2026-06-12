/** Comprueba si un email está en ADMIN_EMAIL (lista separada por comas). */
export function isAppAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const admins =
    process.env.ADMIN_EMAIL?.split(",").map((e) => e.trim()).filter(Boolean) ??
    [];
  return admins.includes(email);
}
