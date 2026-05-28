-- Real Estate JC — Supabase (ejecutar en SQL Editor)
-- Requiere Auth habilitado en el proyecto

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('admin', 'broker', 'abogado', 'comprador', 'invitado');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE property_category AS ENUM ('terreno', 'casa', 'edificio', 'hotel', 'playa');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE operation_type AS ENUM ('venta', 'renta');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE legal_status AS ENUM ('pendiente', 'en_revision', 'verificada', 'rechazada');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE listing_status AS ENUM ('activa', 'vendida', 'pausada');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Perfil vinculado a auth.users
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  email TEXT,
  phone TEXT DEFAULT '',
  avatar_url TEXT,
  role user_role NOT NULL DEFAULT 'comprador',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS broker_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  company_name TEXT DEFAULT 'JC Real Estate Group',
  professional_title TEXT DEFAULT 'Broker Inmobiliario',
  bio TEXT DEFAULT '',
  city TEXT DEFAULT '',
  state TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  whatsapp TEXT DEFAULT '',
  email TEXT DEFAULT '',
  years_experience INT DEFAULT 0,
  specialties TEXT[] DEFAULT '{}',
  certifications TEXT[] DEFAULT '{}',
  rating NUMERIC(3,2) DEFAULT 4.8,
  total_sales INT DEFAULT 0,
  active_properties INT DEFAULT 0,
  verified BOOLEAN DEFAULT false,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  broker_id UUID REFERENCES broker_profiles(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  category property_category NOT NULL,
  operation_type operation_type NOT NULL,
  price NUMERIC NOT NULL,
  currency TEXT DEFAULT 'MXN',
  location TEXT DEFAULT '',
  city TEXT DEFAULT '',
  state TEXT DEFAULT '',
  address TEXT DEFAULT '',
  size_m2 NUMERIC DEFAULT 0,
  bedrooms INT,
  bathrooms INT,
  parking_spaces INT,
  amenities TEXT[] DEFAULT '{}',
  images TEXT[] DEFAULT '{}',
  legal_status legal_status DEFAULT 'pendiente',
  status listing_status DEFAULT 'activa',
  featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  interested_category property_category,
  operation_type operation_type,
  preferred_location TEXT DEFAULT '',
  budget_min NUMERIC,
  budget_max NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, property_id)
);

CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  broker_id UUID REFERENCES broker_profiles(id),
  date DATE NOT NULL,
  time TIME NOT NULL,
  status TEXT DEFAULT 'pendiente',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS legal_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  property_id UUID REFERENCES properties(id),
  lawyer_id UUID REFERENCES users(id),
  request_type TEXT NOT NULL,
  status TEXT DEFAULT 'pendiente',
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Trigger: crear fila en users al registrarse
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r user_role;
BEGIN
  r := COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'comprador');
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

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE broker_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE legal_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_select_all" ON users FOR SELECT USING (true);
CREATE POLICY "users_insert_own" ON users FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "users_update_own" ON users FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "brokers_select_all" ON broker_profiles FOR SELECT USING (true);
CREATE POLICY "brokers_update_own" ON broker_profiles FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "properties_select_all" ON properties FOR SELECT USING (true);
CREATE POLICY "properties_insert_broker" ON properties FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role IN ('broker', 'admin'))
  );
CREATE POLICY "properties_update_broker" ON properties FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role IN ('broker', 'admin'))
  );

CREATE POLICY "prefs_select_own" ON user_preferences FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "prefs_upsert_own" ON user_preferences FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "favorites_own" ON favorites FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "appointments_select_own" ON appointments FOR SELECT
  USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role IN ('broker', 'admin')));
CREATE POLICY "appointments_insert_buyer" ON appointments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "legal_select_involved" ON legal_requests FOR SELECT
  USING (
    auth.uid() = user_id OR auth.uid() = lawyer_id
    OR EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin')
  );
CREATE POLICY "legal_insert" ON legal_requests FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Si ya ejecutaste una versión anterior del schema, aplica columnas nuevas:
-- (también puedes ejecutar solo migrate-existing.sql)
-- ---------------------------------------------------------------------------
ALTER TABLE broker_profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE broker_profiles ADD COLUMN IF NOT EXISTS whatsapp TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT false;
