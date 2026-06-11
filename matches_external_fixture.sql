-- Columnas para vincular partidos con API-Football (api-sports.io)
ALTER TABLE matches
  ADD COLUMN IF NOT EXISTS external_fixture_id TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_matches_external_fixture_id
  ON matches (external_fixture_id)
  WHERE external_fixture_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_matches_sync_window
  ON matches (start_time, is_finished)
  WHERE is_finished = false;
