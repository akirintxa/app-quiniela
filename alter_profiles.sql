-- Columnas de perfil usadas por la app (ejecutar una vez en Supabase)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS avatar_url TEXT,
  ADD COLUMN IF NOT EXISTS favorite_team_id INT REFERENCES public.teams(id);

-- Opcional: refresca relaciones en PostgREST (Settings → API → Reload schema)
-- La app ya no depende del join embebido teams:favorite_team_id
