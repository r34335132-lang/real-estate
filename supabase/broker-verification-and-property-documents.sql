-- Broker verification and property review workflow.
-- Run supabase/01-add-buyer-role.sql first, wait for it to finish, then run this file.

ALTER TABLE users ALTER COLUMN role SET DEFAULT 'buyer';

UPDATE users
SET role = 'buyer'
WHERE role::text = 'comprador';

ALTER TABLE broker_profiles
  ADD COLUMN IF NOT EXISTS full_name TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS ampi_number TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS sedetus_number TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS license_type TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS id_document_url TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS verification_status TEXT NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS broker_profiles_user_id_key ON broker_profiles(user_id);

DROP POLICY IF EXISTS "brokers_insert_own" ON broker_profiles;
CREATE POLICY "brokers_insert_own" ON broker_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "brokers_update_own" ON broker_profiles;
CREATE POLICY "brokers_update_own" ON broker_profiles FOR UPDATE
  USING (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin')
  )
  WITH CHECK (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin')
  );

UPDATE broker_profiles
SET verification_status = CASE WHEN COALESCE(verified, false) THEN 'approved' ELSE 'pending' END
WHERE verification_status IS NULL;

ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS publication_status TEXT NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
  ADD COLUMN IF NOT EXISTS legal_disclaimer_accepted BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS documents_completed BOOLEAN NOT NULL DEFAULT false;

UPDATE properties
SET publication_status = CASE
  WHEN status::text = 'activa' THEN 'published'
  ELSE 'draft'
END
WHERE publication_status IS NULL OR publication_status = 'draft';

DROP POLICY IF EXISTS "properties_insert_broker" ON properties;
CREATE POLICY "properties_insert_broker" ON properties FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin')
    OR EXISTS (
      SELECT 1
      FROM broker_profiles b
      WHERE b.id = broker_id
        AND b.user_id = auth.uid()
        AND b.verification_status = 'approved'
        AND publication_status <> 'published'
    )
  );

DROP POLICY IF EXISTS "properties_update_broker" ON properties;
CREATE POLICY "properties_update_broker" ON properties FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin')
    OR EXISTS (SELECT 1 FROM broker_profiles b WHERE b.id = broker_id AND b.user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin')
    OR (
      publication_status <> 'published'
      AND EXISTS (SELECT 1 FROM broker_profiles b WHERE b.id = broker_id AND b.user_id = auth.uid())
    )
  );

CREATE TABLE IF NOT EXISTS property_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL,
  file_url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  rejection_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(property_id, document_type)
);

ALTER TABLE property_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "property_documents_select_involved" ON property_documents;
CREATE POLICY "property_documents_select_involved" ON property_documents FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM properties p
      LEFT JOIN broker_profiles b ON b.id = p.broker_id
      WHERE p.id = property_documents.property_id
        AND (b.user_id = auth.uid() OR EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin'))
    )
  );

DROP POLICY IF EXISTS "property_documents_insert_broker" ON property_documents;
CREATE POLICY "property_documents_insert_broker" ON property_documents FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM properties p
      JOIN broker_profiles b ON b.id = p.broker_id
      WHERE p.id = property_documents.property_id
        AND b.user_id = auth.uid()
        AND b.verification_status = 'approved'
    )
  );

DROP POLICY IF EXISTS "property_documents_update_admin" ON property_documents;
CREATE POLICY "property_documents_update_admin" ON property_documents FOR UPDATE
  USING (EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin'));

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r user_role;
BEGIN
  r := COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'buyer');
  INSERT INTO public.users (id, full_name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.email,
    r
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email,
    role = EXCLUDED.role,
    updated_at = now();
  RETURN NEW;
END;
$$;
