type TeamLike = { iso_code?: string | null; name?: string | null } | null | undefined;

export function getTeamFlagUrl(
  team: TeamLike,
  size: 40 | 80 = 80
): string | null {
  if (!team?.iso_code) return null;

  const name = (team.name || "").toLowerCase();
  const code = team.iso_code.toLowerCase();
  const prefix = `https://flagcdn.com/w${size}`;

  const special: Record<string, string> = {
    "gb-sct": "gb-sct",
    "gb-eng": "gb-eng",
    "gb-wls": "gb-wls",
  };
  if (special[code]) return `${prefix}/${special[code]}.png`;

  if (name.includes("scot") || name.includes("escoc")) return `${prefix}/gb-sct.png`;
  if (name.includes("engl") || name.includes("ingla")) return `${prefix}/gb-eng.png`;

  if (code.length !== 2) return null;
  return `${prefix}/${code}.png`;
}
