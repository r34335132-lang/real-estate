import { useMemo, useState } from 'react';

import { LegalStatus, OperationType, PropertyCategory } from '@/data/types';
import type { Property } from '@/data/catalog';

export interface PropertyFilters {
  category?: PropertyCategory;
  location: string;
  priceMin: number | null;
  priceMax: number | null;
  operationType: OperationType | 'all';
  legalStatus: LegalStatus | 'all';
  sizeMin: number | null;
  sizeMax: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
}

export const DEFAULT_FILTERS: PropertyFilters = {
  location: '',
  priceMin: null,
  priceMax: null,
  operationType: 'all',
  legalStatus: 'all',
  sizeMin: null,
  sizeMax: null,
  bedrooms: null,
  bathrooms: null,
};

export function usePropertyFilters(initialCategory?: PropertyCategory, source?: Property[]) {
  const [filters, setFilters] = useState<PropertyFilters>({
    ...DEFAULT_FILTERS,
    category: initialCategory,
  });
  const [draft, setDraft] = useState<PropertyFilters>(filters);

  const applyFilters = () => setFilters({ ...draft });
  const resetFilters = () => {
    const base = { ...DEFAULT_FILTERS, category: initialCategory };
    setFilters(base);
    setDraft(base);
  };
  const openDraft = () => setDraft({ ...filters });

  const activeChips = useMemo(() => {
    const chips: { key: string; label: string }[] = [];
    if (filters.operationType !== 'all') {
      chips.push({ key: 'operationType', label: filters.operationType === 'venta' ? 'Venta' : 'Renta' });
    }
    if (filters.legalStatus !== 'all') {
      const labels: Record<LegalStatus, string> = {
        pendiente: 'Pendiente',
        en_revision: 'En revisión',
        verificada: 'Verificada',
        rechazada: 'Rechazada',
      };
      chips.push({ key: 'legalStatus', label: labels[filters.legalStatus as LegalStatus] });
    }
    if (filters.location) chips.push({ key: 'location', label: filters.location });
    if (filters.priceMin || filters.priceMax) {
      chips.push({
        key: 'price',
        label: `${filters.priceMin ? `$${(filters.priceMin / 1e6).toFixed(0)}M` : '0'} - ${filters.priceMax ? `$${(filters.priceMax / 1e6).toFixed(0)}M` : '∞'}`,
      });
    }
    if (filters.bedrooms) chips.push({ key: 'bedrooms', label: `${filters.bedrooms}+ rec` });
    if (filters.bathrooms) chips.push({ key: 'bathrooms', label: `${filters.bathrooms}+ baños` });
    return chips;
  }, [filters]);

  const removeChip = (key: string) => {
    const next = { ...filters };
    if (key === 'operationType') next.operationType = 'all';
    if (key === 'legalStatus') next.legalStatus = 'all';
    if (key === 'location') next.location = '';
    if (key === 'price') {
      next.priceMin = null;
      next.priceMax = null;
    }
    if (key === 'bedrooms') next.bedrooms = null;
    if (key === 'bathrooms') next.bathrooms = null;
    setFilters(next);
    setDraft(next);
  };

  const filtered = useMemo(() => {
    const base = source ?? [];
    let list: Property[] = filters.category
      ? base.filter((p) => p.category === filters.category)
      : [...base];

    if (filters.operationType !== 'all') {
      list = list.filter((p) => p.operation_type === filters.operationType);
    }
    if (filters.legalStatus !== 'all') {
      list = list.filter((p) => p.legal_status === filters.legalStatus);
    }
    if (filters.location.trim()) {
      const q = filters.location.toLowerCase();
      list = list.filter(
        (p) =>
          p.location.toLowerCase().includes(q) ||
          p.city.toLowerCase().includes(q) ||
          p.state.toLowerCase().includes(q),
      );
    }
    if (filters.priceMin != null) list = list.filter((p) => p.price >= filters.priceMin!);
    if (filters.priceMax != null) list = list.filter((p) => p.price <= filters.priceMax!);
    if (filters.sizeMin != null) list = list.filter((p) => p.size_m2 >= filters.sizeMin!);
    if (filters.sizeMax != null) list = list.filter((p) => p.size_m2 <= filters.sizeMax!);
    if (filters.bedrooms != null) {
      list = list.filter((p) => (p.bedrooms ?? 0) >= filters.bedrooms!);
    }
    if (filters.bathrooms != null) {
      list = list.filter((p) => (p.bathrooms ?? 0) >= filters.bathrooms!);
    }
    return list;
  }, [filters, source]);

  const hasActiveFilters = activeChips.length > 0;

  return {
    filters,
    setFilters,
    draft,
    setDraft,
    applyFilters,
    resetFilters,
    openDraft,
    filtered,
    activeChips,
    removeChip,
    hasActiveFilters,
  };
}
