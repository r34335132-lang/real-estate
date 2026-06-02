/**
 * Configuración centralizada desde .env
 * Expo expone solo variables EXPO_PUBLIC_* al cliente.
 */
export const env = {
  supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL ?? '',
  supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',
  dataSource: (process.env.EXPO_PUBLIC_DATA_SOURCE ?? 'supabase') as 'supabase',
} as const;

export function isSupabaseConfigured(): boolean {
  return Boolean(env.supabaseUrl && env.supabaseAnonKey && !env.supabaseUrl.includes('TU_PROYECTO'));
}

export function useSupabase(): boolean {
  return env.dataSource === 'supabase' && isSupabaseConfigured();
}
