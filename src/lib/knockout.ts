import { Match, Prediction, Team } from "@/types";
import {
  BracketSlot,
  DisplaySource,
  GroupId,
  KnockoutMatchViewModel,
  KnockoutTeamSlot,
  ResolveKnockoutInput,
  SlotSource,
  StandingsMode,
  ThirdPlaceAssignment,
} from "@/types/knockout";
import { BRACKET_FIXTURES, getFixtureByMatchId } from "./bracket-fixtures";
import { getPlaceholderLabel, slotToPlaceholderCode } from "./bracket-labels";
import {
  applyThirdPlaceToMap,
  buildThirdPlaceAssignment,
  rankBestThirdPlaces,
} from "./third-place-combinations";
import { calculateStandings, TeamStats } from "./standings";
import { getKnockoutOfficialWinnerTeamId } from "./match-admin";

const GROUP_IDS: GroupId[] = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"];

/** Grupo con todos los partidos de fase de grupos cerrados oficialmente */
export function groupHasCompleteOfficialResults(
  groupId: GroupId,
  groupMatches: Match[]
): boolean {
  const inGroup = groupMatches.filter(
    (m) => m.group_id === groupId && m.stage === "group"
  );
  if (inGroup.length === 0) return false;
  return inGroup.every(
    (m) => m.is_finished && m.result_a !== null && m.result_b !== null
  );
}

export function getGroupsWithCompleteOfficialResults(
  groupMatches: Match[]
): Set<GroupId> {
  return new Set(
    GROUP_IDS.filter((gid) => groupHasCompleteOfficialResults(gid, groupMatches))
  );
}

/** Grupos con predicción en todos los partidos de fase de grupos (incl. ya finalizados) */
export function getCompletedGroups(
  allGroupMatches: Match[],
  userPredictions: Prediction[]
): Set<GroupId> {
  const completed = new Set<GroupId>();
  GROUP_IDS.forEach((gid) => {
    const groupMatches = allGroupMatches.filter(
      (m) => m.group_id === gid && m.stage === "group"
    );
    if (groupMatches.length === 0) return;
    const done = groupMatches.every((m) => {
      const p = userPredictions.find((pr) => pr.match_id === m.id);
      return p?.predicted_a != null && p?.predicted_b != null;
    });
    if (done) completed.add(gid);
  });
  return completed;
}

export function computeGroupStandings(
  allGroupMatches: Match[],
  userPredictions: Prediction[],
  allTeams: Team[],
  mode: StandingsMode
): Record<GroupId, TeamStats[]> {
  const groupStandings: Record<string, TeamStats[]> = {};

  GROUP_IDS.forEach((gid) => {
    const matchesInGroup = allGroupMatches.filter((m) => m.group_id === gid);
    const teamsInGroup = Array.from(
      new Set([
        ...matchesInGroup.map((m) => m.team_a_id),
        ...matchesInGroup.map((m) => m.team_b_id),
      ])
    )
      .map((id) => allTeams.find((t) => t.id === id))
      .filter(Boolean) as Team[];

    const sourceMatches = matchesInGroup.map((m) => {
      if (mode === "real") {
        if (m.is_finished) return m;
        return { ...m, result_a: null, result_b: null };
      }
      if (m.is_finished) return m;
      const pred = userPredictions.find((p) => p.match_id === m.id);
      if (!pred || pred.predicted_a === null || pred.predicted_b === null) {
        return { ...m, result_a: null, result_b: null };
      }
      return {
        ...m,
        result_a: pred.predicted_a,
        result_b: pred.predicted_b,
      };
    });

    const standings = calculateStandings(sourceMatches as Match[], teamsInGroup).map(
      (s, idx) => ({ ...s, groupId: gid, rank: idx + 1 })
    );
    groupStandings[gid] = standings;
  });

  return groupStandings as Record<GroupId, TeamStats[]>;
}

