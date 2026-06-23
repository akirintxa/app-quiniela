const DEFAULT_API_URL = "https://worldcup26.ir/get/games";

export type WorldCup26Game = {
  id: string;
  home_score: string | number | null;
  away_score: string | number | null;
  finished: string | boolean;
  time_elapsed?: string | null;
  type?: string;
};

export type WorldCup26GamesResponse = {
  games: WorldCup26Game[];
};

function parseTruthy(value: string | boolean | undefined): boolean {
  if (typeof value === "boolean") return value;
  if (!value) return false;
  return value.toString().toUpperCase() === "TRUE";
}

function normalizeElapsed(value: string | null | undefined): string {
  return (value ?? "").trim().toLowerCase();
}

export function parseExternalScore(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined || value === "null" || value === "") {
    return null;
  }
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return null;
  return n;
}

export function isExternalNotStarted(game: WorldCup26Game): boolean {
  if (parseTruthy(game.finished)) return false;
  return normalizeElapsed(game.time_elapsed) === "notstarted";
}

export function isExternalFinished(game: WorldCup26Game): boolean {
  if (parseTruthy(game.finished)) return true;
  return normalizeElapsed(game.time_elapsed) === "finished";
}

export async function fetchWorldCup26Games(
  apiUrl = process.env.WORLD_CUP26_API_URL ?? DEFAULT_API_URL
): Promise<WorldCup26Game[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);

  try {
    const res = await fetch(apiUrl, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
      next: { revalidate: 0 },
    });

    if (!res.ok) {
      throw new Error(`worldcup26 API ${res.status}`);
    }

    const data = (await res.json()) as WorldCup26GamesResponse;
    if (!Array.isArray(data.games)) {
      throw new Error("worldcup26 API: respuesta sin games[]");
    }

    return data.games;
  } finally {
    clearTimeout(timeout);
  }
}
