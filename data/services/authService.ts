import type { User, UserRole } from '@/data/types';
import { getUserByRole } from '@/data/mockUsers';
import { clearSupabaseAuthStorage } from '@/lib/authStorage';
import { useSupabase } from '@/lib/env';
import { getSupabase } from '@/lib/supabase';

type AuthUser = {
  id: string;
  email?: string | null;
  created_at?: string;
  user_metadata?: Record<string, unknown>;
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function mapRow(data: Record<string, unknown>): User {
  return {
    id: data.id as string,
    full_name: data.full_name as string,
    email: (data.email as string) ?? '',
    phone: (data.phone as string) ?? '',
    avatar_url: (data.avatar_url as string) ?? undefined,
    role: data.role as UserRole,
    created_at: data.created_at as string,
    updated_at: data.updated_at as string,
  };
}

function profileFromAuthUser(authUser: AuthUser): Omit<User, 'created_at' | 'updated_at'> & {
  created_at: string;
  updated_at: string;
} {
  const email = authUser.email ?? '';
  return {
    id: authUser.id,
    full_name: (authUser.user_metadata?.full_name as string) || email.split('@')[0] || 'Usuario',
    email,
    phone: '',
    avatar_url: authUser.user_metadata?.avatar_url as string | undefined,
    role: (authUser.user_metadata?.role as UserRole) || 'comprador',
    created_at: authUser.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

export async function clearAuthSession(): Promise<void> {
  if (!useSupabase()) return;
  const supabase = getSupabase();
  try {
    await supabase.auth.signOut({ scope: 'global' });
  } catch {
    /* ignore */
  }
  try {
    await supabase.auth.signOut({ scope: 'local' });
  } catch {
    /* ignore */
  }
  await clearSupabaseAuthStorage();
}

export async function ensureUserProfile(authUser: AuthUser): Promise<User | null> {
  if (!useSupabase()) return null;

  const supabase = getSupabase();

  for (let attempt = 0; attempt < 8; attempt++) {
    const { data, error } = await supabase.from('users').select('*').eq('id', authUser.id).maybeSingle();
    if (!error && data) return mapRow(data);
    if (attempt < 7) await sleep(400);
  }

  const draft = profileFromAuthUser(authUser);
  const { data: inserted, error: insertError } = await supabase
    .from('users')
    .upsert(
      {
        id: draft.id,
        full_name: draft.full_name,
        email: draft.email,
        role: draft.role,
        phone: draft.phone ?? '',
        avatar_url: draft.avatar_url ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' },
    )
    .select()
    .single();

  if (!insertError && inserted) return mapRow(inserted);

  const { data: retry } = await supabase.from('users').select('*').eq('id', authUser.id).maybeSingle();
  if (retry) return mapRow(retry);

  return null;
}

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

  const supabase = getSupabase();
  const { data, error } = await supabase.auth.signUp({
    email: email.trim(),
    password,
    options: {
      data: { full_name: fullName, role },
    },
  });

  if (error) return { user: null, error: error.message };
  if (!data.user) return { user: null, error: 'No se pudo crear la cuenta' };

  let authUser = data.user;
  let session = data.session;

  if (!session) {
    const signInResult = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (signInResult.error) {
      await clearAuthSession();
      return {
        user: null,
        error:
          signInResult.error.message ||
          'Cuenta creada pero no hay sesión activa. Intenta iniciar sesión.',
      };
    }
    authUser = signInResult.data.user ?? authUser;
    session = signInResult.data.session;
  }

  if (!session?.user) {
    await clearAuthSession();
    return { user: null, error: 'No se pudo iniciar sesión tras crear la cuenta.' };
  }

  const profile = await ensureUserProfile(session.user);
  if (!profile) {
    await clearAuthSession();
    return {
      user: null,
      error:
        'No se pudo crear tu perfil. En Supabase ejecuta migrate-users-insert-policy.sql y el trigger handle_new_user.',
    };
  }

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
  if (!data.session?.user) return { user: null, error: 'Credenciales inválidas' };

  const profile = await ensureUserProfile(data.session.user);
  if (!profile) {
    await clearAuthSession();
    return {
      user: null,
      error: 'No se pudo cargar tu perfil. Revisa las políticas RLS en Supabase.',
    };
  }

  return { user: profile, error: null };
}

export async function signOut(): Promise<void> {
  await clearAuthSession();
}

export async function restoreSession(): Promise<User | null> {
  if (!useSupabase()) return null;

  const { data } = await getSupabase().auth.getSession();
  if (!data.session?.user) return null;

  return ensureUserProfile(data.session.user);
}
