import { mapDbProperty, type DbProperty } from '@/data/mappers/propertyMapper';
import type { Property } from '@/data/catalog';
import type { OperationType, PropertyCategory } from '@/data/types';
import { getSupabase } from '@/lib/supabase';
import { useSupabase } from '@/lib/env';

async function fetchAllFromDb(): Promise<Property[]> {
  const { data, error } = await getSupabase()
    .from('properties')
    .select('*')
    .eq('status', 'activa')
    .order('featured', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data as DbProperty[]).map(mapDbProperty);
}

export async function fetchProperties(): Promise<Property[]> {
  if (!useSupabase()) return [];
  return fetchAllFromDb();
}

export async function fetchPropertyById(id: string): Promise<Property | undefined> {
  if (!useSupabase()) return undefined;

  const { data, error } = await getSupabase().from('properties').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data ? mapDbProperty(data as DbProperty) : undefined;
}

export async function fetchPropertiesByCategory(category: PropertyCategory): Promise<Property[]> {
  if (!useSupabase()) return [];

  const { data, error } = await getSupabase()
    .from('properties')
    .select('*')
    .eq('category', category)
    .eq('status', 'activa');

  if (error) throw error;
  return (data as DbProperty[]).map(mapDbProperty);
}

export async function fetchFeatured(): Promise<Property[]> {
  if (!useSupabase()) return [];

  const { data, error } = await getSupabase()
    .from('properties')
    .select('*')
    .eq('featured', true)
    .eq('status', 'activa')
    .limit(10);

  if (error) throw error;
  return (data as DbProperty[]).map(mapDbProperty);
}

export async function fetchRecommended(
  category?: PropertyCategory,
  operationType?: OperationType,
  budgetMax?: number,
): Promise<Property[]> {
  if (!useSupabase()) return [];

  let q = getSupabase().from('properties').select('*').eq('status', 'activa');
  if (category) q = q.eq('category', category);
  if (operationType) q = q.eq('operation_type', operationType);
  if (budgetMax) q = q.lte('price', budgetMax);

  const { data, error } = await q.order('featured', { ascending: false }).limit(20);
  if (error) throw error;
  return (data as DbProperty[]).map(mapDbProperty);
}

export async function fetchVerifiedLegal(): Promise<Property[]> {
  if (!useSupabase()) return [];

  const { data, error } = await getSupabase()
    .from('properties')
    .select('*')
    .eq('legal_status', 'verificada')
    .eq('status', 'activa');

  if (error) throw error;
  return (data as DbProperty[]).map(mapDbProperty);
}

export async function fetchByBroker(brokerId: string): Promise<Property[]> {
  if (!useSupabase()) return [];

  const { data, error } = await getSupabase()
    .from('properties')
    .select('*')
    .eq('broker_id', brokerId)
    .eq('status', 'activa');

  if (error) throw error;
  return (data as DbProperty[]).map(mapDbProperty);
}

export interface CreatePropertyInput {
  title: string;
  description: string;
  category: PropertyCategory;
  operation_type: OperationType;
  price: number;
  location: string;
  city: string;
  state: string;
  size_m2: number;
  bedrooms?: number;
  bathrooms?: number;
  broker_id?: string;
  has_public_deed?: boolean;
  has_no_lien_certificate?: boolean;
  has_cadastral_certificate?: boolean;
  has_plans?: boolean;
  seller_registry_type?: 'ampi' | 'sedetus';
  seller_registry_number?: string;
}

export async function createProperty(input: CreatePropertyInput): Promise<Property> {
  const { data, error } = await getSupabase()
    .from('properties')
    .insert({
      ...input,
      currency: 'MXN',
      legal_status: 'pendiente',
      status: 'activa',
      featured: false,
      images: [],
      amenities: [],
    })
    .select()
    .single();

  if (error) throw error;
  return mapDbProperty(data as DbProperty);
}
