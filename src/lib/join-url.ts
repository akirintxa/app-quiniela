export function normalizeInviteCode(code: string): string {
  return code.trim().toUpperCase();
}

export function getJoinUrl(inviteCode: string): string {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  return `${base.replace(/\/$/, "")}/join/${normalizeInviteCode(inviteCode)}`;
}
