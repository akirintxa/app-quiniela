import type { SupabaseClient } from "@supabase/supabase-js";
import {
  finalizeMatchSync,
  startMatchSync,
  updateLiveScoreSync,
} from "@/lib/match-sync";
import {
  fetchWorldCup26Games,
  isExternalFinished,
  isExternalNotStarted,
  type WorldCup26Game,
} from "@/lib/score-providers/worldcup26";
import {
  findDbMatchForExternalGame,
  type DbMatchWithTeams,
} from "@/lib/score-providers/find-external-match";
import { mapExternalScoresToMatchSides } from "@/lib/score-providers/map-external-scores";

type ServiceSupabase = SupabaseClient;

export type ScoreSyncResult = {
  ok: boolean;
  disabled?: boolean;
  started: number;
  updated: number;
  finalized: number;
  skipped: number;
  penaltiesPending: number;
  errors: string[];
  actions?: string[];
};

type SyncAction =
  | "started"
  | "updated"
  | "finalized"
  | "skipped"
  | "penalties_pending";

async function syncOneMatch(
  supabase: ServiceSupabase,
  game: WorldCup26Game,
  dbMatch: DbMatchWithTeams
): Promise<SyncAction | { error: string }> {
  const matchId = dbMatch.id;

  if (dbMatch.is_finished) {
    return "skipped";
  }

  if (isExternalNotStarted(game)) {
    return "skipped";
  }

  const { resultA: scoreA, resultB: scoreB } = mapExternalScoresToMatchSides(
    game,
    dbMatch.team_a?.name,
    dbMatch.team_b?.name
  );

  if (scoreA === null || scoreB === null) {
    if (dbMatch.result_a === null && dbMatch.result_b === null) {
      const result = await startMatchSync(supabase, matchId);
      if (!result.ok) {
        return { error: result.error };
      }
      return result.skipped ? "skipped" : "started";
    }
    return "skipped";
  }

  const sameScore =
    dbMatch.result_a === scoreA && dbMatch.result_b === scoreB;
  const isKnockout = dbMatch.stage !== "group";

  if (isExternalFinished(game)) {
    if (isKnockout && scoreA === scoreB) {
      if (!sameScore) {
        const result = await updateLiveScoreSync(
          supabase,
          matchId,
          scoreA,
          scoreB,
          null
        );
        if (!result.ok) {
          return { error: result.error };
        }
        return "penalties_pending";
      }
      return "penalties_pending";
    }

    if (sameScore && dbMatch.is_finished) {
      return "skipped";
    }

    const result = await finalizeMatchSync(
      supabase,
      matchId,
      scoreA,
      scoreB,
      null
    );
    if (!result.ok) {
      if (
        isKnockout &&
        scoreA === scoreB &&
        result.error.includes("penales")
      ) {
        return "penalties_pending";
      }
      return { error: result.error };
    }
    return result.skipped ? "skipped" : "finalized";
  }

  if (sameScore) {
    return "skipped";
  }

  if (
    dbMatch.result_a === null &&
    dbMatch.result_b === null &&
    scoreA === 0 &&
    scoreB === 0
  ) {
    const result = await startMatchSync(supabase, matchId);
    if (!result.ok) {
      return { error: result.error };
    }
    return result.skipped ? "skipped" : "started";
  }

  const result = await updateLiveScoreSync(
    supabase,
    matchId,
    scoreA,
    scoreB,
    null
  );
  if (!result.ok) {
    return { error: result.error };
  }
  return result.skipped ? "skipped" : "updated";
}

export function isAutoScoreSyncEnabled(): boolean {
  const flag = process.env.AUTO_SCORE_SYNC?.trim().toLowerCase();
  return flag === "true" || flag === "1" || flag === "yes";
}

export async function runExternalScoreSync(
  supabase: ServiceSupabase
): Promise<ScoreSyncResult> {
  if (!isAutoScoreSyncEnabled()) {
    return {
      ok: true,
      disabled: true,
      started: 0,
      updated: 0,
      finalized: 0,
      skipped: 0,
      penaltiesPending: 0,
      errors: [],
    };
  }

  const games = await fetchWorldCup26Games();
  if (games.length === 0) {
    return {
      ok: true,
      started: 0,
      updated: 0,
      finalized: 0,
      skipped: 0,
      penaltiesPending: 0,
      errors: [],
    };
  }

  const { data: matches, error } = await supabase
    .from("matches")
    .select(`*, team_a:teams!team_a_id(name), team_b:teams!team_b_id(name)`)
    .eq("is_finished", false);

  if (error) {
    return {
      ok: false,
      started: 0,
      updated: 0,
      finalized: 0,
      skipped: 0,
      penaltiesPending: 0,
      errors: [error.message],
    };
  }

  const result: ScoreSyncResult = {
    ok: true,
    started: 0,
    updated: 0,
    finalized: 0,
    skipped: 0,
    penaltiesPending: 0,
    errors: [],
    actions: [],
  };

  const MAX_ACTIONS = 25;
  const dbMatches = (matches ?? []) as DbMatchWithTeams[];
  const syncedDbIds = new Set<number>();

  for (const game of games) {
    const dbMatch = findDbMatchForExternalGame(game, dbMatches);
    if (!dbMatch || syncedDbIds.has(dbMatch.id)) continue;
    syncedDbIds.add(dbMatch.id);

    const apiId = game.id;
    const actionLabel = (suffix: string) =>
      apiId !== String(dbMatch.id)
        ? `#${dbMatch.id}(api:${apiId}) ${suffix}`
        : `#${dbMatch.id} ${suffix}`;

    try {
      const action = await syncOneMatch(supabase, game, dbMatch);
      if (typeof action === "object" && "error" in action) {
        result.errors.push(`Partido ${dbMatch.id}: ${action.error}`);
        if (result.actions!.length < MAX_ACTIONS) {
          result.actions!.push(actionLabel("error"));
        }
        continue;
      }

      if (action !== "skipped" && result.actions!.length < MAX_ACTIONS) {
        result.actions!.push(actionLabel(action));
      }

      switch (action) {
        case "started":
          result.started += 1;
          break;
        case "updated":
          result.updated += 1;
          break;
        case "finalized":
          result.finalized += 1;
          break;
        case "penalties_pending":
          result.penaltiesPending += 1;
          break;
        default:
          result.skipped += 1;
      }
    } catch (e) {
      result.errors.push(
        `Partido ${dbMatch.id}: ${e instanceof Error ? e.message : "error desconocido"}`
      );
    }
  }

  result.ok = result.errors.length === 0;
  return result;
}
