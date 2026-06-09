-- Admin panel, public catalog privacy, and privilege protection.
-- Run after broker-verification-and-property-documents.sql.

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

DROP POLICY IF EXISTS "users_select_all" ON public.users;
DROP POLICY IF EXISTS "users_select_own_or_admin" ON public.users;
CREATE POLICY "users_select_own_or_admin" ON public.users FOR SELECT
  USING (auth.uid() = id OR public.is_admin());

DROP POLICY IF EXISTS "users_update_own" ON public.users;
CREATE POLICY "users_update_own" ON public.users FOR UPDATE
  USING (auth.uid() = id OR public.is_admin())
  WITH CHECK (auth.uid() = id OR public.is_admin());

CREATE OR REPLACE FUNCTION public.protect_user_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role
    AND COALESCE(current_setting('request.jwt.claim.role', true), '') <> 'service_role'
    AND NOT public.is_admin()
  THEN
    RAISE EXCEPTION 'Only administrators can change user roles';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_user_role_trigger ON public.users;
CREATE TRIGGER protect_user_role_trigger
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.protect_user_role();

CREATE OR REPLACE FUNCTION public.protect_broker_verification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (
    NEW.verification_status IS DISTINCT FROM OLD.verification_status
    OR NEW.rejection_reason IS DISTINCT FROM OLD.rejection_reason
    OR NEW.verified IS DISTINCT FROM OLD.verified
  )
    AND COALESCE(current_setting('request.jwt.claim.role', true), '') <> 'service_role'
    AND NOT public.is_admin()
  THEN
    RAISE EXCEPTION 'Only administrators can review brokers';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_broker_verification_trigger ON public.broker_profiles;
CREATE TRIGGER protect_broker_verification_trigger
  BEFORE UPDATE ON public.broker_profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_broker_verification();

DROP POLICY IF EXISTS "brokers_select_all" ON public.broker_profiles;
DROP POLICY IF EXISTS "brokers_select_own_or_admin" ON public.broker_profiles;
CREATE POLICY "brokers_select_own_or_admin" ON public.broker_profiles FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin());

DROP VIEW IF EXISTS public.public_broker_profiles;
CREATE VIEW public.public_broker_profiles
WITH (security_invoker = false)
AS
SELECT
  id,
  full_name,
  company_name,
  professional_title,
  bio,
  city,
  state,
  phone,
  whatsapp,
  email,
  years_experience,
  specialties,
  certifications,
  rating,
  total_sales,
  active_properties,
  verified,
  avatar_url
FROM public.broker_profiles
WHERE verification_status = 'approved';

REVOKE ALL ON public.public_broker_profiles FROM PUBLIC;
GRANT SELECT ON public.public_broker_profiles TO anon, authenticated;

DROP POLICY IF EXISTS "properties_select_all" ON public.properties;
DROP POLICY IF EXISTS "properties_select_published_or_involved" ON public.properties;
CREATE POLICY "properties_select_published_or_involved" ON public.properties FOR SELECT
  USING (
    publication_status = 'published'
    OR public.is_admin()
    OR EXISTS (
      SELECT 1
      FROM public.broker_profiles broker
      WHERE broker.id = properties.broker_id
        AND broker.user_id = auth.uid()
    )
  );

CREATE OR REPLACE FUNCTION public.protect_property_publication()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.publication_status = 'published'
    AND OLD.publication_status IS DISTINCT FROM 'published'
    AND COALESCE(current_setting('request.jwt.claim.role', true), '') <> 'service_role'
    AND NOT public.is_admin()
  THEN
    RAISE EXCEPTION 'Only administrators can publish properties';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_property_publication_trigger ON public.properties;
CREATE TRIGGER protect_property_publication_trigger
  BEFORE UPDATE ON public.properties
  FOR EACH ROW EXECUTE FUNCTION public.protect_property_publication();
