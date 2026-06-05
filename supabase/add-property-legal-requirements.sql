ALTER TABLE properties ADD COLUMN IF NOT EXISTS has_public_deed boolean default false;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS has_no_lien_certificate boolean default false;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS has_cadastral_certificate boolean default false;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS has_plans boolean default false;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS seller_registry_type text;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS seller_registry_number text;
