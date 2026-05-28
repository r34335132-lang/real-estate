import { BudgetRange, UserPreferences } from './types';

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
