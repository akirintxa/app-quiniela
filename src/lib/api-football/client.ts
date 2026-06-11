export type ApiFootballFixtureStatus =
  | "NS"
  | "TBD"
  | "PST"
  | "1H"
  | "HT"
  | "2H"
  | "ET"
  | "BT"
  | "P"
  | "LIVE"
  | "INT"
  | "FT"
  | "AET"
  | "PEN"
  | "CANC"
  | "ABD"
  | "AWD"
  | "WO";

export type ApiFootballFixture = {
  fixture: {
    id: number;
    date: string;
    status: { short: ApiFootballFixtureStatus; long: string };
  };
  teams: {
    home: { id: number; name: string; country?: string | null; winner: boolean | null };
    away: { id: number; name: string; country?: string | null; winner: boolean | null };
  };
  goals: { home: number | null; away: number | null };
};

type ApiFootballResponse<T> = {
  errors?: Record<string, string> | string[];
  response: T;
};

const BASE_URL = "https://v3.football.api-sports.io";

export function getApiFootballConfig() {
  const apiKey = process.env.API_FOOTBALL_KEY;
  const leagueId = Number(process.env.API_FOOTBALL_LEAGUE_ID ?? "1");
  const season = Number(process.env.API_FOOTBALL_SEASON ?? "2026");
  return { apiKey, leagueId, season };
}

export function isApiFootballConfigured(): boolean {
  return Boolean(getApiFootballConfig().apiKey);
}

async function apiFootballFetch<T>(path: string): Promise<T> {
  const { apiKey } = getApiFootballConfig();
  if (!apiKey) {
    throw new Error("API_FOOTBALL_KEY no configurada");
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "x-apisports-key": apiKey },
    next: { revalidate: 0 },
  });

  if (res.status === 429) {
    throw new Error("API-Football: límite de peticiones alcanzado (429)");
  }

  if (!res.ok) {
    throw new Error(`API-Football HTTP ${res.status}`);
  }

  const json = (await res.json()) as ApiFootballResponse<T>;
  if (json.errors && Object.keys(json.errors).length > 0) {
    const msg =
      typeof json.errors === "object" && !Array.isArray(json.errors)
        ? Object.values(json.errors).join("; ")
        : String(json.errors);
    throw new Error(`API-Football: ${msg}`);
  }

  return json.response;
}

export async function fetchFixturesByDate(
  date: string
): Promise<ApiFootballFixture[]> {
  const { leagueId, season } = getApiFootballConfig();
  const params = new URLSearchParams({
    date,
    league: String(leagueId),
    season: String(season),
    timezone: "America/Caracas",
  });
  return apiFootballFetch<ApiFootballFixture[]>(`/fixtures?${params}`);
}

export async function fetchAllLeagueFixtures(): Promise<ApiFootballFixture[]> {
  const { leagueId, season } = getApiFootballConfig();
  const params = new URLSearchParams({
    league: String(leagueId),
    season: String(season),
  });
  return apiFootballFetch<ApiFootballFixture[]>(`/fixtures?${params}`);
}

const LIVE_STATUSES = new Set<ApiFootballFixtureStatus>([
  "1H",
  "HT",
  "2H",
  "ET",
  "BT",
  "P",
  "LIVE",
  "INT",
]);

const FINISHED_STATUSES = new Set<ApiFootballFixtureStatus>([
  "FT",
  "AET",
  "PEN",
  "AWD",
  "WO",
]);

export function mapApiStatus(
  short: ApiFootballFixtureStatus
): "scheduled" | "live" | "finished" | "ignore" {
  if (LIVE_STATUSES.has(short)) return "live";
  if (FINISHED_STATUSES.has(short)) return "finished";
  if (short === "NS" || short === "TBD" || short === "PST") return "scheduled";
  return "ignore";
}

export function fixtureScores(fixture: ApiFootballFixture): {
  resultA: number;
  resultB: number;
} {
  return {
    resultA: fixture.goals.home ?? 0,
    resultB: fixture.goals.away ?? 0,
  };
}
