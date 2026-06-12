import { mapDbProperty, type DbProperty } from '@/data/mappers/propertyMapper';
import type { Property } from '@/data/catalog';
import { getSupabase } from '@/lib/supabase';

export interface ProfileMetrics {
  users: number;
  properties: number;
  requests: number;
  appointments: number;
  activeListings: number;
  closedSales: number;
  rating: number;
  reviews: number;
}

export async function fetchProfileMetrics(
  userId: string,
  role: 'admin' | 'broker' | 'buyer',
): Promise<{ metrics: ProfileMetrics; properties: Property[] }> {
  const supabase = getSupabase();
  const empty: ProfileMetrics = {
    users: 0,
    properties: 0,
    requests: 0,
    appointments: 0,
    activeListings: 0,
    closedSales: 0,
    rating: 0,
    reviews: 0,
  };

  if (role === 'admin') {
    const [users, properties, requests] = await Promise.all([
      supabase.from('users').select('id', { count: 'exact', head: true }),
      supabase.from('properties').select('id', { count: 'exact', head: true }),
      supabase.from('legal_requests').select('id', { count: 'exact', head: true }),
    ]);
    if (users.error) throw users.error;
    if (properties.error) throw properties.error;
    if (requests.error) throw requests.error;
    return {
      metrics: {
        ...empty,
        users: users.count ?? 0,
        properties: properties.count ?? 0,
        requests: requests.count ?? 0,
      },
      properties: [],
    };
  }

  if (role === 'buyer') {
    const { count, error } = await supabase
      .from('appointments')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId);
    if (error) throw error;
    return { metrics: { ...empty, appointments: count ?? 0 }, properties: [] };
  }

  const { data: broker, error: brokerError } = await supabase
    .from('broker_profiles')
    .select('id,rating,total_sales')
    .eq('user_id', userId)
    .maybeSingle();
  if (brokerError) throw brokerError;
  if (!broker) return { metrics: empty, properties: [] };

  const [{ data: propertyRows, error: propertyError }, reviews] = await Promise.all([
    supabase.from('properties').select('*').eq('broker_id', broker.id).order('created_at', { ascending: false }),
    supabase
      .from('broker_reviews')
      .select('id', { count: 'exact', head: true })
      .eq('broker_id', broker.id),
  ]);
  if (propertyError) throw propertyError;
  if (reviews.error) throw reviews.error;

  const properties = (propertyRows as DbProperty[]).map(mapDbProperty);
  return {
    metrics: {
      ...empty,
      properties: properties.length,
      activeListings: properties.filter((property) => property.publication_status === 'published').length,
      closedSales: Number(broker.total_sales ?? 0),
      rating: Number(broker.rating ?? 0),
      reviews: reviews.count ?? 0,
    },
    properties,
  };
}
