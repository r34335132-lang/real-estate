import { getSupabase } from '@/lib/supabase';

export async function deleteCurrentAccount(): Promise<void> {
  const { data, error } = await getSupabase().functions.invoke('delete-account', {
    body: { confirm: true },
  });

  if (error) throw new Error(error.message);
  if (data?.error) throw new Error(data.error);
  if (!data?.deleted) throw new Error('Supabase no confirmo la eliminacion de la cuenta.');
}
