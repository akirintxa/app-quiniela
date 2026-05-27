/** Muestra email enmascarado para pantallas de confirmación (ej. i***@losqq.com). */
export function maskEmail(email: string): string {
  const trimmed = email.trim();
  const at = trimmed.indexOf("@");
  if (at <= 0) return trimmed;
  const local = trimmed.slice(0, at);
  const domain = trimmed.slice(at);
  if (local.length <= 1) return `*${domain}`;
  return `${local[0]}${"*".repeat(Math.min(3, local.length - 1))}${domain}`;
}