function buildPlaceholderMap(
  groupStandings: Record<GroupId, TeamStats[]>,
  allThirdPlaces: TeamStats[],
  completedGroups: Set<GroupId>,
  groupsAllowedForPositions: Set<GroupId>
): { map: Record<string, Team>; assignment: ThirdPlaceAssignment | null } {
  const map: Record<string, Team> = {};

  GROUP_IDS.forEach((gid) => {
    if (!completedGroups.has(gid) || !groupsAllowedForPositions.has(gid)) return;
    const standings = groupStandings[gid];
    if (standings?.[0]) map[`1${gid}`] = standings[0].team;
    if (standings?.[1]) map[`2${gid}`] = standings[1].team;
  });

  const rankedThirds = rankBestThirdPlaces(
    allThirdPlaces
      .filter(
        (s) =>
          s.groupId &&
          completedGroups.has(s.groupId as GroupId) &&
          groupsAllowedForPositions.has(s.groupId as GroupId)
      )
      .map((s) => ({ ...s, groupId: s.groupId }))
  );

  let assignment: ThirdPlaceAssignment | null = null;
  if (rankedThirds.length >= 8) {
    assignment = buildThirdPlaceAssignment(rankedThirds);
    applyThirdPlaceToMap(map, rankedThirds, assignment);
  }

  return { map, assignment };
}

/** Partido con resultado usable para alimentar la ronda siguiente (finalizado o en vivo con marcador). */
function isKnockoutMatchDecided(
  match: Pick<Match, "is_finished" | "is_locked" | "result_a" | "result_b">
): boolean {
  if (match.is_finished) return true;
  return (
    Boolean(match.is_locked) &&
    match.result_a !== null &&
    match.result_b !== null
  );
}

/** `predicted_winner_id` / `winner_id` en BD suelen ser FK de slot; comparar también con IDs resueltos. */
function pickTeamFromStoredWinnerId(
  storedWinnerId: number | null | undefined,
  match: Pick<Match, "team_a_id" | "team_b_id">,
  resolvedA?: Team,
  resolvedB?: Team
): Team | undefined {
  if (storedWinnerId == null) return undefined;
  const w = Number(storedWinnerId);
  if (Number.isNaN(w)) return undefined;

  const slotA = Number(match.team_a_id);
  const slotB = Number(match.team_b_id);
  if (!Number.isNaN(slotA) && w === slotA) return resolvedA;
  if (!Number.isNaN(slotB) && w === slotB) return resolvedB;
  if (resolvedA?.id === w) return resolvedA;
  if (resolvedB?.id === w) return resolvedB;
  return undefined;
}

function getMatchWinnerTeam(
  match: Match,
  matchMap: Map<number, Match>,
  placeholderMap: Record<string, Team>,
  predictions: Prediction[],
  displaySource: DisplaySource
): Team | undefined {
  const resolvedA = resolveSlotTeam(
    match.team_a,
    match.id,
    matchMap,
    placeholderMap,
    predictions,
    displaySource
  );
  const resolvedB = resolveSlotTeam(
    match.team_b,
    match.id,
    matchMap,
    placeholderMap,
    predictions,
    displaySource
  );

  const resolvedForWinner = {
    team_a_id: resolvedA?.id ?? match.team_a_id,
    team_b_id: resolvedB?.id ?? match.team_b_id,
    team_a: resolvedA,
    team_b: resolvedB,
    knockout_slot_a_id: match.team_a_id,
    knockout_slot_b_id: match.team_b_id,
  };

  // Partido con resultado real: siempre ganador oficial (evita pronósticos viejos con IDs de slot)
  if (isKnockoutMatchDecided(match)) {
    const officialWinnerId = getKnockoutOfficialWinnerTeamId(
      match,
      resolvedForWinner
    );
    if (officialWinnerId == null) return undefined;
    if (resolvedA?.id === officialWinnerId) return resolvedA;
    if (resolvedB?.id === officialWinnerId) return resolvedB;
    return undefined;
  }

  if (displaySource === "real") {
    return undefined;
  }

  const pred = predictions.find((p) => p.match_id === match.id);
  if (
    pred &&
    pred.predicted_a !== null &&
    pred.predicted_b !== null
  ) {
    if (pred.predicted_a > pred.predicted_b) return resolvedA;
    if (pred.predicted_b > pred.predicted_a) return resolvedB;
    const fromPenaltyPick = pickTeamFromStoredWinnerId(
      pred.predicted_winner_id,
      match,
      resolvedA,
      resolvedB
    );
    if (fromPenaltyPick) return fromPenaltyPick;
  }

  return undefined;
}

