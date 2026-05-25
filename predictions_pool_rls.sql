-- Permite a miembros de una misma liga leer las predicciones de sus compañeros.
-- Ejecutar en Supabase SQL Editor si el ojito de liga solo muestra tu predicción.

ALTER TABLE public.predictions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own predictions" ON public.predictions;
DROP POLICY IF EXISTS "Users read own and pool mate predictions" ON public.predictions;
DROP POLICY IF EXISTS "Users insert own predictions" ON public.predictions;
DROP POLICY IF EXISTS "Users update own predictions" ON public.predictions;
DROP POLICY IF EXISTS "Users delete own predictions" ON public.predictions;

CREATE POLICY "Users read own and pool mate predictions"
ON public.predictions FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1
    FROM public.pool_members pm_me
    INNER JOIN public.pool_members pm_other
      ON pm_me.pool_id = pm_other.pool_id
    WHERE pm_me.user_id = auth.uid()
      AND pm_other.user_id = predictions.user_id
  )
);

CREATE POLICY "Users insert own predictions"
ON public.predictions FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own predictions"
ON public.predictions FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own predictions"
ON public.predictions FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
