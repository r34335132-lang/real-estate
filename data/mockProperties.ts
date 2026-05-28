import Images from '@/constants/images';

import { Property, PropertyCategory } from './types';

const now = '2025-05-01T10:00:00Z';

export const MOCK_PROPERTIES: Property[] = [
  {
    id: 'p1',
    broker_id: 'b1',
    title: 'Villa de Lujo en Lomas de Chapultepec',
    description:
      'Espectacular residencia contemporánea con acabados de primer nivel. Amplios espacios, iluminación natural, cocina gourmet y jardín privado con alberca infinity.',
    category: 'casa',
    operation_type: 'venta',
    price: 28500000,
    currency: 'MXN',
    location: 'Lomas de Chapultepec, CDMX',
    city: 'Ciudad de México',
    state: 'CDMX',
    address: 'Av. Presa Falcón 123',
    size_m2: 620,
    bedrooms: 5,
    bathrooms: 6,
    parking_spaces: 4,
    image: Images.casa,
    images: [Images.casa, Images.hero],
    legal_status: 'verificada',
    status: 'activa',
    featured: true,
    verified: true,
    amenities: ['Alberca Infinity', 'Jardín Privado', 'Bodega', 'Roof Garden', 'Domótico'],
    created_at: now,
    updated_at: now,
  },
  {
    id: 'p2',
    broker_id: 'b2',
    title: 'Penthouse Frente al Mar — Puerto Vallarta',
    description:
      'Exclusivo penthouse con vistas panorámicas al Pacífico. Terraza privada de 180m², jacuzzi exterior y acceso directo a playa privada.',
    category: 'casa',
    operation_type: 'venta',
    price: 45000000,
    currency: 'MXN',
    location: 'Puerto Vallarta, Jalisco',
    city: 'Puerto Vallarta',
    state: 'Jalisco',
    address: 'Zona Hotelera Norte',
    size_m2: 480,
    bedrooms: 4,
    bathrooms: 5,
    parking_spaces: 2,
    image: Images.hero,
    images: [Images.hero, Images.casa, Images.terreno],
    legal_status: 'verificada',
    status: 'activa',
    featured: true,
    verified: true,
    amenities: ['Terraza Privada 180m²', 'Jacuzzi', 'Playa Privada', 'Concierge 24/7'],
    created_at: now,
    updated_at: now,
  },
  {
    id: 'p3',
    broker_id: 'b2',
    title: 'Terreno Exclusivo Frente al Mar — Tulum',
    description:
      'Terreno plano en zona virgen de la Riviera Maya. Ideal para desarrollo hotelero o residencial de lujo.',
    category: 'terreno',
    operation_type: 'venta',
    price: 35000000,
    currency: 'MXN',
    location: 'Tulum, Quintana Roo',
    city: 'Tulum',
    state: 'Quintana Roo',
    address: 'Zona Hotelera',
    size_m2: 5000,
    image: Images.terreno,
    images: [Images.terreno, Images.hotel],
    legal_status: 'en_revision',
    status: 'activa',
    featured: true,
    verified: true,
    amenities: ['Frente de Playa 50m', 'Servicios en Límite', 'Acceso Carretero'],
    created_at: now,
    updated_at: now,
  },
  {
    id: 'p4',
    broker_id: 'b3',
    title: 'Terreno Industrial — Escobedo NL',
    description: 'Terreno en parque industrial de primer nivel. Ideal para nave industrial o centro de distribución.',
    category: 'terreno',
    operation_type: 'venta',
    price: 12800000,
    currency: 'MXN',
    location: 'Escobedo, Nuevo León',
    city: 'Escobedo',
    state: 'Nuevo León',
    address: 'Parque Industrial',
    size_m2: 8500,
    image: Images.edificio,
    images: [Images.edificio],
    legal_status: 'verificada',
    status: 'activa',
    featured: false,
    verified: true,
    amenities: ['Acceso 24/7', 'Seguridad Perimetral', 'Gas Natural'],
    created_at: now,
    updated_at: now,
  },
  {
    id: 'p5',
    broker_id: 'b1',
    title: 'Torre Corporativa — Paseo de la Reforma',
    description: 'Imponente edificio de usos mixtos con 22 pisos en la icónica Avenida Reforma. Certificación LEED Gold.',
    category: 'edificio',
    operation_type: 'venta',
    price: 285000000,
    currency: 'MXN',
    location: 'Paseo de la Reforma, CDMX',
    city: 'Ciudad de México',
    state: 'CDMX',
    address: 'Paseo de la Reforma 500',
    size_m2: 12400,
    image: Images.edificio,
    images: [Images.edificio, Images.hero],
    legal_status: 'verificada',
    status: 'activa',
    featured: true,
    verified: true,
    amenities: ['LEED Gold', 'Lobby de Lujo', 'Azotea Verde', 'Data Center'],
    created_at: now,
    updated_at: now,
  },
  {
    id: 'p6',
    broker_id: 'b2',
    title: 'Hotel Boutique 5 Estrellas — Riviera Maya',
    description: 'Propiedad hotelera de 45 suites frente al mar. Operando al 85% de ocupación anual.',
    category: 'hotel',
    operation_type: 'venta',
    price: 180000000,
    currency: 'MXN',
    location: 'Playa del Carmen, Q. Roo',
    city: 'Playa del Carmen',
    state: 'Quintana Roo',
    address: 'Zona Centro',
    size_m2: 3800,
    image: Images.hotel,
    images: [Images.hotel, Images.terreno],
    legal_status: 'verificada',
    status: 'activa',
    featured: true,
    verified: true,
    amenities: ['45 Suites', 'Spa', 'Marina Privada', 'Restaurante'],
    created_at: now,
    updated_at: now,
  },
  {
    id: 'p7',
    broker_id: 'b1',
    title: 'Hotel Boutique Eco — San Miguel de Allende',
    description: 'Encantador hotel boutique de 18 habitaciones en el corazón histórico.',
    category: 'hotel',
    operation_type: 'venta',
    price: 42000000,
    currency: 'MXN',
    location: 'San Miguel de Allende, Gto.',
    city: 'San Miguel de Allende',
    state: 'Guanajuato',
    address: 'Centro Histórico',
    size_m2: 1800,
    image: Images.casa,
    images: [Images.casa, Images.hotel],
    legal_status: 'verificada',
    status: 'activa',
    featured: false,
    verified: true,
    amenities: ['18 Habitaciones', 'Restaurante de Autor', 'Jardín Colonial'],
    created_at: now,
    updated_at: now,
  },
  {
    id: 'p8',
    broker_id: 'b2',
    title: 'Lote de Playa — Los Cabos',
    description: 'Privilegiado lote residencial a pasos de la playa en Los Cabos.',
    category: 'playa',
    operation_type: 'venta',
    price: 8900000,
    currency: 'MXN',
    location: 'Los Cabos, B.C.S.',
    city: 'Los Cabos',
    state: 'Baja California Sur',
    address: 'Zona Hotelera',
    size_m2: 1200,
    image: Images.terreno,
    images: [Images.terreno, Images.hotel],
    legal_status: 'en_revision',
    status: 'activa',
    featured: false,
    verified: false,
    amenities: ['Frente de Playa', 'Club de Golf', 'Marina'],
    created_at: now,
    updated_at: now,
  },
  {
    id: 'p9',
    broker_id: 'b1',
    title: 'Residencia de Playa — Acapulco Diamante',
    description: 'Majestuosa residencia en la zona Diamante con acceso privado a playa.',
    category: 'playa',
    operation_type: 'renta',
    price: 22000000,
    currency: 'MXN',
    location: 'Acapulco Diamante, Guerrero',
    city: 'Acapulco',
    state: 'Guerrero',
    address: 'Diamante',
    size_m2: 900,
    bedrooms: 6,
    bathrooms: 7,
    parking_spaces: 3,
    image: Images.hero,
    images: [Images.hero, Images.terreno],
    legal_status: 'verificada',
    status: 'activa',
    featured: true,
    verified: true,
    amenities: ['Acceso Playa Privada', 'Alberca Climatizada', 'Bodega de Vinos'],
    created_at: now,
    updated_at: now,
  },
  {
    id: 'p10',
    broker_id: 'b3',
    title: 'Edificio de Departamentos — Polanco',
    description: 'Edificio residencial de 8 pisos con 32 departamentos en Polanco.',
    category: 'edificio',
    operation_type: 'venta',
    price: 156000000,
    currency: 'MXN',
    location: 'Polanco, CDMX',
    city: 'Ciudad de México',
    state: 'CDMX',
    address: 'Polanco',
    size_m2: 5600,
    image: Images.edificio,
    images: [Images.edificio, Images.casa],
    legal_status: 'verificada',
    status: 'activa',
    featured: false,
    verified: true,
    amenities: ['32 Departamentos', 'Amenidades Resort', 'Concierge'],
    created_at: now,
    updated_at: now,
  },
];

