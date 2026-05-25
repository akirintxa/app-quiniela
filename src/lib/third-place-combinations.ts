import annexData from "@/data/fifa-annex-c.json";
import { GroupId, ThirdPlaceAssignment } from "@/types/knockout";
import { TeamStats } from "./standings";
import { ANNEX_COLUMN_TO_SLOT_CODE } from "./bracket-fixtures";

const WINNER_COLUMNS = ["1A", "1B", "1D", "1E", "1G", "1I", "1K", "1L"] as const;

interface AnnexRow {
  id: number;
  qualifyingGroups: string[];
  assignments: Record<string, string>;
}

const ANNEX_ROWS = annexData as AnnexRow[];

function groupsKey(groups: GroupId[]): string {
  return [...groups].sort().join("");
}

const lookupCache = new Map<string, AnnexRow>();
for (const row of ANNEX_ROWS) {
  const key = groupsKey(row.qualifyingGroups as GroupId[]);
  if (!lookupCache.has(key)) {
    lookupCache.set(key, row);
  }
}

export function rankBestThirdPlaces(allThirdPlaces: TeamStats[]): TeamStats[] {
  return [...allThirdPlaces].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.gd !== a.gd) return b.gd - a.gd;
    return b.gf - a.gf;
  });
}

export function getQualifyingThirdGroups(ranked: TeamStats[]): GroupId[] | null {
  if (ranked.length < 8) return null;
  return ranked.slice(0, 8).map((s) => s.groupId as GroupId);
}

export function findAnnexCombination(qualifyingGroups: GroupId[]): AnnexRow | null {
  const key = groupsKey(qualifyingGroups);
  return lookupCache.get(key) ?? null;
}

export function buildThirdPlaceAssignment(
  rankedThirdPlaces: TeamStats[]
): ThirdPlaceAssignment | null {
  const qualifying = getQualifyingThirdGroups(rankedThirdPlaces);
  if (!qualifying) return null;

  const row = findAnnexCombination(qualifying);
  if (!row) return null;

  const byAnnexColumn: Record<string, GroupId> = {};
  const bySlotCode: Record<string, GroupId> = {};

  for (const col of WINNER_COLUMNS) {
    const code = row.assignments[col];
    if (!code || !code.startsWith("3")) continue;
    const groupLetter = code.slice(1) as GroupId;
    byAnnexColumn[col] = groupLetter;
    const slotCode = ANNEX_COLUMN_TO_SLOT_CODE[col];
    if (slotCode) bySlotCode[slotCode] = groupLetter;
  }

  return {
    combinationId: row.id,
    byAnnexColumn,
    bySlotCode,
  };
}

export function applyThirdPlaceToMap(
  map: Record<string, import("@/types").Team>,
  rankedThirdPlaces: TeamStats[],
  assignment: ThirdPlaceAssignment | null
): void {
  const thirdByGroup = new Map<GroupId, TeamStats>();
  for (const stats of rankedThirdPlaces) {
    if (stats.groupId) thirdByGroup.set(stats.groupId as GroupId, stats);
  }

  if (assignment) {
    for (const [slotCode, groupLetter] of Object.entries(assignment.bySlotCode)) {
      const stats = thirdByGroup.get(groupLetter);
      if (stats) {
        map[slotCode] = stats.team;
        map[`3${groupLetter}`] = stats.team;
      }
    }
  }
}
