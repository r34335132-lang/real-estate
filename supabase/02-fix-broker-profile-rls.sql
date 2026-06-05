-- Run this if brokers cannot save their verification profile.
-- It adds the missing RLS policies for broker profile creation and admin review.

ALTER TABLE broker_profiles ENABLE ROW LEVEL SECURITY;

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