function resolveSlotTeam(
  team: Team | undefined,
  _matchId: number,
  matchMap: Map<number, Match>,
  placeholderMap: Record<string, Team>,
  predictions: Prediction[],
  displaySource: DisplaySource
): Team | undefined {
  if (!team) return undefined;

  const iso = team.iso_code;

  if (placeholderMap[iso]) return placeholderMap[iso];

  if (iso.startsWith("W")) {
    const prevMatchId = parseInt(iso.substring(1), 10);
    if (!isNaN(prevMatchId)) {
      const prevMatch = matchMap.get(prevMatchId);
      if (prevMatch) {
        return getMatchWinnerTeam(prevMatch, matchMap, placeholderMap, predictions, displaySource);
      }
    }
  }

  if (iso.startsWith("L")) {
    const prevMatchId = parseInt(iso.substring(1), 10);
    if (!isNaN(prevMatchId)) {
      const prevMatch = matchMap.get(prevMatchId);
      if (prevMatch) {
        const winner = getMatchWinnerTeam(
          prevMatch,
          matchMap,
          placeholderMap,
          predictions,
          displaySource
        );
        const resolvedA = resolveSlotTeam(
          prevMatch.team_a,
          prevMatchId,
          matchMap,
          placeholderMap,
          predictions,
          displaySource
        );
        const resolvedB = resolveSlotTeam(
          prevMatch.team_b,
          prevMatchId,
          matchMap,
          placeholderMap,
          predictions,
          displaySource
        );
        if (winner && resolvedA && resolvedB) {
          return winner.id === resolvedA.id ? resolvedB : resolvedA;
        }
      }
    }
  }

  if (/^[12][A-L]$/.test(iso) || /^3[A-L]$/.test(iso) || /^3X[1-8]$/.test(iso)) {
    return placeholderMap[iso];
  }

  return team;
}

function resolveSlotFromDefinition(
  slot: BracketSlot,
  matchMap: Map<number, Match>,
  placeholderMap: Record<string, Team>,
  predictions: Prediction[],
  displaySource: DisplaySource,
  thirdAssignment: ThirdPlaceAssignment | null
): { team?: Team; code: string; label: string; source: SlotSource } {
  const code = slotToPlaceholderCode(slot, thirdAssignment ?? undefined);
  const label = getPlaceholderLabel(slot, thirdAssignment ?? undefined);

  if (slot.kind === "winner") {
    const prev = matchMap.get(slot.fromMatchId);
    if (prev && isKnockoutMatchDecided(prev) && displaySource === "real") {
      const team = getMatchWinnerTeam(prev, matchMap, placeholderMap, predictions, "real");
      if (team) return { team, code, label, source: "confirmed" };
    }
    if (displaySource === "real") {
      return { team: undefined, code, label, source: "placeholder" };
    }
    const team = prev
      ? getMatchWinnerTeam(prev, matchMap, placeholderMap, predictions, displaySource)
      : undefined;
    return { team, code, label, source: team ? "predicted" : "placeholder" };
  }

  if (slot.kind === "loser") {
    const prev = matchMap.get(slot.fromMatchId);
    if (displaySource === "real" && prev && !isKnockoutMatchDecided(prev)) {
      return { team: undefined, code, label, source: "placeholder" };
    }
    if (prev) {
      const winner = getMatchWinnerTeam(prev, matchMap, placeholderMap, predictions, displaySource);
      const resolvedA = resolveSlotTeam(
        prev.team_a,
        slot.fromMatchId,
        matchMap,
        placeholderMap,
        predictions,
        displaySource
      );
      const resolvedB = resolveSlotTeam(
        prev.team_b,
        slot.fromMatchId,
        matchMap,
        placeholderMap,
        predictions,
        displaySource
      );
      if (winner && resolvedA && resolvedB) {
        const loser = winner.id === resolvedA.id ? resolvedB : resolvedA;
        const source: SlotSource =
          isKnockoutMatchDecided(prev) && displaySource === "real"
            ? "confirmed"
            : loser
              ? "predicted"
              : "placeholder";
        return { team: loser, code, label, source };
      }
    }
    return { team: undefined, code, label, source: "placeholder" };
  }

  const team = placeholderMap[code];
  if (displaySource === "real" && team) {
    return { team, code, label, source: "confirmed" };
  }
  const source: SlotSource = team ? "predicted" : "placeholder";
  return { team, code, label, source };
}

