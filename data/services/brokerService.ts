import { mapDbBroker, type DbBroker } from '@/data/mappers/propertyMapper';
import type { BrokerProfile, BrokerVerificationStatus } from '@/data/types';
import { getSupabase } from '@/lib/supabase';
import { useSupabase } from '@/lib/env';

const BROKER_NAMES: Record<string, string> = {
  'a1111111-1111-1111-1111-111111111101': 'Carlos Mendoza',
  'a1111111-1111-1111-1111-111111111102': 'Sofía Vargas',
  'a1111111-1111-1111-1111-111111111103': 'Roberto Álvarez',
};

export async function fetchBrokers() {
  if (!useSupabase()) return [];

  const { data, error } = await getSupabase().from('broker_profiles').select('*').order('rating', { ascending: false });
  if (error) throw error;
  return (data as DbBroker[]).map((b) => mapDbBroker(b, BROKER_NAMES[b.id] ?? 'Broker JC'));
}

export async function fetchBrokerById(id: string) {
  if (!useSupabase()) return undefined;

  const { data, error } = await getSupabase().from('broker_profiles').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  if (!data) return undefined;
  return mapDbBroker(data as DbBroker, BROKER_NAMES[id] ?? 'Broker JC');
}

function mapBrokerProfile(row: Record<string, unknown>): BrokerProfile {
  return {
    id: row.id as string,
    user_id: row.user_id as string,
    full_name: (row.full_name as string) ?? '',
    phone: (row.phone as string) ?? '',
    email: (row.email as string) ?? '',
    company_name: (row.company_name as string) ?? '',
    ampi_number: (row.ampi_number as string) ?? '',
    sedetus_number: (row.sedetus_number as string) ?? '',
    license_type: (row.license_type as string) ?? '',
    id_document_url: (row.id_document_url as string) ?? '',
    verification_status: ((row.verification_status as BrokerVerificationStatus) ?? 'pending'),
    rejection_reason: (row.rejection_reason as string) ?? null,
    created_at: (row.created_at as string) ?? '',
    updated_at: (row.updated_at as string) ?? '',
  };
}

export async function fetchBrokerProfileByUser(userId: string): Promise<BrokerProfile | null> {
  if (!useSupabase()) return null;

  const { data, error } = await getSupabase()
    .from('broker_profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  return data ? mapBrokerProfile(data as Record<string, unknown>) : null;
}

export async function upsertBrokerProfile(
  input: Omit<BrokerProfile, 'id' | 'verification_status' | 'rejection_reason' | 'created_at' | 'updated_at'> & {
    id?: string;
  },
): Promise<BrokerProfile> {
  const { data, error } = await getSupabase()
    .from('broker_profiles')
    .upsert(
      {
        id: input.id,
        user_id: input.user_id,
        full_name: input.full_name,
        phone: input.phone,
        email: input.email,
        company_name: input.company_name,
        ampi_number: input.ampi_number,
        sedetus_number: input.sedetus_number,
        license_type: input.license_type,
        id_document_url: input.id_document_url,
        verification_status: 'pending',
        rejection_reason: null,
      },
      { onConflict: 'user_id' },
    )
    .select()
    .single();
  if (error) throw error;
  return mapBrokerProfile(data as Record<string, unknown>);
}

export async function fetchPendingBrokerProfiles(): Promise<BrokerProfile[]> {
  if (!useSupabase()) return [];

  const { data, error } = await getSupabase()
    .from('broker_profiles')
    .select('*')
    .in('verification_status', ['pending', 'rejected'])
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data as Record<string, unknown>[]).map(mapBrokerProfile);
}

export async function updateBrokerVerificationStatus(
  id: string,
  verificationStatus: BrokerVerificationStatus,
  rejectionReason: string | null = null,
): Promise<void> {
  const { error } = await getSupabase()
    .from('broker_profiles')
    .update({
      verification_status: verificationStatus,
      rejection_reason: verificationStatus === 'rejected' ? rejectionReason ?? 'Documentacion incompleta' : null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);
  if (error) throw error;
}
