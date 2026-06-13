import { mapDbProperty, type DbProperty } from '@/data/mappers/propertyMapper';
import type { Property } from '@/data/catalog';
import type { OperationType, PropertyCategory, PublicationStatus } from '@/data/types';
import { getSupabase } from '@/lib/supabase';
import { useSupabase } from '@/lib/env';

async function fetchAllFromDb(): Promise<Property[]> {
  const { data, error } = await getSupabase()
    .from('properties')
    .select('*')
    .eq('publication_status', 'published')
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
    .eq('publication_status', 'published');

  if (error) throw error;
  return (data as DbProperty[]).map(mapDbProperty);
}

export async function fetchFeatured(): Promise<Property[]> {
  if (!useSupabase()) return [];

  const { data, error } = await getSupabase()
    .from('properties')
    .select('*')
    .eq('featured', true)
    .eq('publication_status', 'published')
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

  let q = getSupabase().from('properties').select('*').eq('publication_status', 'published');
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
    .eq('publication_status', 'published');

  if (error) throw error;
  return (data as DbProperty[]).map(mapDbProperty);
}

export async function fetchByBroker(brokerId: string): Promise<Property[]> {
  if (!useSupabase()) return [];

  const { data, error } = await getSupabase()
    .from('properties')
    .select('*')
    .eq('broker_id', brokerId)
    .eq('publication_status', 'published');

  if (error) throw error;
  return (data as DbProperty[]).map(mapDbProperty);
}

export interface CreatePropertyInput {
  title?: string | null;
  description?: string | null;
  category?: PropertyCategory | null;
  operation_type?: OperationType | null;
  price?: number | null;
  location?: string | null;
  city?: string | null;
  state?: string | null;
  size_m2?: number | null;
  bedrooms?: number;
  bathrooms?: number;
  broker_id: string;
  images?: string[];
  publication_status?: PublicationStatus;
  legal_disclaimer_accepted: boolean;
  documents_completed: boolean;
  admin_observation?: string | null;
  has_incomplete_documentation?: boolean;
  published_with_observation?: boolean;
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
      publication_status: input.publication_status ?? 'pending_review',
      rejection_reason: null,
      admin_observation: input.admin_observation ?? null,
      has_incomplete_documentation:
        input.has_incomplete_documentation ?? !input.documents_completed,
      published_with_observation: input.published_with_observation ?? false,
      legal_disclaimer_accepted: input.legal_disclaimer_accepted,
      documents_completed: input.documents_completed,
      featured: false,
      images: input.images ?? [],
      amenities: [],
    })
    .select()
    .single();

  if (error) throw error;
  return mapDbProperty(data as DbProperty);
}

export async function fetchPendingReviewProperties(): Promise<Property[]> {
  if (!useSupabase()) return [];

  const { data, error } = await getSupabase()
    .from('properties')
    .select('*')
    .in('publication_status', ['pending_review', 'rejected'])
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data as DbProperty[]).map(mapDbProperty);
}

export async function updatePropertyPublicationStatus(
  id: string,
  publicationStatus: PublicationStatus,
  rejectionReason: string | null = null,
): Promise<void> {
  const { error } = await getSupabase()
    .from('properties')
    .update({
      publication_status: publicationStatus,
      rejection_reason: publicationStatus === 'rejected' ? rejectionReason ?? 'Documentacion incompleta' : null,
      legal_status: publicationStatus === 'published' ? 'verificada' : 'en_revision',
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);
  if (error) throw error;
}