function buildTeamSlot(
  resolved: ReturnType<typeof resolveSlotFromDefinition>,
  predicted?: ReturnType<typeof resolveSlotFromDefinition>
): KnockoutTeamSlot {
  const displayTeam = resolved.team;
  const predictedTeam = predicted?.team;
  let isCorrect: boolean | undefined;
  if (displayTeam && predictedTeam) {
    isCorrect = displayTeam.id === predictedTeam.id;
  }

  return {
    placeholderLabel: resolved.label,
    placeholderCode: resolved.code,
    displayTeam,
    predictedTeam,
    source: resolved.source,
    isCorrect,
  };
}

export function resolveKnockoutBracket(input: ResolveKnockoutInput): KnockoutMatchViewModel[] {
  const { knockoutMatches, groupMatches, predictions, allTeams, displaySource } = input;

  const realStandings = computeGroupStandings(groupMatches, predictions, allTeams, "real");
  const predictedStandings = computeGroupStandings(
    groupMatches,
    predictions,
    allTeams,
    "predicted"
  );

  const completedGroups = getCompletedGroups(groupMatches, predictions);
  const officiallyCompleteGroups = getGroupsWithCompleteOfficialResults(groupMatches);

  const collectThirds = (
    standings: Record<GroupId, TeamStats[]>,
    allowedGroups: Set<GroupId>
  ) => {
    const thirds: TeamStats[] = [];
    GROUP_IDS.forEach((gid) => {
      if (!allowedGroups.has(gid)) return;
      const s = standings[gid];
      if (s?.[2]) thirds.push({ ...s[2], groupId: gid });
    });
    return thirds;
  };

  const realThirds = collectThirds(realStandings, officiallyCompleteGroups);
  const predictedThirds = collectThirds(predictedStandings, completedGroups);

  const { map: realMap, assignment: realAssignment } = buildPlaceholderMap(
    realStandings,
    realThirds,
    officiallyCompleteGroups,
    officiallyCompleteGroups
  );
  const { map: predictedMap, assignment: predictedAssignment } = buildPlaceholderMap(
    predictedStandings,
    predictedThirds,
    completedGroups,
    completedGroups
  );

  const matchMap = new Map<number, Match>();
  knockoutMatches.forEach((m) => matchMap.set(m.id, { ...m }));

  const displayMap = displaySource === "real" ? realMap : predictedMap;
  const displayAssignment = displaySource === "real" ? realAssignment : predictedAssignment;

  return knockoutMatches.map((match) => {
    const fixture = getFixtureByMatchId(match.id);
    if (!fixture) {
      return {
        match,
        slotA: {
          placeholderLabel: match.team_a?.name ?? "?",
          placeholderCode: match.team_a?.iso_code ?? "?",
          displayTeam: match.team_a,
          source: "placeholder",
        },
        slotB: {
          placeholderLabel: match.team_b?.name ?? "?",
          placeholderCode: match.team_b?.iso_code ?? "?",
          displayTeam: match.team_b,
          source: "placeholder",
        },
        userPrediction: predictions.find((p) => p.match_id === match.id),
      };
    }

    const resolvedA = resolveSlotFromDefinition(
      fixture.slotA,
      matchMap,
      displayMap,
      predictions,
      displaySource,
      displayAssignment
    );
    const resolvedB = resolveSlotFromDefinition(
      fixture.slotB,
      matchMap,
      displayMap,
      predictions,
      displaySource,
      displayAssignment
    );

    const predA = resolveSlotFromDefinition(
      fixture.slotA,
      matchMap,
      predictedMap,
      predictions,
      "predicted",
      predictedAssignment
    );
    const predB = resolveSlotFromDefinition(
      fixture.slotB,
      matchMap,
      predictedMap,
      predictions,
      "predicted",
      predictedAssignment
    );

    return {
      match,
      slotA: buildTeamSlot(resolvedA, predA),
      slotB: buildTeamSlot(resolvedB, predB),
      userPrediction: predictions.find((p) => p.match_id === match.id),
    };
  });
}

