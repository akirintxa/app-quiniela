export type StandingsShareRow = {
  rank: number;
  nickname: string;
  points: number;
};

export function formatStandingsShareText(
  title: string,
  rows: StandingsShareRow[],
  pageUrl: string
): string {
  const lines = rows.map(
    (r) => `${r.rank}º ${r.nickname} — ${r.points} pts`
  );

  return [
    `🏆 ${title} — Quiniela Q26`,
    "",
    ...lines,
    "",
    `Ver ranking: ${pageUrl}`,
  ].join("\n");
}

export function whatsAppShareUrl(text: string): string {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}
