declare namespace NodeJS {
  interface ProcessEnv {
    EXPO_PUBLIC_SUPABASE_URL?: string;
    EXPO_PUBLIC_SUPABASE_ANON_KEY?: string;
    EXPO_PUBLIC_DATA_SOURCE?: 'mock' | 'supabase';
    SUPABASE_SERVICE_ROLE_KEY?: string;
  }
}
