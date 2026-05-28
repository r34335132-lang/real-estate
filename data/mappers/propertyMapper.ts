import Images from '@/constants/images';

import type { Property } from '@/data/mock';
import type { ImageAsset, LegalStatus, PropertyCategory } from '@/data/types';

const CATEGORY_FALLBACK: Record<PropertyCategory, ImageAsset> = {
  terreno: Images.terreno,
  casa: Images.casa,
  edificio: Images.edificio,
  hotel: Images.hotel,
  playa: Images.terreno,
};

const LEGAL_LABELS: Record<LegalStatus, string> = {
  pendiente: 'Documentación pendiente',
  en_revision: 'En revisión legal',
  verificada: 'Escritura verificada',
  rechazada: 'Rechazada',
};

export interface DbProperty {
  id: string;
  broker_id: string | null;
  title: string;
  description: string | null;
  category: PropertyCategory;
  operation_type: 'venta' | 'renta';
  price: number;
  currency: string | null;
  location: string | null;
  city: string | null;
  state: string | null;
  address: string | null;
  size_m2: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  parking_spaces: number | null;
  amenities: string[] | null;
  images: string[] | null;
  legal_status: LegalStatus;
  status: string;
  featured: boolean | null;
}

function toImageSource(url: string | undefined, category: PropertyCategory): ImageAsset {
  if (url && (url.startsWith('http') || url.startsWith('https'))) {
    return { uri: url };
  }
  return CATEGORY_FALLBACK[category];
}

export function mapDbProperty(row: DbProperty): Property {
  const urls = row.images?.filter(Boolean) ?? [];
  const primary = toImageSource(urls[0], row.category);
  const gallery =
    urls.length > 0
      ? urls.map((u) => toImageSource(u, row.category))
      : [primary];

  return {
    id: row.id,
    broker_id: row.broker_id ?? '',
    brokerId: row.broker_id ?? '',
    title: row.title,
    description: row.description ?? '',
    category: row.category,
    operation_type: row.operation_type,
    status: row.operation_type,
    price: Number(row.price),
    currency: row.currency ?? 'MXN',
    priceUnit: row.currency ?? 'MXN',
    location: row.location ?? `${row.city ?? ''}, ${row.state ?? ''}`,
    city: row.city ?? '',
    state: row.state ?? '',
    address: row.address ?? '',
    size_m2: Number(row.size_m2 ?? 0),
    area: Number(row.size_m2 ?? 0),
    bedrooms: row.bedrooms ?? undefined,
    bathrooms: row.bathrooms ?? undefined,
    parking_spaces: row.parking_spaces ?? undefined,
    amenities: row.amenities ?? [],
    images: gallery,
    image: primary,
    legal_status: row.legal_status,
    legalStatus: LEGAL_LABELS[row.legal_status],
    status_legacy: row.operation_type,
    featured: Boolean(row.featured),
    verified: row.legal_status === 'verificada',
    created_at: '',
    updated_at: '',
  };
}

export interface DbBroker {
  id: string;
  company_name: string | null;
  professional_title: string | null;
  bio: string | null;
  city: string | null;
  state: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  years_experience: number | null;
  specialties: string[] | null;
  certifications: string[] | null;
  rating: number | null;
  total_sales: number | null;
  active_properties: number | null;
  verified: boolean | null;
  avatar_url: string | null;
}

export function mapDbBroker(row: DbBroker, displayName: string) {
  return {
    id: row.id,
    name: displayName,
    title: row.professional_title ?? 'Broker',
    company: row.company_name ?? 'JC Real Estate Group',
    specialty: row.specialties?.[0] ?? '',
    specialties: row.specialties ?? [],
    location: `${row.city ?? ''}, ${row.state ?? ''}`.replace(/^, |, $/g, ''),
    phone: row.phone ?? '',
    whatsapp: row.whatsapp ?? row.phone ?? '',
    email: row.email ?? '',
    bio: row.bio ?? '',
    experience: row.years_experience ?? 0,
    rating: Number(row.rating ?? 0),
    reviews: 0,
    activeListings: row.active_properties ?? 0,
    closedSales: row.total_sales ?? 0,
    verified: Boolean(row.verified),
    certifications: row.certifications ?? [],
    image: row.avatar_url ? { uri: row.avatar_url } : Images.broker1,
    instagram: undefined,
    linkedin: undefined,
  };
}
