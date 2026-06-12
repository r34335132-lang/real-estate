-- Storage buckets and access policies for Real Estate JC.
-- Public listing photos and avatars expose public URLs.
-- Broker/property documents are private and must be opened with short-lived
-- signed URLs after Storage RLS verifies that the current user is an admin.

INSERT INTO storage.buckets (id, name, public)
VALUES
  ('property-images', 'property-images', true),
  ('avatars', 'avatars', true),
  ('broker-documents', 'broker-documents', false),
  ('property-documents', 'property-documents', false)
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;

DROP POLICY IF EXISTS "property images public read" ON storage.objects;
CREATE POLICY "property images public read"
ON storage.objects FOR SELECT
USING (bucket_id = 'property-images');

DROP POLICY IF EXISTS "avatars public read" ON storage.objects;
CREATE POLICY "avatars public read"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "users upload own property images" ON storage.objects;
CREATE POLICY "users upload own property images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'property-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "users manage own property images" ON storage.objects;
CREATE POLICY "users manage own property images"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'property-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'property-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "users delete own property images" ON storage.objects;
CREATE POLICY "users delete own property images"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'property-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "users upload own avatars" ON storage.objects;
CREATE POLICY "users upload own avatars"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "users manage own avatars" ON storage.objects;
CREATE POLICY "users manage own avatars"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "users delete own avatars" ON storage.objects;
CREATE POLICY "users delete own avatars"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "users upload own broker documents" ON storage.objects;
CREATE POLICY "users upload own broker documents"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'broker-documents'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "users upload own property documents" ON storage.objects;
CREATE POLICY "users upload own property documents"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'property-documents'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "admins read private real estate documents" ON storage.objects;
CREATE POLICY "admins read private real estate documents"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id IN ('broker-documents', 'property-documents')
  AND EXISTS (
    SELECT 1
    FROM public.users u
    WHERE u.id = auth.uid()
      AND u.role = 'admin'
  )
);

DROP POLICY IF EXISTS "users delete own private documents" ON storage.objects;
CREATE POLICY "users delete own private documents"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id IN ('broker-documents', 'property-documents')
  AND (storage.foldername(name))[1] = auth.uid()::text
);
