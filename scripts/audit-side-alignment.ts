/**
 * Auditoría de alineación local/visitante (solo lectura).
 * Uso: npx tsx scripts/audit-side-alignment.ts
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

  console.log(`Partidos futuros de grupo invertidos vs FIFA: ${rows.length}\n`);
  if (rows.length === 0) {
    return;
  }

  for (const row of rows) {
    console.log(
      [
        `#${row.matchId} (API ${row.apiFixtureId})`,
        `Grupo ${row.groupId}`,
        `App: ${row.teamAName} vs ${row.teamBName}`,
        `FIFA: ${row.fifaHomeName} vs ${row.fifaAwayName}`,
        `Predicciones: ${row.predictionCount}`,
        row.isLocked ? "cerrado" : "abierto",
        row.hasScore ? "con marcador" : "sin marcador",
      ].join(" · ")
    );
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
