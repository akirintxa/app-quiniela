import type { WorldCup26Game } from "@/lib/score-providers/worldcup26";
import { parseExternalScore } from "@/lib/score-providers/worldcup26";

/** Grupos de nombres equivalentes (API en inglés vs BD en español). */
const TEAM_EQUIV: string[][] = [
  ["croatia", "croacia"],
  ["ivorycoast", "costademarfil"],
  ["turkiye", "turquia"],
  ["turkey", "turquia"],
  ["unitedstates", "eeuu"],
  ["democraticrepublicofthecongo", "rdcongo"],
  ["drcongo", "rdcongo"],
  ["bosniaandherzegovina", "bosniayherz"],
  ["bosniaherzegovina", "bosniayherz"],
  ["czechrepublic", "republicacheca"],
  ["southkorea", "coreadelsur"],
  ["southafrica", "sudafrica"],
  ["curacao", "curazao"],
  ["uzbekistan", "uzbekistan"],
  ["ecuador", "ecuador"],
  ["panama", "panama"],
  ["england", "inglaterra"],
  ["scotland", "escocia"],
  ["morocco", "marruecos"],
  ["haiti", "haiti"],
  ["colombia", "colombia"],
  ["germany", "alemania"],
  ["netherlands", "paisesbajos"],
  ["mexico", "mexico"],
  ["brazil", "brasil"],
  ["argentina", "argentina"],
  ["france", "francia"],
  ["portugal", "portugal"],
  ["spain", "espana"],
  ["saudiarabia", "arabiasaudita"],
  ["capeverde", "caboverde"],
  ["newzealand", "nuevazelandia"],
  ["norway", "noruega"],
  ["senegal", "senegal"],
  ["iraq", "irak"],
  ["algeria", "argelia"],
  ["austria", "austria"],
  ["jordan", "jordania"],
  ["ghana", "ghana"],
  ["japan", "japon"],
  ["tunisia", "tunez"],
  ["sweden", "suecia"],
  ["switzerland", "suiza"],
  ["canada", "canada"],
  ["qatar", "qatar"],
  ["australia", "australia"],
  ["paraguay", "paraguay"],
  ["egypt", "egypt"],
  ["iran", "iran"],
  ["belgium", "belgica"],
  ["uruguay", "uruguay"],
];

function normalizeTeamKey(name: string): string {
  return name
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function canonicalTeamKey(name: string | undefined | null): string | null {
  if (!name) return null;
  const key = normalizeTeamKey(name);
  if (!key) return null;

  for (const group of TEAM_EQUIV) {
    if (group.some((variant) => key.includes(variant) || variant.includes(key))) {
      return group[0];
    }
  }

  return key;
}

export function teamsMatch(
  apiName: string | undefined | null,
  dbName: string | undefined | null
): boolean {
  const a = canonicalTeamKey(apiName);
  const b = canonicalTeamKey(dbName);
  if (!a || !b) return false;
  return a === b;
}

export function mapExternalScoresToMatchSides(
  game: WorldCup26Game,
  teamAName: string | undefined | null,
  teamBName: string | undefined | null
): { resultA: number | null; resultB: number | null; swapped: boolean } {
  const homeScore = parseExternalScore(game.home_score);
  const awayScore = parseExternalScore(game.away_score);

  const homeIsA = teamsMatch(game.home_team_name_en, teamAName);
  const awayIsB = teamsMatch(game.away_team_name_en, teamBName);
  const homeIsB = teamsMatch(game.home_team_name_en, teamBName);
  const awayIsA = teamsMatch(game.away_team_name_en, teamAName);

  if (homeIsA && awayIsB) {
    return { resultA: homeScore, resultB: awayScore, swapped: false };
  }
  if (homeIsB && awayIsA) {
    return { resultA: awayScore, resultB: homeScore, swapped: true };
  }

  return { resultA: homeScore, resultB: awayScore, swapped: false };
}
