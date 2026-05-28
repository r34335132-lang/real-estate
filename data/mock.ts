/**
 * Punto de entrada de datos mock — compatible con componentes existentes.
 * Para Supabase: reemplazar por servicios en data/services/
 */
import Images from '@/constants/images';

import { BROKERS, getBrokerById } from './mockBrokers';
import {
  PROPERTIES,
  getFeaturedProperties,
  getPropertiesByBroker,
  getPropertiesByCategory,
  getPropertyById,
  getRecommendedProperties,
  getVerifiedLegalProperties,
} from './mockProperties';
import { MOCK_LEGAL_REQUESTS } from './mockLegalRequests';
import { MOCK_APPOINTMENTS } from './mockAppointments';
import { BUDGET_OPTIONS, DEFAULT_PREFERENCES } from './mockPreferences';
import { MOCK_USERS, getUserByRole } from './mockUsers';
import type { PropertyCategory } from './types';

export type {
  UserRole,
  PropertyCategory,
  OperationType,
  LegalStatus,
  PropertyListingStatus,
  BudgetRange,
  User,
  BrokerProfile,
  UserPreferences,
  Favorite,
  Appointment,
  LegalRequest,
  Category,
  Broker,
} from './types';

export {
  BROKERS,
  getBrokerById,
  PROPERTIES,
  getPropertyById,
  getPropertiesByCategory,
  getFeaturedProperties,
  getPropertiesByBroker,
  getRecommendedProperties,
  getVerifiedLegalProperties,
  MOCK_LEGAL_REQUESTS,
  MOCK_APPOINTMENTS,
  BUDGET_OPTIONS,
  DEFAULT_PREFERENCES,
  MOCK_USERS,
  getUserByRole,
};

/** Property type usado por componentes (campos legacy + imágenes locales) */
export type Property = (typeof PROPERTIES)[number];

/** Modelo de BD (Supabase) — ver data/types.ts `Property` renombrado conceptualmente */
export type { Property as PropertyRow } from './types';
export type PropertyStatus = 'venta' | 'renta';

export const CATEGORIES = [
  {
    slug: 'terreno' as const,
    label: 'Terrenos',
    icon: 'map',
    image: Images.terreno,
    count: PROPERTIES.filter((p) => p.category === 'terreno').length,
    routeTitle: 'Terrenos en venta',
    routeSubtitle: 'Lotes y terrenos premium en México',
  },
  {
    slug: 'casa' as const,
    label: 'Casas',
    icon: 'home',
    image: Images.casa,
    count: PROPERTIES.filter((p) => p.category === 'casa').length,
    routeTitle: 'Casas disponibles',
    routeSubtitle: 'Residencias de alto nivel',
  },
  {
    slug: 'edificio' as const,
    label: 'Edificios',
    icon: 'briefcase',
    image: Images.edificio,
    count: PROPERTIES.filter((p) => p.category === 'edificio').length,
    routeTitle: 'Edificios e inversión',
    routeSubtitle: 'Activos comerciales y residenciales',
  },
  {
    slug: 'hotel' as const,
    label: 'Hoteles',
    icon: 'star',
    image: Images.hotel,
    count: PROPERTIES.filter((p) => p.category === 'hotel').length,
    routeTitle: 'Hoteles de inversión',
    routeSubtitle: 'Propiedades hoteleras premium',
  },
  {
    slug: 'playa' as const,
    label: 'Playas',
    icon: 'droplet',
    image: Images.terreno,
    count: PROPERTIES.filter((p) => p.category === 'playa').length,
    routeTitle: 'Playas y frente al mar',
    routeSubtitle: 'Propiedades costeras exclusivas',
  },
];

export function formatPrice(price: number): string {
  if (price >= 1_000_000) {
    return `$${(price / 1_000_000).toFixed(1)}M`;
  }
  return `$${price.toLocaleString('es-MX')}`;
}

export function getCategoryLabel(slug: PropertyCategory): string {
  return CATEGORIES.find((c) => c.slug === slug)?.label ?? slug;
}

export function getCategoryMeta(slug: PropertyCategory) {
  return CATEGORIES.find((c) => c.slug === slug);
}
