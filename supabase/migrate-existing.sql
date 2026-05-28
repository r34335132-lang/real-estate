-- Ejecuta ESTO si ya creaste las tablas antes y falla el seed por columnas faltantes
-- Seguro de ejecutar varias veces (idempotente)

ALTER TABLE broker_profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE broker_profiles ADD COLUMN IF NOT EXISTS whatsapp TEXT;
ALTER TABLE broker_profiles ADD COLUMN IF NOT EXISTS specialties TEXT[] DEFAULT '{}';
ALTER TABLE broker_profiles ADD COLUMN IF NOT EXISTS certifications TEXT[] DEFAULT '{}';

ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT DEFAULT '';

ALTER TABLE properties ADD COLUMN IF NOT EXISTS parking_spaces INT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT false;
