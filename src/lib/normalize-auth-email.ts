/** Corrige '+' convertido en espacio al parsear query strings (ej. lapoiax+2@gmail.com). */
export function normalizeAuthEmail(raw: string): string {
  const trimmed = raw.trim();
  const at = trimmed.indexOf("@");
  if (at <= 0) return trimmed;

  let local = trimmed.slice(0, at);
  const domain = trimmed.slice(at + 1).toLowerCase();

  if (local.includes(" ") && !local.includes("+")) {
    local = local.replace(/ /g, "+");
  }

  return `${local}@${domain}`;
}
