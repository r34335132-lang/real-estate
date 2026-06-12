import { getSupabase } from '@/lib/supabase';

export async function fetchMyBrokerRating(
  userId: string,
  brokerId: string,
): Promise<number | null> {
  const { data, error } = await getSupabase()
    .from('broker_reviews')
    .select('rating')
    .eq('user_id', userId)
    .eq('broker_id', brokerId)
    .maybeSingle();
  if (error) throw error;
  return data ? Number(data.rating) : null;
}

export async function saveBrokerRating(
  userId: string,
  brokerId: string,
  rating: number,
): Promise<void> {
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw new Error('Selecciona una calificacion de 1 a 5 estrellas.');
  }

  const { error } = await getSupabase()
    .from('broker_reviews')
    .upsert(
      {
        user_id: userId,
        broker_id: brokerId,
        rating,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,broker_id' },
    );
  if (error) throw error;
}
