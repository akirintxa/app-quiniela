import { Match, Prediction, Team } from "@/types";
import { GroupId, StandingsMode } from "@/types/knockout";
import { BRACKET_FIXTURES } from "./bracket-fixtures";
import { computeGroupStandings, getCompletedGroups } from "./knockout";
import {
  buildThirdPlaceAssignment,
  rankBestThirdPlaces,
} from "./third-place-combinations";
import { TeamStats } from "./standings";

const GROUP_IDS: GroupId[] = [
  "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L",
];

export type BestThirdRow = {
  rank: number;
  groupId: string;
  teamName: string;
  isoCode: string;
  points: number;
  gd: number;
  gf: number;
  qualifies: boolean;
};

export type BestThirdSlotRow = {
  annexColumn: string;
  opponentLabel: string;
  matchId: number;
  thirdGroupId: string | null;
  teamName: string | null;
  isoCode: string | null;
  eligibleGroups: string[];
};

export type BestThirdPlacesView = {
  mode: StandingsMode;
  ranked: BestThirdRow[];
  slots: BestThirdSlotRow[];
  combinationId: number | null;
  completedGroupsCount: number;
  thirdPlacesCount: number;
  canAssign: boolean;
  qualifyingGroupLetters: string[];
  hasOfficialGroupResults: boolean;
};

export const EMPTY_BEST_THIRDS_VIEW: BestThirdPlacesView = {
  mode: "predicted",
  ranked: [],
  slots: [],
  combinationId: null,
  completedGroupsCount: 0,
  thirdPlacesCount: 0,
  canAssign: false,
  qualifyingGroupLetters: [],
  hasOfficialGroupResults: false,
};

function groupHasFinishedResults(groupId: GroupId, groupMatches: Match[]): boolean {
  return groupMatches.some(
    (m) =>
      m.group_id === groupId &&
      m.is_finished &&
      m.result_a !== null &&
      m.result_b !== null
  );
}

function collectThirdPlaces(
  standings: Record<GroupId, TeamStats[]>,
  completedGroups: Set<GroupId>,
  allowedGroups: Set<GroupId>
): TeamStats[] {
  const thirds: TeamStats[] = [];
  GROUP_IDS.forEach((gid) => {
    if (!completedGroups.has(gid) || !allowedGroups.has(gid)) return;
    const s = standings[gid];
    if (s?.[2]) thirds.push({ ...s[2], groupId: gid });
  });
  return thirds;
}

function buildSlotRows(
  assignment: ReturnType<typeof buildThirdPlaceAssignment>,
  ranked: TeamStats[]
): BestThirdSlotRow[] {
  const thirdByGroup = new Map<string, TeamStats>();
  ranked.forEach((s) => {
    if (s.groupId) thirdByGroup.set(s.groupId, s);
  });

  const rows: BestThirdSlotRow[] = [];

  for (const fixture of BRACKET_FIXTURES.filter((m) => m.stage === "round_32")) {
    const thirdSlot =
      fixture.slotA.kind === "best_third"
        ? fixture.slotA
        : fixture.slotB.kind === "best_third"
          ? fixture.slotB
          : null;
    const opponentSlot =
      fixture.slotA.kind === "group_pos" && fixture.slotA.position === 1
        ? fixture.slotA
        : fixture.slotB.kind === "group_pos" && fixture.slotB.position === 1
          ? fixture.slotB
          : null;

    if (!thirdSlot || !opponentSlot || opponentSlot.kind !== "group_pos") continue;

    const annexColumn = thirdSlot.annexColumn;
    const thirdGroupId = assignment?.byAnnexColumn[annexColumn] ?? null;
    const stats = thirdGroupId ? thirdByGroup.get(thirdGroupId) : undefined;

    rows.push({
      annexColumn,
      opponentLabel: `1${opponentSlot.group}`,
      matchId: fixture.id,
      thirdGroupId: thirdGroupId ?? null,
      teamName: stats?.team.name ?? null,
      isoCode: stats?.team.iso_code ?? null,
      eligibleGroups: [...thirdSlot.eligible],
    });
  }

  return rows.sort((a, b) => a.annexColumn.localeCompare(b.annexColumn));
}

export function buildBestThirdPlacesView(
  groupMatches: Match[],
  predictions: Prediction[],
  allTeams: Team[],
  mode: StandingsMode
): BestThirdPlacesView {
  const completedGroups = getCompletedGroups(groupMatches, predictions);
  const standings = computeGroupStandings(
    groupMatches,
    predictions,
    allTeams,
    mode
  );

  const groupsWithRealResults = new Set<GroupId>(
    GROUP_IDS.filter((gid) => groupHasFinishedResults(gid, groupMatches))
  );

  const allowedGroups =
    mode === "real" ? groupsWithRealResults : completedGroups;

  const rawThirds = collectThirdPlaces(standings, completedGroups, allowedGroups);
  const ranked = rankBestThirdPlaces(rawThirds);
  const qualifying = ranked.slice(0, 8);
  const qualifyingSet = new Set(qualifying.map((s) => s.groupId));

  const assignment =
    ranked.length >= 8 ? buildThirdPlaceAssignment(ranked) : null;

  const rankedRows: BestThirdRow[] = ranked.map((s, idx) => ({
    rank: idx + 1,
    groupId: s.groupId ?? "?",
    teamName: s.team.name,
    isoCode: s.team.iso_code ?? "",
    points: s.points,
    gd: s.gd,
    gf: s.gf,
    qualifies: idx < 8 && qualifyingSet.has(s.groupId),
  }));

  return {
    mode,
    ranked: rankedRows,
    slots: buildSlotRows(assignment, ranked),
    combinationId: assignment?.combinationId ?? null,
    completedGroupsCount: completedGroups.size,
    thirdPlacesCount: rawThirds.length,
    canAssign: ranked.length >= 8 && assignment !== null,
    qualifyingGroupLetters: qualifying
      .map((s) => s.groupId)
      .filter(Boolean) as string[],
    hasOfficialGroupResults: groupsWithRealResults.size > 0,
  };
}
