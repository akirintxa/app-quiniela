-- Políticas RLS para ligas privadas (pools / pool_members)
-- Ejecutar en Supabase SQL Editor si ves:
--   "new row violates row-level security policy for table pools"
--
-- Requiere también src/proxy.ts (sesión JWT en server actions).

ALTER TABLE public.pools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pool_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Cualquier usuario logueado puede ver ligas" ON public.pools;
CREATE POLICY "Cualquier usuario logueado puede ver ligas"
ON public.pools FOR SELECT
TO authenticated
USING (true);

-- Invitaciones /join/{código} sin sesión: ejecutar pool_invite_public.sql (RPC)
-- o configurar SUPABASE_SERVICE_ROLE_KEY en el servidor (Vercel).

DROP POLICY IF EXISTS "Usuarios pueden crear sus propias ligas" ON public.pools;
CREATE POLICY "Usuarios pueden crear sus propias ligas"
ON public.pools FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = creator_id);

DROP POLICY IF EXISTS "Solo el dueño puede modificar su liga" ON public.pools;
CREATE POLICY "Solo el dueño puede modificar su liga"
ON public.pools FOR UPDATE
TO authenticated
USING (auth.uid() = creator_id);

DROP POLICY IF EXISTS "Solo el dueño puede borrar su liga" ON public.pools;
CREATE POLICY "Solo el dueño puede borrar su liga"
ON public.pools FOR DELETE
TO authenticated
USING (auth.uid() = creator_id);

DROP POLICY IF EXISTS "Ver miembros de mis ligas" ON public.pool_members;
CREATE POLICY "Ver miembros de mis ligas"
ON public.pool_members FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Usuarios pueden unirse a ligas" ON public.pool_members;
CREATE POLICY "Usuarios pueden unirse a ligas"
ON public.pool_members FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuarios pueden salirse de ligas" ON public.pool_members;
DROP POLICY IF EXISTS "Creador puede expulsar miembros" ON public.pool_members;
DROP POLICY IF EXISTS "Admin de liga puede expulsar miembros" ON public.pool_members;

CREATE POLICY "Usuarios pueden salirse de ligas"
ON public.pool_members FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Creador puede expulsar miembros"
ON public.pool_members FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.pools p
    WHERE p.id = pool_members.pool_id
      AND p.creator_id = auth.uid()
  )
  AND pool_members.user_id <> auth.uid()
);

CREATE POLICY "Admin de liga puede expulsar miembros"
ON public.pool_members FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.pool_members pm
    WHERE pm.pool_id = pool_members.pool_id
      AND pm.user_id = auth.uid()
      AND pm.role = 'admin'
  )
  AND pool_members.user_id <> auth.uid()
);
