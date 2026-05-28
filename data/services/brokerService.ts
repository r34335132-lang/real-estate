import { BROKERS, getBrokerById as getMockBroker } from '@/data/mock';
import { mapDbBroker, type DbBroker } from '@/data/mappers/propertyMapper';
import { getSupabase } from '@/lib/supabase';
import { useSupabase } from '@/lib/env';

const BROKER_NAMES: Record<string, string> = {
  'a1111111-1111-1111-1111-111111111101': 'Carlos Mendoza',
  'a1111111-1111-1111-1111-111111111102': 'Sofía Vargas',
  'a1111111-1111-1111-1111-111111111103': 'Roberto Álvarez',
};

export async function fetchBrokers() {
  if (!useSupabase()) return BROKERS;

  const { data, error } = await getSupabase().from('broker_profiles').select('*').order('rating', { ascending: false });
  if (error) throw error;
  return (data as DbBroker[]).map((b) => mapDbBroker(b, BROKER_NAMES[b.id] ?? 'Broker JC'));
}

export async function fetchBrokerById(id: string) {
  if (!useSupabase()) return getMockBroker(id);

  const { data, error } = await getSupabase().from('broker_profiles').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  if (!data) return undefined;
  return mapDbBroker(data as DbBroker, BROKER_NAMES[id] ?? 'Broker JC');
}
