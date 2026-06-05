import Images from '@/constants/images';
import type { Broker, BudgetRange, Category, OperationType, Property as PropertyRow, UserPreferences } from '@/data/types';

export type Property = Omit<PropertyRow, 'status' | 'status_legacy'> & {
  brokerId: string;
  status: OperationType;
  priceUnit: string;
  area: number;
  legalStatus: string;
  status_legacy?: OperationType;
};

export type { Broker, Category, PropertyCategory } from '@/data/types';

export const CATEGORIES: Category[] = [
  {
    slug: 'terreno',
    label: 'Terrenos',
    icon: 'map',
    image: Images.terreno,
    count: 0,
    routeTitle: 'Terrenos en venta',
    routeSubtitle: 'Lotes y terrenos premium en México',
  },
  {
    slug: 'casa',
    label: 'Casas',
    icon: 'home',
    image: Images.casa,
    count: 0,
    routeTitle: 'Casas disponibles',
    routeSubtitle: 'Residencias de alto nivel',
  },
  {
    slug: 'edificio',
    label: 'Edificios',
    icon: 'briefcase',
    image: Images.edificio,
    count: 0,
    routeTitle: 'Edificios e inversión',
    routeSubtitle: 'Activos comerciales y residenciales',
  },
  {
    slug: 'hotel',
    label: 'Hoteles',
    icon: 'star',
    image: Images.hotel,
    count: 0,
    routeTitle: 'Hoteles de inversión',
    routeSubtitle: 'Propiedades hoteleras premium',
  },
  {
    slug: 'playa',
    label: 'Playas',
    icon: 'droplet',
    image: Images.playa,
    count: 0,
    routeTitle: 'Playas y frente al mar',
    routeSubtitle: 'Propiedades costeras exclusivas',
  },
  {
    slug: 'cenote',
    label: 'Cenotes',
    icon: 'droplet',
    image: Images.cenote,
    count: 0,
    routeTitle: 'Terrenos con cenote',
    routeSubtitle: 'Propiedades con cenotes naturales y alto potencial turistico',
  },
];

export const BUDGET_OPTIONS: { id: BudgetRange; label: string; min: number | null; max: number | null }[] = [
  { id: 'under_1m', label: 'Menos de $1M', min: null, max: 1_000_000 },
  { id: '1m_3m', label: '$1M - $3M', min: 1_000_000, max: 3_000_000 },
  { id: '3m_7m', label: '$3M - $7M', min: 3_000_000, max: 7_000_000 },
  { id: 'over_7m', label: 'Más de $7M', min: 7_000_000, max: null },
  { id: 'undefined', label: 'Sin presupuesto definido', min: null, max: null },
];

export const DEFAULT_PREFERENCES: Omit<UserPreferences, 'id' | 'user_id' | 'created_at' | 'updated_at'> = {
  interested_category: 'casa',
  operation_type: 'venta',
  preferred_location: '',
  budget_min: null,
  budget_max: null,
  budget_range: 'undefined',
};

export function budgetFromRange(range: BudgetRange): { min: number | null; max: number | null } {
  const opt = BUDGET_OPTIONS.find((b) => b.id === range);
  return { min: opt?.min ?? null, max: opt?.max ?? null };
}

export function formatPrice(price: number): string {
  if (price >= 1_000_000) {
    return `$${(price / 1_000_000).toFixed(1)}M`;
  }
  return `$${price.toLocaleString('es-MX')}`;
}

export function getCategoryLabel(slug: Category['slug']): string {
  return CATEGORIES.find((c) => c.slug === slug)?.label ?? slug;
}

export function getCategoryMeta(slug: Category['slug']) {
  return CATEGORIES.find((c) => c.slug === slug);
}
