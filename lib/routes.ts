import type { Href } from 'expo-router';

/** Rutas tipadas (hasta que expo regenere router.d.ts con /onboarding) */
export const routes = {
  welcome: '/' as Href,
  onboarding: '/onboarding' as Href,
  tabs: '/(tabs)' as Href,
  profile: '/(tabs)/profile' as Href,
  categories: '/(tabs)/categories' as Href,
  legal: '/(tabs)/legal' as Href,
  publish: '/(tabs)/publish' as Href,
} as const;
