/** Tipos alineados con schema Supabase — listos para migrar a backend real */

import type { ImageSourcePropType } from 'react-native';

export type ImageAsset = ImageSourcePropType;

export type UserRole = 'admin' | 'broker' | 'buyer';

export type PropertyCategory = 'terreno' | 'casa' | 'edificio' | 'hotel' | 'playa' | 'cenote';
export type OperationType = 'compra' | 'venta' | 'renta' | 'permuta' | 'asesoria';
export type LegalStatus = 'pendiente' | 'en_revision' | 'verificada' | 'rechazada';
export type PropertyListingStatus = 'activa' | 'vendida' | 'pausada';
export type BrokerVerificationStatus = 'pending' | 'approved' | 'rejected';
export type PublicationStatus = 'draft' | 'pending_review' | 'published' | 'rejected';
export type PropertyDocumentStatus = 'pending' | 'approved' | 'rejected';
export type PropertyDocumentType =
  | 'escritura_publica'
  | 'libre_gravamen'
  | 'cedula_catastral'
  | 'planos'
  | 'predial'
  | 'servicios'
  | 'identificacion_propietario'
  | 'autorizacion_propietario';

export type BudgetRange =
  | 'under_1m'
  | '1m_3m'
  | '3m_7m'
  | 'over_7m'
  | 'undefined';

export interface User {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  avatar_url?: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface BrokerProfile {
  id: string;
  user_id: string;
  full_name: string;
  phone: string;
  email: string;
  company_name: string;
  ampi_number: string;
  sedetus_number: string;
  license_type: string;
  id_document_url: string;
  verification_status: BrokerVerificationStatus;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface Property {
  id: string;
  broker_id: string;
  title: string;
  description: string;
  category: PropertyCategory;
  operation_type: OperationType;
  price: number;
  currency: string;
  location: string;
  city: string;
  state: string;
  address: string;
  size_m2: number;
  bedrooms?: number;
  bathrooms?: number;
  parking_spaces?: number;
  amenities: string[];
  images: ImageAsset[];
  image: ImageAsset;
  legal_status: LegalStatus;
  status: PropertyListingStatus;
  publication_status: PublicationStatus;
  rejection_reason: string | null;
  legal_disclaimer_accepted: boolean;
  documents_completed: boolean;
  featured: boolean;
  verified: boolean;
  has_public_deed?: boolean;
  has_no_lien_certificate?: boolean;
  has_cadastral_certificate?: boolean;
  has_plans?: boolean;
  seller_registry_type?: 'ampi' | 'sedetus';
  seller_registry_number?: string;
  created_at: string;
  updated_at: string;
  /** @deprecated use operation_type */
  status_legacy?: OperationType;
}

export interface PropertyDocument {
  id: string;
  property_id: string;
  document_type: PropertyDocumentType;
  file_url: string;
  status: PropertyDocumentStatus;
  rejection_reason: string | null;
  created_at: string;
}

export interface UserPreferences {
  id: string;
  user_id: string;
  interested_category: PropertyCategory;
  operation_type: OperationType;
  preferred_location: string;
  budget_min: number | null;
  budget_max: number | null;
  budget_range?: BudgetRange;
  created_at: string;
  updated_at: string;
}

export interface Favorite {
  id: string;
  user_id: string;
  property_id: string;
  created_at: string;
}

export interface Appointment {
  id: string;
  user_id: string;
  property_id: string;
  broker_id: string;
  date: string;
  time: string;
  status: 'pendiente' | 'confirmada' | 'cancelada' | 'completada';
  created_at: string;
}

export interface LegalRequest {
  id: string;
  user_id: string;
  property_id: string;
  lawyer_id: string;
  request_type: string;
  status: 'pendiente' | 'en_proceso' | 'completada' | 'rechazada';
  notes: string;
  created_at: string;
}

export interface Category {
  slug: PropertyCategory;
  label: string;
  icon: string;
  image: ImageAsset;
  count: number;
  routeTitle: string;
  routeSubtitle: string;
}

/** Compatibilidad con componentes existentes */
export interface Broker {
  id: string;
  name: string;
  title: string;
  company: string;
  specialty: string;
  location: string;
  phone: string;
  email: string;
  whatsapp?: string;
  bio: string;
  experience: number;
  rating: number;
  reviews: number;
  activeListings: number;
  closedSales: number;
  verified: boolean;
  certifications: string[];
  specialties?: string[];
  image: ImageAsset;
  instagram?: string;
  linkedin?: string;
}
