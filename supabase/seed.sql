-- Datos de prueba — ejecutar DESPUÉS de schema.sql (+ migrate-existing.sql si aplica)
-- Borra datos previos de demo (opcional)
DELETE FROM favorites;
DELETE FROM appointments;
DELETE FROM legal_requests;
DELETE FROM user_preferences;
DELETE FROM properties;
DELETE FROM broker_profiles;

-- Brokers demo (sin user_id de auth; solo catálogo)
INSERT INTO broker_profiles (
  id, company_name, professional_title, bio, city, state, phone, whatsapp, email,
  years_experience, specialties, certifications, rating, total_sales, active_properties, verified, avatar_url
) VALUES
(
  'a1111111-1111-1111-1111-111111111101',
  'JC Real Estate Group',
  'Senior Broker Inmobiliario',
  'Especialista en propiedades premium en CDMX y Riviera Maya.',
  'Ciudad de México', 'CDMX', '+52 55 1234 5678', '+52 55 1234 5678', 'cmendoza@jcrealestate.mx',
  15, ARRAY['Lujo', 'Comercial'], ARRAY['AMPI Certificado', 'NAR Member'],
  4.9, 87, 5, true,
  'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400'
),
(
  'a1111111-1111-1111-1111-111111111102',
  'JC Real Estate Group',
  'Asesora Premium — Playa',
  'Experta en frente de mar y desarrollos en el Caribe.',
  'Cancún', 'Quintana Roo', '+52 998 765 4321', '+52 998 765 4321', 'svargas@jcrealestate.mx',
  10, ARRAY['Playa', 'Turismo'], ARRAY['AMPI Certificada'],
  4.8, 62, 4, true,
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400'
),
(
  'a1111111-1111-1111-1111-111111111103',
  'JC Real Estate Group',
  'Director Comercial',
  'Activos comerciales e industriales en el norte del país.',
  'Monterrey', 'Nuevo León', '+52 81 9876 5432', '+52 81 9876 5432', 'ralvarez@jcrealestate.mx',
  12, ARRAY['Edificios', 'Industrial'], ARRAY['AMPI Certificado'],
  4.7, 49, 3, true,
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400'
);

