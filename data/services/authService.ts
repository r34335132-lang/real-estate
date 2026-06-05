import type { User, UserRole } from '@/data/types';
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

async function withTimeout<T>(promise: Promise<T>, ms = 2500): Promise<T | null> {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  try {
    return await Promise.race([
      promise,
      new Promise<null>((resolve) => {
        timeoutId = setTimeout(() => resolve(null), ms);
      }),
    ]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

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

function profileDraftFromAuthUser(authUser: AuthUser) {
  const email = authUser.email ?? '';
  return {
    id: authUser.id,
    full_name: (authUser.user_metadata?.full_name as string) || email.split('@')[0] || 'Usuario',
    email,
    phone: '',
    avatar_url: authUser.user_metadata?.avatar_url as string | undefined,
    role: (authUser.user_metadata?.role as UserRole) || 'buyer',
    created_at: authUser.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

export async function clearAuthSession(): Promise<void> {
  console.log('[auth] clearAuthSession:start', { supabase: useSupabase() });
  if (!useSupabase()) {
    console.log('[auth] clearAuthSession:skip-supabase');
    return;
  }
  const supabase = getSupabase();
  try {
    const result = await withTimeout(supabase.auth.signOut({ scope: 'global' }));
    console.log('[auth] clearAuthSession:global-signout', { timedOut: result === null });
  } catch (error) {
    console.log('[auth] clearAuthSession:global-signout-error', error);
  }
  try {
    const result = await withTimeout(supabase.auth.signOut({ scope: 'local' }));
    console.log('[auth] clearAuthSession:local-signout', { timedOut: result === null });
  } catch (error) {
    console.log('[auth] clearAuthSession:local-signout-error', error);
  }
  console.log('[auth] clearAuthSession:clear-storage:start');
  await clearSupabaseAuthStorage();
  console.log('[auth] clearAuthSession:done');
}

/** Solo consulta `public.users` (espera al trigger en signUp, sin crear filas). */
export async function getUserProfile(authUser: AuthUser, retries = 5): Promise<User | null> {
  if (!useSupabase()) return null;

  const supabase = getSupabase();
  for (let attempt = 0; attempt < retries; attempt++) {
    const { data, error } = await supabase.from('users').select('*').eq('id', authUser.id).maybeSingle();
    if (!error && data) return mapRow(data);
    if (attempt < retries - 1) await sleep(400);
  }
  return null;
}

/** Inserta perfil en `public.users` solo durante registro. */
export async function createUserProfile(authUser: AuthUser): Promise<User | null> {
  if (!useSupabase()) return null;

  const draft = profileDraftFromAuthUser(authUser);
  const { data, error } = await getSupabase()
    .from('users')
    .insert({
      id: draft.id,
      full_name: draft.full_name,
      email: draft.email,
      role: draft.role,
      phone: draft.phone ?? '',
      avatar_url: draft.avatar_url ?? null,
    })
    .select()
    .single();

  if (!error && data) return mapRow(data);

  // El trigger pudo haber creado la fila entre intentos
  return getUserProfile(authUser, 3);
}

export async function ensureUserProfile(
  authUser: AuthUser,
  options: { createIfMissing: boolean },
): Promise<User | null> {
  const existing = await getUserProfile(authUser, options.createIfMissing ? 8 : 5);
  if (existing) return existing;
  if (!options.createIfMissing) return null;
  return createUserProfile(authUser);
}

async function ensureBrokerProfile(profile: User): Promise<void> {
  if (profile.role !== 'broker' || !useSupabase()) return;

  await getSupabase()
    .from('broker_profiles')
    .upsert(
      {
        user_id: profile.id,
        full_name: profile.full_name,
        phone: profile.phone ?? '',
        email: profile.email,
        company_name: '',
        ampi_number: '',
        sedetus_number: '',
        license_type: '',
        id_document_url: '',
        verification_status: 'pending',
        rejection_reason: null,
      },
      { onConflict: 'user_id' },
    );
}

export async function signUpWithEmail(
  email: string,
  password: string,
  fullName: string,
  role: UserRole,
): Promise<{ user: User | null; error: string | null }> {
  if (!useSupabase()) {
    return {
      user: null,
      error: 'Crear cuenta requiere Supabase configurado.',
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
        error: signInResult.error.message || 'Cuenta creada pero no hay sesión activa. Intenta iniciar sesión.',
      };
    }
    session = signInResult.data.session;
  }

  if (!session?.user) {
    await clearAuthSession();
    return { user: null, error: 'No se pudo iniciar sesión tras crear la cuenta.' };
  }

  const profile = await ensureUserProfile(session.user, { createIfMissing: true });
  if (!profile) {
    await clearAuthSession();
    return {
      user: null,
      error:
        'No se pudo crear tu perfil. Ejecuta migrate-users-insert-policy.sql y el trigger handle_new_user en Supabase.',
    };
  }

  await ensureBrokerProfile(profile);

  return { user: profile, error: null };
}

export async function signInWithEmail(
  email: string,
  password: string,
): Promise<{ user: User | null; error: string | null }> {
  if (!useSupabase()) {
    return {
      user: null,
      error: 'El inicio de sesión requiere Supabase configurado.',
    };
  }

  const { data, error } = await getSupabase().auth.signInWithPassword({
    email: email.trim(),
    password,
  });

  if (error) return { user: null, error: error.message };
  if (!data.session?.user) return { user: null, error: 'Credenciales inválidas' };

  const profile = await ensureUserProfile(data.session.user, { createIfMissing: false });
  if (!profile) {
    await clearAuthSession();
    return {
      user: null,
      error: 'Tu cuenta no tiene perfil configurado. Contacta soporte o regístrate de nuevo.',
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

  const profile = await ensureUserProfile(data.session.user, { createIfMissing: false });
  if (!profile) {
    await clearAuthSession();
    return null;
  }

  return profile;
}

