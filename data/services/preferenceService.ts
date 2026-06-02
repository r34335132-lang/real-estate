import type { UserPreferences } from '@/data/types';
import { getSupabase } from '@/lib/supabase';
import { useSupabase } from '@/lib/env';

export async function fetchPreferences(userId: string): Promise<UserPreferences | null> {
  if (!useSupabase()) return null;

  const { data, error } = await getSupabase()
    .from('user_preferences')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error || !data) return null;
  return data as UserPreferences;
}

export async function savePreferences(
  userId: string,
  prefs: Omit<UserPreferences, 'id' | 'user_id' | 'created_at' | 'updated_at'>,
): Promise<UserPreferences> {
  if (!useSupabase()) {
    throw new Error('Guardar preferencias requiere Supabase configurado.');
  }

  const { data, error } = await getSupabase()
    .from('user_preferences')
    .upsert(
      {
        user_id: userId,
        interested_category: prefs.interested_category,
        operation_type: prefs.operation_type,
        preferred_location: prefs.preferred_location,
        budget_min: prefs.budget_min,
        budget_max: prefs.budget_max,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' },
    )
    .select()
    .single();

  if (error) throw error;
  return data as UserPreferences;
}
