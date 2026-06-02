import type { Href } from 'expo-router';

/** Rutas tipadas (hasta que expo regenere router.d.ts con /onboarding) */
export const routes = {
  welcome: '/' as Href,
  onboarding: '/(main)/onboarding' as Href,
  tabs: '/(main)/(tabs)' as Href,
  profile: '/(main)/(tabs)/profile' as Href,
  categories: '/(main)/(tabs)/categories' as Href,
  legal: '/(main)/(tabs)/legal' as Href,
  publish: '/(main)/(tabs)/publish' as Href,
} as const;