/**
 * Equipo mostrado en cada bando del cruce (octavos → final), en este orden:
 * 1. Ganador oficial si el partido alimentador ya cerró.
 * 2. Pronóstico si el partido sigue abierto y el usuario predijo.
 * 3. Sin equipo → etiqueta del cruce (p. ej. "Ganador partido 89") sin bandera.
 */
function mergeDisplaySlots(
  predSlot: KnockoutTeamSlot,
  realSlot?: KnockoutTeamSlot
): KnockoutTeamSlot {
  const predictedTeam = predSlot.displayTeam;
  const officialTeam =
    realSlot?.source === "confirmed" ? realSlot.displayTeam : undefined;

  const displayTeam = officialTeam ?? predictedTeam;

  const officialTeamHint =
    officialTeam &&
    predictedTeam &&
    officialTeam.id !== predictedTeam.id
      ? predictedTeam
      : undefined;

  const source: SlotSource = officialTeam
    ? "confirmed"
    : predictedTeam
      ? "predicted"
      : "placeholder";

  return {
    placeholderLabel: predSlot.placeholderLabel,
    placeholderCode: predSlot.placeholderCode,
    displayTeam,
    predictedTeam,
    officialTeam: officialTeamHint,
    source,
    isCorrect:
      officialTeam && predictedTeam
        ? officialTeam.id === predictedTeam.id
        : undefined,
  };
}

/** Builds view models: proyección por predicciones; resultado real como respaldo y pista si difiere */
export function buildKnockoutViewModels(
  knockoutMatches: Match[],
  groupMatches: Match[],
  predictions: Prediction[],
  allTeams: Team[]
): KnockoutMatchViewModel[] {
  const predictedVm = resolveKnockoutBracket({
    knockoutMatches,
    groupMatches,
    predictions,
    allTeams,
    displaySource: "predicted",
  });

  const realVm = resolveKnockoutBracket({
    knockoutMatches,
    groupMatches,
    predictions,
    allTeams,
    displaySource: "real",
  });

  const realById = new Map(realVm.map((v) => [v.match.id, v]));

  return predictedVm.map((predVm) => {
    const real = realById.get(predVm.match.id);
    return {
      match: predVm.match,
      slotA: mergeDisplaySlots(predVm.slotA, real?.slotA),
      slotB: mergeDisplaySlots(predVm.slotB, real?.slotB),
      userPrediction: predVm.userPrediction,
    };
  });
}

/** @deprecated Use resolveKnockoutBracket — kept for gradual migration */
export function resolveKnockoutTeams(
  knockoutMatches: Match[],
  allGroupMatches: Match[],
  userPredictions: Prediction[],
  allTeams: Team[]
): Match[] {
  const vms = buildKnockoutViewModels(
    knockoutMatches,
    allGroupMatches,
    userPredictions,
    allTeams
  );
  return vms.map((vm) => ({
    ...vm.match,
    knockout_slot_a_id: vm.match.team_a_id,
    knockout_slot_b_id: vm.match.team_b_id,
    team_a: vm.slotA.displayTeam ?? vm.match.team_a,
    team_b: vm.slotB.displayTeam ?? vm.match.team_b,
    team_a_id: (vm.slotA.displayTeam ?? vm.match.team_a)?.id ?? vm.match.team_a_id,
    team_b_id: (vm.slotB.displayTeam ?? vm.match.team_b)?.id ?? vm.match.team_b_id,
    placeholder_a: vm.slotA.placeholderCode,
    placeholder_b: vm.slotB.placeholderCode,
    is_confirmed_a: vm.slotA.source === "confirmed",
    is_confirmed_b: vm.slotB.source === "confirmed",
  })) as Match[];
}

export { BRACKET_FIXTURES, getDownstreamMatchIds } from "./bracket-fixtures";
