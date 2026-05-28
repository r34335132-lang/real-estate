-- Ejecutar en Supabase SQL Editor si ya tenías el schema sin esta política
CREATE POLICY "users_insert_own" ON users FOR INSERT WITH CHECK (auth.uid() = id);
