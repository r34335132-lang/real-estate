import { getSupabase } from '@/lib/supabase';
import { useSupabase } from '@/lib/env';
import type { User, UserRole } from '@/data/types';
import { getUserByRole } from '@/data/mockUsers';

export async function signUpWithEmail(
  email: string,
  password: string,
  fullName: string,
  role: UserRole,
): Promise<{ user: User | null; error: string | null }> {
  if (!useSupabase()) {
    const mock = getUserByRole(role) ?? getUserByRole('comprador')!;
    return {
      user: { ...mock, full_name: fullName, email, role },
      error: null,
    };
  }

  const { data, error } = await getSupabase().auth.signUp({
    email: email.trim(),
    password,
    options: {
      data: { full_name: fullName, role },
    },
  });

  if (error) return { user: null, error: error.message };
  if (!data.user) return { user: null, error: 'No se pudo crear la cuenta' };

  const profile = await fetchProfile(data.user.id);
  return { user: profile, error: null };
}

export async function signInWithEmail(
  email: string,
  password: string,
): Promise<{ user: User | null; error: string | null }> {
  if (!useSupabase()) {
    const mock = getUserByRole('comprador')!;
    return { user: { ...mock, email }, error: null };
  }

  const { data, error } = await getSupabase().auth.signInWithPassword({
    email: email.trim(),
    password,
  });

  if (error) return { user: null, error: error.message };
  if (!data.user) return { user: null, error: 'Credenciales inválidas' };

  const profile = await fetchProfile(data.user.id);
  return { user: profile, error: null };
}

export async function signOut(): Promise<void> {
  if (useSupabase()) {
    await getSupabase().auth.signOut();
  }
}

export async function fetchProfile(userId: string): Promise<User | null> {
  if (!useSupabase()) return null;

  const { data, error } = await getSupabase().from('users').select('*').eq('id', userId).maybeSingle();
  if (error || !data) return null;

  return {
    id: data.id,
    full_name: data.full_name,
    email: data.email ?? '',
    phone: data.phone ?? '',
    avatar_url: data.avatar_url ?? undefined,
    role: data.role as UserRole,
    created_at: data.created_at,
    updated_at: data.updated_at,
  };
}

export async function restoreSession(): Promise<User | null> {
  if (!useSupabase()) return null;

  const { data } = await getSupabase().auth.getSession();
  if (!data.session?.user) return null;
  return fetchProfile(data.session.user.id);
}
