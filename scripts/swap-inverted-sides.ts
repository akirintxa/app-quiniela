/**
 * Invierte partidos futuros de grupo detectados como invertidos vs FIFA.
 * Uso: npx tsx scripts/swap-inverted-sides.ts
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function loadEnvLocal() {
  try {
    const raw = readFileSync(resolve(process.cwd(), ".env.local"), "utf8");
    for (const line of raw.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let val = trimmed.slice(eq + 1).trim();
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = val;
    }
  } catch {
    // optional
  }
}

async function main() {
  loadEnvLocal();

  const { createClient } = await import("@supabase/supabase-js");
  const { auditInvertedFutureGroupMatches } = await import(
    "../src/lib/match-side-alignment-server"
  );
  const { swapMatchSidesSync } = await import("../src/lib/match-sync");

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error(
      "Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local"
    );
    process.exit(1);
  }

  const supabase = createClient(url, key);
  const rows = await auditInvertedFutureGroupMatches(supabase);

  console.log(`Partidos a invertir: ${rows.length}\n`);
  if (rows.length === 0) {
    console.log("Nada que hacer.");
    return;
  }

  const errors: string[] = [];
  let swapped = 0;

  for (const row of rows) {
    const result = await swapMatchSidesSync(supabase, row.matchId);
    if (!result.ok) {
      const msg = `#${row.matchId}: ${result.error}`;
      errors.push(msg);
      console.error(`ERROR ${msg}`);
    } else {
      swapped += 1;
      console.log(
        `OK #${row.matchId} (API ${row.apiFixtureId}) · ${row.teamAName} vs ${row.teamBName} · ${row.predictionCount} predicciones`
      );
    }
  }

  console.log(`\nInvertidos: ${swapped}/${rows.length}`);
  if (errors.length > 0) {
    console.error(`Errores (${errors.length}):\n${errors.join("\n")}`);
    process.exit(1);
  }

  const remaining = await auditInvertedFutureGroupMatches(supabase);
  console.log(`Pendientes tras swap: ${remaining.length}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
