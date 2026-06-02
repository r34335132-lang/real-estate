import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

import { env, isSupabaseConfigured } from '@/lib/env';

const KEYS = {
  version: 're_jc_auth_version',
  authIntent: 're_jc_auth_intent',
  guest: 're_jc_guest',
  skipRestore: 're_jc_skip_restore',
  favorites: 're_jc_favorites',
  preferences: 're_jc_preferences',
  onboarding: 're_jc_onboarding_done',
  guestOnboarding: 're_jc_guest_onboarding_done',
} as const;

export { KEYS as AUTH_STORAGE_KEYS };

export type AuthIntent = 'login' | 'register';

export function getSupabaseAuthStorageKey(): string | null {
  if (!isSupabaseConfigured()) return null;
  const match = env.supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/);
  if (match) return `sb-${match[1]}-auth-token`;
  return null;
}

/** Elimina tokens de Supabase en AsyncStorage (Expo) y localStorage (web). */
export async function clearSupabaseAuthStorage(): Promise<void> {
  const allKeys = await AsyncStorage.getAllKeys();
  const sbKeys = allKeys.filter((k) => k.startsWith('sb-') && k.includes('auth'));
  if (sbKeys.length > 0) await AsyncStorage.multiRemove(sbKeys);

  const explicit = getSupabaseAuthStorageKey();
  if (explicit) await AsyncStorage.removeItem(explicit);

  if (Platform.OS === 'web' && typeof globalThis.localStorage !== 'undefined') {
    const webKeys: string[] = [];
    for (let i = 0; i < globalThis.localStorage.length; i++) {
      const key = globalThis.localStorage.key(i);
      if (key && key.startsWith('sb-')) webKeys.push(key);
    }
    webKeys.forEach((key) => globalThis.localStorage.removeItem(key));
  }
}

export async function clearAuthIntent(): Promise<void> {
  await AsyncStorage.removeItem(KEYS.authIntent);
}

/**
 * Limpia sesiones viejas/corruptas en el dispositivo sin guardar marcadores locales.
 */
export async function migrateAuthStorageIfNeeded(): Promise<void> {
  await clearSupabaseAuthStorage();
  await AsyncStorage.multiRemove([
    KEYS.version,
    KEYS.guest,
    KEYS.skipRestore,
    KEYS.authIntent,
    KEYS.favorites,
    KEYS.preferences,
    KEYS.onboarding,
    KEYS.guestOnboarding,
    're_jc_registered_guest_email',
    're_jc_registered_guest_password',
  ]);
}
