-- Permite que /join/{código} muestre la liga sin estar logueado.
-- Alternativa: la app usa SUPABASE_SERVICE_ROLE_KEY en servidor para la vista previa.
-- Ejecutar en Supabase → SQL Editor si no usas service role en Vercel.

CREATE OR REPLACE FUNCTION public.get_pool_invite_preview(p_invite_code text)
RETURNS TABLE (id int, name text, invite_code text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id, p.name, p.invite_code
  FROM public.pools p
  WHERE upper(trim(p.invite_code)) = upper(trim(p_invite_code))
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_pool_invite_preview(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_pool_invite_preview(text) TO anon, authenticated;
