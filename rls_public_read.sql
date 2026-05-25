-- Políticas de lectura pública para partidos y equipos (usuarios autenticados)
-- Ejecutar en Supabase si las tablas tienen RLS activado y la app no muestra datos.

ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.predictions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can read teams" ON public.teams;
CREATE POLICY "Authenticated users can read teams"
ON public.teams FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Authenticated users can read matches" ON public.matches;
CREATE POLICY "Authenticated users can read matches"
ON public.matches FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Users manage own predictions" ON public.predictions;
CREATE POLICY "Users manage own predictions"
ON public.predictions FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
