ALTER TABLE public.properties
  ALTER COLUMN title DROP NOT NULL,
  ALTER COLUMN category DROP NOT NULL,
  ALTER COLUMN operation_type DROP NOT NULL,
  ALTER COLUMN price DROP NOT NULL;

ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS admin_observation TEXT,
  ADD COLUMN IF NOT EXISTS has_incomplete_documentation BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS published_with_observation BOOLEAN NOT NULL DEFAULT false;

UPDATE public.properties
SET has_incomplete_documentation = NOT COALESCE(documents_completed, false)
WHERE publication_status IN ('draft', 'pending_review', 'rejected');

DROP POLICY IF EXISTS "properties_insert_broker" ON public.properties;
CREATE POLICY "properties_insert_broker"
  ON public.properties FOR INSERT
  WITH CHECK (
    public.is_admin()
    OR EXISTS (
      SELECT 1
      FROM public.broker_profiles b
      WHERE b.id = broker_id
        AND b.user_id = auth.uid()
        AND (
          publication_status = 'draft'
          OR (
            b.verification_status = 'approved'
            AND publication_status <> 'published'
          )
        )
    )
  );

DROP POLICY IF EXISTS "property_documents_insert_broker" ON public.property_documents;
CREATE POLICY "property_documents_insert_broker"
  ON public.property_documents FOR INSERT
  WITH CHECK (
    public.is_admin()
    OR EXISTS (
      SELECT 1
      FROM public.properties p
      JOIN public.broker_profiles b ON b.id = p.broker_id
      WHERE p.id = property_documents.property_id
        AND b.user_id = auth.uid()
    )
  );

CREATE OR REPLACE FUNCTION public.validate_property_observation()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.published_with_observation
    AND (
      NEW.publication_status <> 'published'
      OR NULLIF(trim(NEW.admin_observation), '') IS NULL
    )
  THEN
    RAISE EXCEPTION 'Published properties with incomplete documentation require an admin observation';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_property_observation_trigger ON public.properties;
CREATE TRIGGER validate_property_observation_trigger
  BEFORE INSERT OR UPDATE ON public.properties
  FOR EACH ROW EXECUTE FUNCTION public.validate_property_observation();
