import { getSupabase } from '@/lib/supabase';
import { useSupabase } from '@/lib/env';

export async function fetchFavoriteIds(userId: string): Promise<string[]> {
  if (!useSupabase()) return [];

  const { data, error } = await getSupabase()
    .from('favorites')
    .select('property_id')
    .eq('user_id', userId);

  if (error) throw error;
  return (data ?? []).map((r) => r.property_id);
}

export async function toggleFavoriteDb(userId: string, propertyId: string): Promise<boolean> {
  if (!useSupabase()) return true;

  const { data: existing } = await getSupabase()
    .from('favorites')
    .select('id')
    .eq('user_id', userId)
    .eq('property_id', propertyId)
    .maybeSingle();

  if (existing) {
    await getSupabase().from('favorites').delete().eq('id', existing.id);
    return false;
  }

  await getSupabase().from('favorites').insert({ user_id: userId, property_id: propertyId });
  return true;
}
