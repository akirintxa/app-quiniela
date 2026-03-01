-- 1. Eliminar políticas antiguas para evitar conflictos
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- 2. Crear política de lectura: Todo el mundo puede ver los nicknames
CREATE POLICY "Public profiles are viewable by everyone"
    7 ON profiles FOR SELECT USING (true);
CREATE POLICY "Public profiles are viewable by everyone"
ON profiles FOR SELECT USING (true);
-- 3. Crear política de escritura: Un usuario puede insertar/actualizar SU PROPIO perfil
CREATE POLICY "Users can manage own profile"
ON profiles FOR ALL
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);