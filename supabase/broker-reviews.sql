CREATE TABLE IF NOT EXISTS public.broker_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  broker_id UUID NOT NULL REFERENCES public.broker_profiles(id) ON DELETE CASCADE,
  rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, broker_id)
);

ALTER TABLE public.broker_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "broker_reviews_select_all" ON public.broker_reviews;
CREATE POLICY "broker_reviews_select_all"
  ON public.broker_reviews FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "broker_reviews_insert_buyer" ON public.broker_reviews;
CREATE POLICY "broker_reviews_insert_buyer"
  ON public.broker_reviews FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'buyer'
    )
  );

DROP POLICY IF EXISTS "broker_reviews_update_own" ON public.broker_reviews;
CREATE POLICY "broker_reviews_update_own"
  ON public.broker_reviews FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.refresh_broker_rating()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_broker UUID;
BEGIN
  target_broker := COALESCE(NEW.broker_id, OLD.broker_id);

  UPDATE public.broker_profiles
  SET
    rating = COALESCE(
      (SELECT ROUND(AVG(rating)::numeric, 2) FROM public.broker_reviews WHERE broker_id = target_broker),
      0
    ),
    updated_at = now()
  WHERE id = target_broker;

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS refresh_broker_rating_trigger ON public.broker_reviews;
CREATE TRIGGER refresh_broker_rating_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.broker_reviews
  FOR EACH ROW EXECUTE FUNCTION public.refresh_broker_rating();

DROP VIEW IF EXISTS public.public_broker_profiles;
CREATE VIEW public.public_broker_profiles
WITH (security_invoker = true)
AS
SELECT
  b.id,
  b.full_name,
  b.company_name,
  b.professional_title,
  b.bio,
  b.city,
  b.state,
  b.phone,
  b.whatsapp,
  b.email,
  b.years_experience,
  b.specialties,
  b.certifications,
  b.rating,
  b.total_sales,
  (
    SELECT COUNT(*)::int
    FROM public.properties p
    WHERE p.broker_id = b.id
      AND p.publication_status = 'published'
      AND p.status = 'activa'
  ) AS active_properties,
  (
    SELECT COUNT(*)::int
    FROM public.broker_reviews r
    WHERE r.broker_id = b.id
  ) AS review_count,
  b.verified,
  b.avatar_url
FROM public.broker_profiles b
WHERE b.verification_status = 'approved';

GRANT SELECT ON public.public_broker_profiles TO anon, authenticated;
