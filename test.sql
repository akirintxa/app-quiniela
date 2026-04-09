-- 1. Activar RLS en las tablas de Ligas
ALTER TABLE public.pools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pool_members ENABLE ROW LEVEL SECURITY;


 -- POLÍTICAS PARA LA TABLA 'POOLS' (LIGAS)

 -- Permitir que usuarios logueados vean ligas (necesario para unirse mediante código)
 CREATE POLICY "Cualquier usuario logueado puede ver ligas"
 ON public.pools FOR SELECT
    TO authenticated
USING (true);
-- Permitir que cualquier usuario logueado cree su propia liga
CREATE POLICY "Usuarios pueden crear sus propias ligas"
ON public.pools FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = creator_id);
-- Solo el creador puede editar o borrar su liga
CREATE POLICY "Solo el dueño puede modificar su liga"
ON public.pools FOR UPDATE
TO authenticated
USING (auth.uid() = creator_id);
CREATE POLICY "Solo el dueño puede borrar su liga"
ON public.pools FOR DELETE
TO authenticated
USING (auth.uid() = creator_id);
-- POLÍTICAS PARA LA TABLA 'POOL_MEMBERS' (MIEMBROS)
-- Un usuario puede verse a sí mismo y a otros miembros de sus mismas ligas
CREATE POLICY "Ver miembros de mis ligas"
ON public.pool_members FOR SELECT
TO authenticated
USING (true);
-- Un usuario puede unirse a una liga (insertar su propio UID)
CREATE POLICY "Usuarios pueden unirse a ligas"
ON public.pool_members FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);
-- Un usuario puede salirse de una liga
CREATE POLICY "Usuarios pueden salirse de ligas"
ON public.pool_members FOR DELETE
TO authenticated
USING (auth.uid() = user_id);