INSERT INTO properties (
  id, broker_id, title, description, category, operation_type, price, location, city, state,
  size_m2, bedrooms, bathrooms, parking_spaces, amenities, images, legal_status, featured
) VALUES
(
  'b2222222-2222-2222-2222-222222222201',
  'a1111111-1111-1111-1111-111111111101',
  'Villa de Lujo en Lomas de Chapultepec',
  'Residencia contemporánea con acabados de primer nivel, alberca y jardín privado.',
  'casa', 'venta', 28500000, 'Lomas de Chapultepec, CDMX', 'Ciudad de México', 'CDMX',
  620, 5, 6, 4,
  ARRAY['Alberca', 'Jardín', 'Domótico'],
  ARRAY['https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1200'],
  'verificada', true
),
(
  'b2222222-2222-2222-2222-222222222202',
  'a1111111-1111-1111-1111-111111111102',
  'Penthouse Frente al Mar — Puerto Vallarta',
  'Vistas panorámicas al Pacífico, terraza privada y acceso a playa.',
  'casa', 'venta', 45000000, 'Puerto Vallarta, Jalisco', 'Puerto Vallarta', 'Jalisco',
  480, 4, 5, 2,
  ARRAY['Terraza', 'Jacuzzi', 'Playa privada'],
  ARRAY['https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200'],
  'verificada', true
),
(
  'b2222222-2222-2222-2222-222222222203',
  'a1111111-1111-1111-1111-111111111102',
  'Terreno Frente al Mar — Tulum',
  'Terreno plano ideal para desarrollo hotelero o residencial de lujo.',
  'terreno', 'venta', 35000000, 'Tulum, Q. Roo', 'Tulum', 'Quintana Roo',
  5000, NULL, NULL, NULL,
  ARRAY['Frente de playa', 'Servicios en límite'],
  ARRAY['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200'],
  'en_revision', true
),
(
  'b2222222-2222-2222-2222-222222222204',
  'a1111111-1111-1111-1111-111111111103',
  'Terreno Industrial — Escobedo',
  'Parque industrial con acceso 24/7 y servicios completos.',
  'terreno', 'venta', 12800000, 'Escobedo, N.L.', 'Escobedo', 'Nuevo León',
  8500, NULL, NULL, NULL,
  ARRAY['Seguridad', 'Gas natural'],
  ARRAY['https://images.unsplash.com/photo-1582407947306-fb827f84e646?w=1200'],
  'verificada', false
),
(
  'b2222222-2222-2222-2222-222222222205',
  'a1111111-1111-1111-1111-111111111101',
  'Torre Corporativa — Reforma',
  'Edificio clase A en Paseo de la Reforma, certificación LEED Gold.',
  'edificio', 'venta', 285000000, 'Paseo de la Reforma, CDMX', 'Ciudad de México', 'CDMX',
  12400, NULL, NULL, 300,
  ARRAY['LEED Gold', 'Lobby de lujo'],
  ARRAY['https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200'],
  'verificada', true
),
(
  'b2222222-2222-2222-2222-222222222206',
  'a1111111-1111-1111-1111-111111111102',
  'Hotel Boutique 5 Estrellas — Riviera Maya',
  '45 suites frente al mar, operación hotelera consolidada.',
  'hotel', 'venta', 180000000, 'Playa del Carmen, Q. Roo', 'Playa del Carmen', 'Quintana Roo',
  3800, NULL, NULL, NULL,
  ARRAY['Spa', 'Marina', 'Restaurante'],
  ARRAY['https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200'],
  'verificada', true
),
(
  'b2222222-2222-2222-2222-222222222207',
  'a1111111-1111-1111-1111-111111111101',
  'Hotel Boutique Eco — San Miguel de Allende',
  '18 habitaciones en centro histórico, arquitectura colonial.',
  'hotel', 'venta', 42000000, 'San Miguel de Allende, Gto.', 'San Miguel de Allende', 'Guanajuato',
  1800, NULL, NULL, NULL,
  ARRAY['Restaurante de autor', 'Jardín colonial'],
  ARRAY['https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=1200'],
  'verificada', false
),
(
  'b2222222-2222-2222-2222-222222222208',
  'a1111111-1111-1111-1111-111111111102',
  'Lote de Playa — Los Cabos',
  'Lote residencial a pasos de la playa en zona hotelera.',
  'playa', 'venta', 8900000, 'Los Cabos, B.C.S.', 'Los Cabos', 'Baja California Sur',
  1200, NULL, NULL, NULL,
  ARRAY['Frente de playa', 'Marina'],
  ARRAY['https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200'],
  'en_revision', false
),
(
  'b2222222-2222-2222-2222-222222222209',
  'a1111111-1111-1111-1111-111111111101',
  'Residencia de Playa — Acapulco Diamante',
  'Residencia con acceso privado a playa y alberca climatizada.',
  'playa', 'renta', 22000000, 'Acapulco Diamante, Gro.', 'Acapulco', 'Guerrero',
  900, 6, 7, 3,
  ARRAY['Playa privada', 'Alberca'],
  ARRAY['https://images.unsplash.com/photo-1499793983690-e29da5ef1c2c?w=1200'],
  'verificada', true
),
(
  'b2222222-2222-2222-2222-222222222210',
  'a1111111-1111-1111-1111-111111111103',
  'Edificio de Departamentos — Polanco',
  '32 departamentos con amenidades de resort en Polanco.',
  'edificio', 'venta', 156000000, 'Polanco, CDMX', 'Ciudad de México', 'CDMX',
  5600, NULL, NULL, NULL,
  ARRAY['Concierge', 'Amenidades resort'],
  ARRAY['https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1200'],
  'verificada', false
);

-- Actualizar contador de propiedades activas por broker
UPDATE broker_profiles b SET active_properties = (
  SELECT COUNT(*)::int FROM properties p WHERE p.broker_id = b.id AND p.status = 'activa'
);