/** Alias PROPERTIES para compatibilidad — mapea campos legacy */
export const PROPERTIES = MOCK_PROPERTIES.map((p) => ({
  ...p,
  brokerId: p.broker_id,
  priceUnit: p.currency,
  status: p.operation_type,
  area: p.size_m2,
  legalStatus: legalStatusLabel(p.legal_status),
}));

export type LegacyProperty = (typeof PROPERTIES)[number];

function legalStatusLabel(s: Property['legal_status']): string {
  const map: Record<Property['legal_status'], string> = {
    pendiente: 'Documentación pendiente',
    en_revision: 'En revisión legal',
    verificada: 'Escritura verificada',
    rechazada: 'Rechazada',
  };
  return map[s];
}

export function getPropertyById(id: string): LegacyProperty | undefined {
  return PROPERTIES.find((p) => p.id === id);
}

export function getPropertiesByCategory(category: PropertyCategory): LegacyProperty[] {
  return PROPERTIES.filter((p) => p.category === category);
}

export function getFeaturedProperties(): LegacyProperty[] {
  return PROPERTIES.filter((p) => p.featured);
}

export function getPropertiesByBroker(brokerId: string): LegacyProperty[] {
  return PROPERTIES.filter((p) => p.broker_id === brokerId || p.brokerId === brokerId);
}

export function getVerifiedLegalProperties(): LegacyProperty[] {
  return PROPERTIES.filter((p) => p.legal_status === 'verificada' && p.verified);
}

export function getRecommendedProperties(
  category?: PropertyCategory,
  operationType?: Property['operation_type'],
  budgetMax?: number | null,
): LegacyProperty[] {
  let list = [...PROPERTIES];
  if (category) {
    list = list.filter((p) => p.category === category);
  }
  if (operationType) {
    list = list.filter((p) => p.operation_type === operationType);
  }
  if (budgetMax) {
    list = list.filter((p) => p.price <= budgetMax);
  }
  const featured = list.filter((p) => p.featured);
  const rest = list.filter((p) => !p.featured);
  return [...featured, ...rest];
}
